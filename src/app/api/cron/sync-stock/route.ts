import { NextResponse } from "next/server"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

/**
 * Cron endpoint: sync ProductVariant.stock with actual AVAILABLE credential count.
 * Call via: GET /api/cron/sync-stock (protect with CRON_SECRET)
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
    return NextResponse.json({ ok: true, synced: 0 })
  }

  const variants = await prisma.productVariant.findMany({
    select: { id: true },
  })

  let synced = 0
  for (const variant of variants) {
    const available = await prisma.credentialStock.count({
      where: { variantId: variant.id, status: "AVAILABLE" },
    })
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: available },
    })
    synced++
  }

  return NextResponse.json({ ok: true, synced })
}
