import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json([])
  }

  const url = new URL(request.url)
  const productId = url.searchParams.get("productId") ?? undefined
  const variantId = url.searchParams.get("variantId") ?? undefined
  const status = url.searchParams.get("status") ?? undefined

  const where: Record<string, unknown> = {}
  if (productId) where.productId = productId
  if (variantId) where.variantId = variantId
  if (status) where.status = status

  const credentials = await prisma.credentialStock.findMany({
    where,
    orderBy: { addedAt: "desc" },
    select: {
      id: true,
      productId: true,
      variantId: true,
      productName: true,
      variantLabel: true,
      status: true,
      addedAt: true,
      soldAt: true,
    },
  })

  return NextResponse.json(credentials)
}
