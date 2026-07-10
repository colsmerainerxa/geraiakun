"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const refundSchema = z.object({
  invoice: z.string().min(3),
  reason: z.string().min(10),
})

export async function requestRefund(input: z.input<typeof refundSchema>) {
  const parsed = refundSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data refund belum valid.")
  const session = await auth()
  if (!session?.user?.id) throw new Error("AUTH_REQUIRED")

  const id = `RF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  if (!backendFlags.databaseConfigured) return { id }

  const order = await prisma.order.findFirst({
    where: { invoice: parsed.data.invoice, userId: session.user.id },
    include: { items: true },
  })
  if (!order) throw new Error("Invoice tidak ditemukan.")

  const firstItem = order.items[0]
  const refund = await prisma.refundCase.create({
    data: {
      id,
      userId: session.user.id,
      orderId: order.id,
      orderInvoice: order.invoice,
      productId: firstItem?.productId,
      productName: firstItem?.productName ?? "Order geraiakun",
      reason: parsed.data.reason,
      amount: order.total,
      status: "DRAFT",
      timeline: [
        { label: "Draft dibuat", done: true },
        { label: "Review CS", done: false },
        { label: "Keputusan", done: false },
      ],
    },
  })

  return { id: refund.id }
}
