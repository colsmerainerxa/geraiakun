import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json([])
  }

  const refunds = await prisma.refundCase.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(refunds)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const body = await req.json()
  const { orderId, productName, reason, amount } = body

  if (!productName || !reason || amount == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  let orderInvoice = ""
  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    orderInvoice = order?.invoice ?? ""
  }

  const refund = await prisma.refundCase.create({
    data: {
      userId: session.user.id,
      orderId: orderId || null,
      orderInvoice,
      productName,
      reason,
      amount: Number(amount),
    },
  })

  return NextResponse.json(refund, { status: 201 })
}
