import { randomUUID } from "node:crypto"
import { createLoginOtp, hashLoginOtp, matchesLoginOtp } from "@/lib/server/device-security"
import { serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const OTP_TTL_MS = 10 * 60_000
const RESEND_COOLDOWN_MS = 60_000
const MAX_FAILED_ATTEMPTS = 5
const MAX_SENDS = 3

type ChallengeState = {
  consumedAt: Date | null
  expiresAt: Date
  failedAttempts: number
  deviceHash: string
  userAgentHash: string
}

type ChallengeContext = {
  deviceHash: string
  userAgentHash: string
}

export function challengeDecision(
  challenge: ChallengeState,
  context: ChallengeContext,
  now = new Date(),
) {
  if (challenge.consumedAt) return "invalid" as const
  if (challenge.failedAttempts >= MAX_FAILED_ATTEMPTS) return "exhausted" as const
  if (challenge.expiresAt.getTime() <= now.getTime()) return "expired" as const
  if (
    challenge.deviceHash !== context.deviceHash ||
    challenge.userAgentHash !== context.userAgentHash
  ) {
    return "mismatch" as const
  }
  return "allow" as const
}

export async function createLoginOtpChallenge({
  userId,
  deviceHash,
  userAgentHash,
  locale,
  now = new Date(),
}: {
  userId: string
  deviceHash: string
  userAgentHash: string
  locale: "id" | "en"
  now?: Date
}) {
  const challengeId = randomUUID()
  const code = createLoginOtp()
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS)
  const resendAt = new Date(now.getTime() + RESEND_COOLDOWN_MS)

  await prisma.$transaction([
    prisma.loginOtpChallenge.updateMany({
      where: { userId, deviceHash, consumedAt: null },
      data: { consumedAt: now },
    }),
    prisma.loginOtpChallenge.create({
      data: {
        id: challengeId,
        userId,
        deviceHash,
        userAgentHash,
        codeHash: hashLoginOtp(challengeId, code, serverEnv.AUTH_TOKEN_PEPPER),
        locale,
        lastSentAt: now,
        expiresAt,
      },
    }),
  ])

  return { challengeId, code, expiresAt, resendAt }
}

export async function consumeLoginOtpChallenge(challengeId: string, now = new Date()) {
  await prisma.loginOtpChallenge.updateMany({
    where: { id: challengeId, consumedAt: null },
    data: { consumedAt: now },
  })
}

export async function verifyLoginOtpChallenge({
  challengeId,
  code,
  deviceHash,
  userAgentHash,
  now = new Date(),
}: {
  challengeId: string
  code: string
  deviceHash: string
  userAgentHash: string
  now?: Date
}) {
  return prisma.$transaction(async (tx) => {
    const challenge = await tx.loginOtpChallenge.findUnique({ where: { id: challengeId } })
    if (!challenge) return { ok: false as const, reason: "invalid" as const }

    const decision = challengeDecision(challenge, { deviceHash, userAgentHash }, now)
    if (decision !== "allow") return { ok: false as const, reason: decision }

    if (!matchesLoginOtp(challenge.codeHash, challenge.id, code, serverEnv.AUTH_TOKEN_PEPPER)) {
      const failed = await tx.loginOtpChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          failedAttempts: { lt: MAX_FAILED_ATTEMPTS },
          expiresAt: { gt: now },
        },
        data: { failedAttempts: { increment: 1 } },
      })
      if (failed.count !== 1) {
        return { ok: false as const, reason: "exhausted" as const }
      }
      return {
        ok: false as const,
        reason:
          challenge.failedAttempts + 1 >= MAX_FAILED_ATTEMPTS
            ? ("exhausted" as const)
            : ("invalid" as const),
      }
    }

    const claimed = await tx.loginOtpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        failedAttempts: { lt: MAX_FAILED_ATTEMPTS },
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    })
    if (claimed.count !== 1) return { ok: false as const, reason: "invalid" as const }

    return { ok: true as const, userId: challenge.userId }
  })
}

export async function resendLoginOtpChallenge({
  challengeId,
  deviceHash,
  userAgentHash,
  now = new Date(),
}: {
  challengeId: string
  deviceHash: string
  userAgentHash: string
  now?: Date
}) {
  return prisma.$transaction(async (tx) => {
    const challenge = await tx.loginOtpChallenge.findUnique({ where: { id: challengeId } })
    if (!challenge) return { ok: false as const, reason: "invalid" as const }
    if (challenge.sendCount >= MAX_SENDS) {
      return { ok: false as const, reason: "exhausted" as const }
    }
    if (challengeDecision(challenge, { deviceHash, userAgentHash }, now) !== "allow") {
      return { ok: false as const, reason: "invalid" as const }
    }

    const resendAt = new Date(challenge.lastSentAt.getTime() + RESEND_COOLDOWN_MS)
    if (resendAt.getTime() > now.getTime()) {
      return { ok: false as const, reason: "cooldown" as const, resendAt }
    }

    const code = createLoginOtp()
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS)
    const nextResendAt = new Date(now.getTime() + RESEND_COOLDOWN_MS)
    const updated = await tx.loginOtpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        sendCount: challenge.sendCount,
        failedAttempts: { lt: MAX_FAILED_ATTEMPTS },
        expiresAt: { gt: now },
      },
      data: {
        codeHash: hashLoginOtp(challenge.id, code, serverEnv.AUTH_TOKEN_PEPPER),
        failedAttempts: 0,
        sendCount: { increment: 1 },
        lastSentAt: now,
        expiresAt,
      },
    })
    if (updated.count !== 1) return { ok: false as const, reason: "invalid" as const }

    return { ok: true as const, code, expiresAt, resendAt: nextResendAt }
  })
}
