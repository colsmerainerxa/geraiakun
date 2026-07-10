import { NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma/client"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { createMidtransCharge, demoPaymentCode } from "@/lib/server/midtrans"
import { prisma } from "@/lib/server/prisma"
import { serializePaymentAttempt } from "@/lib/server/serializers"
import { paymentMethodToDb } from "@/lib/server/status"
import type { PaymentMethod } from "@/types"

const postSchema = z.object({
  invoice: z.string().min(1),
  method: z.enum(["qris", "gopay", "ovo", "dana", "bca-va", "bni-va", "mandiri-va"]),
})

export const runtime = "nodejs"

function demoAttempt(invoice: string, method: PaymentMethod, amount = 0) {
  const now = new Date()
  return {
    id: `pay-${invoice}`,
    invoice,
    method,
    status: "pending" as const,
    amount,
    paymentCode: demoPaymentCode(invoice, method),
    qrPayload:
      method === "qris"
        ? `00020101021226670016ID.GERAIAKUN.WWW0118${invoice}520458125303360540${amount}5802ID`
        : null,
    expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    failureReason: null,
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = postSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }
  const { invoice, method } = parsed.data as { invoice: string; method: PaymentMethod }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json(demoAttempt(invoice, method))
  }

  const order = await prisma.order.findFirst({
    where: { invoice, userId: session.user.id },
    include: { items: true },
  })
  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 })
  }

  const charge = await createMidtransCharge({
    invoice,
    amount: order.total,
    method,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.whatsapp,
    },
    items: order.items.map((item) => ({
      id: item.variantId,
      name: `${item.productName} ${item.variantLabel}`,
      price: item.price,
      quantity: item.qty,
    })),
  })

  const payment = await prisma.paymentAttempt.create({
    data: {
      invoice,
      orderId: order.id,
      method: paymentMethodToDb[method],
      status: "PENDING",
      amount: order.total,
      paymentCode: charge.paymentCode,
      qrPayload: charge.qrPayload,
      midtransOrderId: `${invoice}-${Date.now()}`,
      midtransTransactionId: charge.midtransTransactionId,
      rawResponse: charge.rawResponse as Prisma.InputJsonValue,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "WAITING_PAYMENT", paymentMethod: paymentMethodToDb[method] },
  })

  return NextResponse.json(serializePaymentAttempt(payment))
}
