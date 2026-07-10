import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { decryptSecret } from "@/lib/server/crypto"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

const statusMap = {
  ACTIVE: "aktif",
  EXPIRING: "akan-habis",
  HELD: "ditahan",
  ISSUE: "bermasalah",
} as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json([])
  }

  const accounts = await prisma.vaultAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(
    accounts.map((account) => ({
      id: account.id,
      orderInvoice: account.orderInvoice,
      productId: account.productId,
      productSlug: account.productSlug,
      variantId: account.variantId,
      productName: account.productName,
      plan: account.plan,
      loginEmail: decryptSecret(account.loginEmailEncrypted) ?? "vault@geraiakun.id",
      status: statusMap[account.status],
      expiresAt: account.expiresAt?.toISOString() ?? account.warrantyUntil.toISOString(),
      warrantyUntil: account.warrantyUntil.toISOString(),
      reorderPrice: account.reorderPrice,
      healthScore: account.healthScore,
      seats: account.seats,
      devices: account.devices,
      note: decryptSecret(account.noteEncrypted) ?? "",
    })),
  )
}
