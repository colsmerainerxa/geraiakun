import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const postSchema = z.object({
  orderId: z.string().optional(),
  productName: z.string().min(1),
  reason: z.string().min(1),
  amount: z.number(),
})

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

  const parsed = postSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }
  const { orderId, productName, reason, amount } = parsed.data

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
