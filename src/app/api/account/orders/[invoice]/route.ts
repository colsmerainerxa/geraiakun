import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { serializeOrder } from "@/lib/server/serializers"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoice: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { invoice } = await params

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const order = await prisma.order.findFirst({
    where: { invoice, userId: session.user.id },
    include: { items: true, payments: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...serializeOrder(order),
    payments: order.payments,
  })
}
