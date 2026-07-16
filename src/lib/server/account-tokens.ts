import type { Prisma } from "@/generated/prisma/client"
import {
  type AccountTokenPurpose,
  createAccountToken,
  hashAccountToken,
} from "@/lib/server/auth-security"
import { serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { revokeAllUserAuth } from "@/lib/server/trusted-devices"

function normalizedEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function issueAccountToken({
  email,
  purpose,
  expiresInMinutes,
}: {
  email: string
  purpose: AccountTokenPurpose
  expiresInMinutes: number
}) {
  const now = new Date()
  const token = createAccountToken(purpose, serverEnv.AUTH_TOKEN_PEPPER)
  const normalized = normalizedEmail(email)
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60_000)

  await prisma.$transaction([
    prisma.accountToken.updateMany({
      where: { email: normalized, purpose, consumedAt: null },
      data: { consumedAt: now },
    }),
    prisma.accountToken.create({
      data: { email: normalized, purpose, tokenHash: token.hash, expiresAt },
    }),
  ])

  return { rawToken: token.raw, expiresAt }
}

export async function issueLoginGrant(email: string) {
  const token = createAccountToken("LOGIN_GRANT", serverEnv.AUTH_TOKEN_PEPPER)
  const normalized = normalizedEmail(email)
  const expiresAt = new Date(Date.now() + 2 * 60_000)

  await prisma.accountToken.create({
    data: {
      email: normalized,
      purpose: "LOGIN_GRANT",
      tokenHash: token.hash,
      expiresAt,
    },
  })

  return { rawToken: token.raw, expiresAt }
}

export async function consumeLoginGrant(rawToken: string) {
  const tokenHash = hashAccountToken(rawToken, "LOGIN_GRANT", serverEnv.AUTH_TOKEN_PEPPER)
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    const token = await tx.accountToken.findUnique({ where: { tokenHash } })
    if (token?.purpose !== "LOGIN_GRANT" || token.consumedAt || token.expiresAt <= now) {
      return null
    }

    const claimed = await tx.accountToken.updateMany({
      where: { id: token.id, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    })
    if (claimed.count !== 1) return null

    return tx.user.findUnique({
      where: { email: token.email },
      include: { adminStaff: { select: { status: true } } },
    })
  })
}

async function consumeToken(
  rawToken: string,
  purpose: AccountTokenPurpose,
  apply: (tx: Prisma.TransactionClient, email: string, now: Date) => Promise<unknown>,
) {
  const tokenHash = hashAccountToken(rawToken, purpose, serverEnv.AUTH_TOKEN_PEPPER)
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    const token = await tx.accountToken.findUnique({ where: { tokenHash } })
    if (!token || token.purpose !== purpose || token.consumedAt || token.expiresAt <= now) {
      return false
    }

    const claimed = await tx.accountToken.updateMany({
      where: { id: token.id, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    })
    if (claimed.count !== 1) return false

    await apply(tx, token.email, now)
    return true
  })
}

export function consumeEmailVerificationToken(rawToken: string) {
  return consumeToken(rawToken, "EMAIL_VERIFY", async (tx, email) => {
    const result = await tx.user.updateMany({
      where: { email },
      data: { emailVerified: new Date() },
    })
    if (result.count !== 1) throw new Error("Verification account no longer exists")
  })
}

export function consumePasswordResetToken(rawToken: string, passwordHash: string) {
  return consumeToken(rawToken, "PASSWORD_RESET", async (tx, email, now) => {
    const user = await tx.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    })
    if (!user?.passwordHash) throw new Error("Password account no longer exists")

    await revokeAllUserAuth(tx, user.id, now)
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } })
  })
}

export function consumeStaffInviteToken(rawToken: string, passwordHash: string) {
  return consumeToken(rawToken, "STAFF_INVITE", async (tx, email) => {
    const user = await tx.user.findUnique({
      where: { email },
      select: { id: true, adminStaff: { select: { id: true } } },
    })
    if (!user?.adminStaff) throw new Error("Staff invitation account no longer exists")

    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
        sessionVersion: { increment: 1 },
        adminStaff: { update: { status: "active" } },
      },
    })
  })
}
