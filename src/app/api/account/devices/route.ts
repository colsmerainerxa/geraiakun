import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { auth } from "@/auth"
import { hashTrustedDevice } from "@/lib/server/device-security"
import { serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { rejectUntrustedRequestOrigin } from "@/lib/server/request-security"
import { parseDeviceMutation } from "@/lib/server/trusted-device-policy"
import {
  clearBrowserSecret,
  getBrowserSecret,
  revokeAllUserAuth,
  revokeTrustedDevice,
} from "@/lib/server/trusted-devices"

export const runtime = "nodejs"

const privateHeaders = { "Cache-Control": "private, no-store" }

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: privateHeaders })
  }

  const now = new Date()
  const retentionStart = new Date(now.getTime() - 30 * 24 * 60 * 60_000)
  const secret = await getBrowserSecret()
  const currentHash = secret
    ? hashTrustedDevice(session.user.id, secret, serverEnv.AUTH_TOKEN_PEPPER)
    : null
  const devices = await prisma.trustedDevice.findMany({
    where: {
      userId: session.user.id,
      OR: [{ expiresAt: { gt: retentionStart } }, { revokedAt: { gt: retentionStart } }],
    },
    orderBy: { lastUsedAt: "desc" },
  })

  return NextResponse.json(
    devices.map((device) => ({
      id: device.id,
      label: device.label,
      current: device.deviceHash === currentHash,
      status: device.revokedAt ? "revoked" : device.expiresAt <= now ? "expired" : "active",
      createdAt: device.createdAt.toISOString(),
      lastUsedAt: device.lastUsedAt.toISOString(),
      expiresAt: device.expiresAt.toISOString(),
      revokedAt: device.revokedAt?.toISOString() ?? null,
    })),
    { headers: privateHeaders },
  )
}

export async function DELETE(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: privateHeaders })
  }

  try {
    const mutation = parseDeviceMutation(await request.json())
    if (mutation.mode === "all") {
      await prisma.$transaction((tx) => revokeAllUserAuth(tx, session.user.id, new Date()))
      await clearBrowserSecret()
      return NextResponse.json({ ok: true, signOut: true }, { headers: privateHeaders })
    }

    const result = await revokeTrustedDevice(session.user.id, mutation.deviceId)
    if (!result.revoked) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404, headers: privateHeaders },
      )
    }
    if (result.current) await clearBrowserSecret()
    return NextResponse.json(
      { ok: true, signOut: false, current: result.current },
      { headers: privateHeaders },
    )
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid device mutation" },
        { status: 400, headers: privateHeaders },
      )
    }
    console.error("Trusted device revocation failed", error)
    return NextResponse.json(
      { error: "Device revocation failed" },
      { status: 500, headers: privateHeaders },
    )
  }
}
