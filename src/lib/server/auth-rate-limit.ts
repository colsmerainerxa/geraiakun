import type { AuthSecurityAction } from "@/generated/prisma/enums"
import {
  AUTH_RATE_POLICIES,
  type AuthRateAction,
  evaluateAuthRateLimit,
  hashIdentifier,
} from "@/lib/server/auth-security"
import { serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const prismaAction: Record<AuthRateAction, AuthSecurityAction> = {
  login: "LOGIN",
  register: "REGISTER",
  passwordReset: "PASSWORD_RESET",
  verificationResend: "VERIFICATION_RESEND",
  loginOtpSend: "LOGIN_OTP_SEND",
  loginOtpVerify: "LOGIN_OTP_VERIFY",
}

let lastCleanupAt = 0

async function cleanupOldAuthEvents() {
  const now = Date.now()
  if (now - lastCleanupAt <= 60 * 60_000) return
  lastCleanupAt = now
  await prisma.authSecurityEvent.deleteMany({
    where: { createdAt: { lt: new Date(now - 24 * 60 * 60_000) } },
  })
}

export function getTrustedClientIp(headers: Headers) {
  if (!serverEnv.AUTH_TRUST_PROXY_HEADERS) return null
  const value =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]
  return value?.trim() || null
}

function rateKeys(identity: string, ip: string | null | undefined) {
  return {
    identityHash: hashIdentifier("email", identity, serverEnv.AUTH_TOKEN_PEPPER),
    ipHash: ip ? hashIdentifier("ip", ip, serverEnv.AUTH_TOKEN_PEPPER) : null,
  }
}

export async function checkAuthRateLimit({
  action,
  identity,
  ip,
  now = new Date(),
}: {
  action: AuthRateAction
  identity: string
  ip?: string | null
  now?: Date
}) {
  const policy = AUTH_RATE_POLICIES[action]
  const keys = rateKeys(identity, ip)
  const identitySince = new Date(now.getTime() - policy.identity.windowMs)
  const ipSince = policy.ip ? new Date(now.getTime() - policy.ip.windowMs) : null

  const [identityEvents, ipEvents] = await Promise.all([
    prisma.authSecurityEvent.findMany({
      where: {
        action: prismaAction[action],
        identityHash: keys.identityHash,
        success: false,
        createdAt: { gt: identitySince },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    keys.ipHash && ipSince
      ? prisma.authSecurityEvent.findMany({
          where: {
            action: prismaAction[action],
            ipHash: keys.ipHash,
            success: false,
            createdAt: { gt: ipSince },
          },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ])

  return evaluateAuthRateLimit({
    action,
    identityTimestamps: identityEvents.map((event) => event.createdAt.getTime()),
    ipTimestamps: ipEvents.map((event) => event.createdAt.getTime()),
    now: now.getTime(),
  })
}

function isSerializableConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  )
}

export async function claimAuthRateLimit({
  action,
  identity,
  ip,
  now = new Date(),
}: {
  action: AuthRateAction
  identity: string
  ip?: string | null
  now?: Date
}) {
  const policy = AUTH_RATE_POLICIES[action]
  const keys = rateKeys(identity, ip)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const identitySince = new Date(now.getTime() - policy.identity.windowMs)
          const ipSince = policy.ip ? new Date(now.getTime() - policy.ip.windowMs) : null
          const [identityEvents, ipEvents] = await Promise.all([
            tx.authSecurityEvent.findMany({
              where: {
                action: prismaAction[action],
                identityHash: keys.identityHash,
                success: false,
                createdAt: { gt: identitySince },
              },
              select: { createdAt: true },
              orderBy: { createdAt: "asc" },
            }),
            keys.ipHash && ipSince
              ? tx.authSecurityEvent.findMany({
                  where: {
                    action: prismaAction[action],
                    ipHash: keys.ipHash,
                    success: false,
                    createdAt: { gt: ipSince },
                  },
                  select: { createdAt: true },
                  orderBy: { createdAt: "asc" },
                })
              : Promise.resolve([]),
          ])
          const result = evaluateAuthRateLimit({
            action,
            identityTimestamps: identityEvents.map((event) => event.createdAt.getTime()),
            ipTimestamps: ipEvents.map((event) => event.createdAt.getTime()),
            now: now.getTime(),
          })
          if (result.allowed) {
            await tx.authSecurityEvent.create({
              data: {
                action: prismaAction[action],
                identityHash: keys.identityHash,
                ipHash: keys.ipHash,
                success: false,
                createdAt: now,
              },
            })
          }
          return result
        },
        { isolationLevel: "Serializable" },
      )
      await cleanupOldAuthEvents()
      return result
    } catch (error) {
      if (!isSerializableConflict(error) || attempt === 4) throw error
    }
  }

  throw new Error("Unable to reserve auth rate limit")
}

export async function recordAuthSecurityEvent({
  action,
  identity,
  ip,
  success = false,
}: {
  action: AuthRateAction
  identity: string
  ip?: string | null
  success?: boolean
}) {
  const keys = rateKeys(identity, ip)
  await prisma.authSecurityEvent.create({
    data: {
      action: prismaAction[action],
      identityHash: keys.identityHash,
      ipHash: keys.ipHash,
      success,
    },
  })

  await cleanupOldAuthEvents()
}

export async function clearLoginFailures(identity: string) {
  const { identityHash } = rateKeys(identity, null)
  await prisma.authSecurityEvent.deleteMany({
    where: { action: "LOGIN", identityHash, success: false },
  })
}
