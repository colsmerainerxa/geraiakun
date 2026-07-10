import { NextResponse } from "next/server"
import type { Prisma } from "@/generated/prisma/client"
import { backendFlags } from "@/lib/server/env"
import { isValidMidtransSignature, normalizeMidtransNotification } from "@/lib/server/midtrans"
import { prisma } from "@/lib/server/prisma"
import { mapMidtransStatus } from "@/lib/server/status"

export const runtime = "nodejs"

function eventKey(payload: Record<string, unknown>) {
  return [
    payload.order_id,
    payload.transaction_status,
    payload.transaction_id,
    String(payload.signature_key ?? "").slice(0, 24),
  ]
    .filter(Boolean)
    .join(":")
}

async function createFulfillmentQueue(orderId: string) {
  const existing = await prisma.fulfillmentTask.count({ where: { orderId } })
  if (existing > 0) return

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return

  const tasks = []
  for (const item of order.items) {
    const available = await prisma.credentialStock.count({
      where: {
        productId: item.productId,
        variantId: item.variantId,
        status: "AVAILABLE",
      },
    })
    for (let index = 0; index < item.qty; index += 1) {
      tasks.push({
        invoice: order.invoice,
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variant: item.variantLabel,
        customer: order.customerName,
        risk: order.total >= 500000 ? "sedang" : "rendah",
        slaMinutes: available > index ? 15 : 30,
        status: available > index ? ("READY_TO_SEND" as const) : ("WAITING_STOCK" as const),
      })
    }
  }

  if (tasks.length > 0) {
    await prisma.fulfillmentTask.createMany({ data: tasks })
  }
}

export async function POST(request: Request) {
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json(
      { ok: false, message: "DATABASE_URL is not configured" },
      { status: 503 },
    )
  }

  const payload = (await request.json()) as Record<string, unknown>
  if (!isValidMidtransSignature(payload)) {
    return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 401 })
  }

  const normalized = await normalizeMidtransNotification(payload)
  const key = eventKey(normalized)
  if (!key) {
    return NextResponse.json(
      { ok: false, message: "Invalid notification payload" },
      { status: 400 },
    )
  }

  const existing = await prisma.midtransEvent.findUnique({ where: { eventKey: key } })
  if (existing) return NextResponse.json({ ok: true, duplicate: true })

  const invoice = String(normalized.order_id ?? "")
  const transactionStatus = String(normalized.transaction_status ?? "")
  const fraudStatus = String(normalized.fraud_status ?? "")
  const mapped = mapMidtransStatus(transactionStatus, fraudStatus)

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { invoice } })
    if (!order) {
      await tx.midtransEvent.create({
        data: {
          eventKey: key,
          orderId: invoice || null,
          transactionId: String(normalized.transaction_id ?? "") || null,
          transactionStatus,
          fraudStatus,
          signatureKey: String(normalized.signature_key ?? "") || null,
          payload: normalized as Prisma.InputJsonValue,
        },
      })
      return { orderFound: false, orderId: null, paid: false }
    }

    const payment = await tx.paymentAttempt.findFirst({
      where: { invoice },
      orderBy: { createdAt: "desc" },
    })

    if (payment) {
      await tx.paymentAttempt.update({
        where: { id: payment.id },
        data: {
          status: mapped.paymentStatus,
          midtransTransactionId:
            String(normalized.transaction_id ?? "") || payment.midtransTransactionId,
          failureReason:
            mapped.paymentStatus === "FAILED"
              ? String(normalized.status_message ?? "Transaksi ditolak Midtrans.")
              : null,
          rawResponse: normalized as Prisma.InputJsonValue,
        },
      })
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: mapped.orderStatus,
        paidAt: mapped.paymentStatus === "PAID" ? new Date() : order.paidAt,
      },
    })

    await tx.midtransEvent.create({
      data: {
        eventKey: key,
        orderId: invoice,
        transactionId: String(normalized.transaction_id ?? "") || null,
        transactionStatus,
        fraudStatus,
        signatureKey: String(normalized.signature_key ?? "") || null,
        payload: normalized as Prisma.InputJsonValue,
      },
    })

    return {
      orderFound: true,
      orderId: order.id,
      paid: mapped.paymentStatus === "PAID",
    }
  })

  if (result.orderId && result.paid) {
    await createFulfillmentQueue(result.orderId)
  }

  return NextResponse.json({ ok: true, ...result })
}
