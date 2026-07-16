import { cookies } from "next/headers"
import type { Prisma } from "@/generated/prisma/client"
import {
  createBrowserSecret,
  deviceLabel,
  hashTrustedDevice,
  hashUserAgent,
} from "@/lib/server/device-security"
import { serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

type DeviceState = {
  expiresAt: Date
  revokedAt: Date | null
  userAgentHash: string
}

export const TRUST_DAYS = serverEnv.TRUSTED_DEVICE_DAYS

export function trustedDeviceCookieName() {
  return process.env.NODE_ENV === "production" ? "__Secure-geraiakun-device" : "geraiakun-device"
}

export function deviceIsTrusted(record: DeviceState, userAgentHash: string, now = new Date()) {
  return (
    record.revokedAt === null &&
    record.expiresAt.getTime() > now.getTime() &&
    record.userAgentHash === userAgentHash
  )
}

export async function getBrowserSecret() {
  const store = await cookies()
  return store.get(trustedDeviceCookieName())?.value ?? null
}

export async function getOrCreateBrowserSecret() {
  const store = await cookies()
  const existing = store.get(trustedDeviceCookieName())?.value
  if (existing) return existing

  const secret = createBrowserSecret()
  store.set(trustedDeviceCookieName(), secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TRUST_DAYS * 24 * 60 * 60,
    priority: "high",
  })
  return secret
}

export async function clearBrowserSecret() {
  const store = await cookies()
  store.delete(trustedDeviceCookieName())
}

export async function findTrustedDevice(userId: string, secret: string, userAgent: string) {
  const deviceHash = hashTrustedDevice(userId, secret, serverEnv.AUTH_TOKEN_PEPPER)
  const userAgentHash = hashUserAgent(userAgent, serverEnv.AUTH_TOKEN_PEPPER)
  const record = await prisma.trustedDevice.findUnique({
    where: { userId_deviceHash: { userId, deviceHash } },
  })

  if (!record || !deviceIsTrusted(record, userAgentHash)) return null

  return prisma.trustedDevice.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  })
}

export async function trustCurrentBrowser(userId: string, secret: string, userAgent: string) {
  const now = new Date()
  const deviceHash = hashTrustedDevice(userId, secret, serverEnv.AUTH_TOKEN_PEPPER)
  const userAgentHash = hashUserAgent(userAgent, serverEnv.AUTH_TOKEN_PEPPER)

  return prisma.trustedDevice.upsert({
    where: { userId_deviceHash: { userId, deviceHash } },
    create: {
      userId,
      deviceHash,
      userAgentHash,
      label: deviceLabel(userAgent),
      expiresAt: new Date(now.getTime() + TRUST_DAYS * 24 * 60 * 60_000),
      lastUsedAt: now,
    },
    update: {
      userAgentHash,
      label: deviceLabel(userAgent),
      expiresAt: new Date(now.getTime() + TRUST_DAYS * 24 * 60 * 60_000),
      revokedAt: null,
      lastUsedAt: now,
    },
  })
}

export async function revokeTrustedDevice(userId: string, deviceId: string) {
  const secret = await getBrowserSecret()
  const currentHash = secret ? hashTrustedDevice(userId, secret, serverEnv.AUTH_TOKEN_PEPPER) : null
  const now = new Date()
  const result = await prisma.trustedDevice.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { revokedAt: now },
  })
  const record = await prisma.trustedDevice.findFirst({
    where: { id: deviceId, userId },
    select: { deviceHash: true },
  })

  return { revoked: result.count === 1, current: record?.deviceHash === currentHash }
}

export async function revokeAllUserAuth(
  tx: Prisma.TransactionClient,
  userId: string,
  now = new Date(),
) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } })

  await Promise.all([
    tx.trustedDevice.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    }),
    tx.loginOtpChallenge.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: now },
    }),
    user?.email
      ? tx.accountToken.updateMany({
          where: { email: user.email, purpose: "LOGIN_GRANT", consumedAt: null },
          data: { consumedAt: now },
        })
      : Promise.resolve(),
  ])

  await tx.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  })
}
