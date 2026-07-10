import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

/**
 * Cron endpoint: expire pending payments past their 15-minute window.
 * Call via: GET /api/cron/expire-payments (protect with CRON_SECRET)
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get("secret")
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  function safeCompare(a: string | null, b: string | undefined): boolean {
    if (!a || !b) return false
    const ab = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ab.length !== bb.length) return false
    return timingSafeEqual(ab, bb)
  }
  if (!safeCompare(secret, cronSecret) && !safeCompare(authHeader, cronSecret ? `Bearer ${cronSecret}` : undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ ok: true, expired: 0 })
  }

  const now = new Date()
  const expired = await prisma.paymentAttempt.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  })

  // Cancel orders where all payment attempts expired
  const expiredInvoices = await prisma.paymentAttempt.findMany({
    where: { status: "EXPIRED" },
    select: { invoice: true },
    distinct: ["invoice"],
  })

  let cancelledOrders = 0
  for (const { invoice } of expiredInvoices) {
    const activeAttempts = await prisma.paymentAttempt.count({
      where: { invoice, status: { in: ["PENDING", "CHECKING"] } },
    })
    if (activeAttempts === 0) {
      const result = await prisma.order.updateMany({
        where: { invoice, status: "WAITING_PAYMENT" },
        data: { status: "CANCELLED" },
      })
      cancelledOrders += result.count
    }
  }

  return NextResponse.json({
    ok: true,
    expiredPayments: expired.count,
    cancelledOrders,
  })
}
