import { NextResponse } from "next/server"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

/**
 * Cron endpoint: update vault account statuses.
 * - ACTIVE → EXPIRING if within 3 days of expiry
 * - ACTIVE/EXPIRING → EXPIRED if past expiry date
 * Call via: GET /api/cron/vault-expiry (protect with CRON_SECRET)
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get("secret")
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (secret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ ok: true, expiring: 0, expired: 0 })
  }

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Mark EXPIRING: within 3 days of expiry
  const expiring = await prisma.vaultAccount.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gte: now, lte: threeDaysFromNow },
    },
    data: { status: "EXPIRING" },
  })

  // Mark ISSUE: past expiry date (enum has ACTIVE, EXPIRING, HELD, ISSUE — no EXPIRED)
  const expired = await prisma.vaultAccount.updateMany({
    where: {
      status: { in: ["ACTIVE", "EXPIRING"] },
      expiresAt: { lt: now },
    },
    data: { status: "ISSUE" },
  })

  return NextResponse.json({
    ok: true,
    expiring: expiring.count,
    expired: expired.count,
  })
}
