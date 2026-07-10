"use server"

import { z } from "zod"
import { auth } from "@/auth"
import type { Prisma } from "@/generated/prisma/client"
import { products as mockProducts } from "@/lib/mock/products"
import { getPromo as getMockPromo } from "@/lib/mock/transactions"
import { computeDiscount } from "@/lib/promo"
import { backendFlags } from "@/lib/server/env"
import { createMidtransCharge, demoPaymentCode } from "@/lib/server/midtrans"
import { prisma } from "@/lib/server/prisma"
import { serializeOrder, serializePaymentAttempt } from "@/lib/server/serializers"
import { paymentMethodToDb } from "@/lib/server/status"
import type { Order, Promo } from "@/types"
import type { PaymentAttempt } from "@/types/enterprise"

const FEE = 1000

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    whatsapp: z.string().min(8),
  }),
  paymentMethod: z.enum(["qris", "gopay", "ovo", "dana", "bca-va", "bni-va", "mandiri-va"]),
  promoCode: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
})

export type CheckoutActionInput = z.input<typeof checkoutSchema>

function makeInvoice() {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`
  const random = Math.floor(1000 + Math.random() * 9000)
  return `INV-${stamp}-${random}`
}

function expiresAt() {
  return new Date(Date.now() + 15 * 60 * 1000)
}

function promoDiscount(
  promo: {
    type: "PERCENT" | "NOMINAL"
    value: number
    minSpend: number
    maxDiscount: number | null
  } | null,
  subtotal: number,
) {
  if (!promo || subtotal < promo.minSpend) return 0
  const raw = promo.type === "PERCENT" ? Math.round((subtotal * promo.value) / 100) : promo.value
  const capped = promo.maxDiscount == null ? raw : Math.min(raw, promo.maxDiscount)
  return Math.min(capped, subtotal)
}

function demoCheckout(input: CheckoutActionInput): { order: Order; payment: PaymentAttempt } {
  const invoice = makeInvoice()
  const now = new Date()
  const items = input.items.map((item) => {
    const product = mockProducts.find((candidate) => candidate.id === item.productId)
    const variant = product?.variants.find((candidate) => candidate.id === item.variantId)
    if (!product || !variant) throw new Error("Produk tidak ditemukan.")
    return {
      productId: product.id,
      productName: product.name,
      productLogo: product.logo,
      variantId: variant.id,
      variantLabel: variant.label,
      price: variant.price,
      qty: item.qty,
    }
  })
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const promo = input.promoCode ? getMockPromo(input.promoCode) : null
  const discount = computeDiscount((promo as Promo | null) ?? null, subtotal)
  const total = subtotal - discount + FEE
  const paymentCode = demoPaymentCode(invoice, input.paymentMethod)

  return {
    order: {
      id: `ord-${invoice}`,
      invoice,
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      whatsapp: input.customer.whatsapp,
      items,
      subtotal,
      discount,
      fee: FEE,
      total,
      status: "menunggu-pembayaran",
      paymentMethod: input.paymentMethod,
      createdAt: now.toISOString(),
      paidAt: null,
      credentials: [],
    },
    payment: {
      id: `pay-${invoice}`,
      invoice,
      method: input.paymentMethod,
      status: "pending",
      amount: total,
      paymentCode,
      qrPayload:
        input.paymentMethod === "qris"
          ? `00020101021226670016ID.GERAIAKUN.WWW0118${invoice}520458125303360540${total}5802ID`
          : null,
      expiresAt: expiresAt().toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      failureReason: null,
    },
  }
}

export async function createCheckoutOrder(input: CheckoutActionInput) {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error("Data checkout belum valid.")
  }

  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("AUTH_REQUIRED")
  }

  if (!backendFlags.databaseConfigured) {
    return demoCheckout(parsed.data)
  }

  const invoice = makeInvoice()
  const method = paymentMethodToDb[parsed.data.paymentMethod]
  const expires = expiresAt()

  const created = await prisma.$transaction(async (tx) => {
    const variantIds = parsed.data.items.map((item) => item.variantId)
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds }, active: true },
      include: { product: true },
    })

    const lines = parsed.data.items.map((item) => {
      const variant = variants.find((candidate) => candidate.id === item.variantId)
      if (!variant || variant.productId !== item.productId || !variant.product.active) {
        throw new Error("Produk atau varian tidak ditemukan.")
      }
      if (variant.stock < item.qty) {
        throw new Error(`Stok ${variant.product.name} tidak mencukupi.`)
      }
      return {
        input: item,
        variant,
        product: variant.product,
      }
    })

    // Decrement stock atomically within transaction
    for (const line of lines) {
      const updated = await tx.productVariant.update({
        where: { id: line.variant.id },
        data: { stock: { decrement: line.input.qty } },
      })
      if (updated.stock < 0) {
        throw new Error(`Stok ${line.product.name} tidak mencukupi.`)
      }
    }

    const subtotal = lines.reduce((sum, line) => sum + line.variant.price * line.input.qty, 0)
    const promo = parsed.data.promoCode
      ? await tx.promo.findFirst({
          where: {
            code: parsed.data.promoCode.toUpperCase(),
            active: true,
            expiresAt: { gte: new Date() },
          },
        })
      : null
    if (promo && promo.used >= promo.quota) {
      throw new Error("Kuota promo telah habis.")
    }
    const discount = promoDiscount(promo, subtotal)
    const total = subtotal - discount + FEE

    const order = await tx.order.create({
      data: {
        invoice,
        userId: session.user.id,
        customerName: parsed.data.customer.name,
        customerEmail: parsed.data.customer.email.toLowerCase(),
        whatsapp: parsed.data.customer.whatsapp,
        subtotal,
        discount,
        fee: FEE,
        total,
        status: "WAITING_PAYMENT",
        paymentMethod: method,
        promoId: promo?.id,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            variantId: line.variant.id,
            productName: line.product.name,
            productLogo: line.product.logo,
            variantLabel: line.variant.label,
            price: line.variant.price,
            qty: line.input.qty,
          })),
        },
      },
      include: { items: true },
    })

    const payment = await tx.paymentAttempt.create({
      data: {
        invoice,
        orderId: order.id,
        method,
        status: "PENDING",
        amount: total,
        paymentCode: demoPaymentCode(invoice, parsed.data.paymentMethod),
        qrPayload: null,
        midtransOrderId: invoice,
        expiresAt: expires,
      },
    })

    if (promo && discount > 0) {
      // Atomic conditional increment — prevents race condition
      const claimed = await tx.promo.updateMany({
        where: { id: promo.id, used: { lt: promo.quota } },
        data: { used: { increment: 1 } },
      })
      if (claimed.count === 0) {
        throw new Error("Kuota promo telah habis.")
      }
    }

    return { order, payment, lines, total }
  })

  const charge = await createMidtransCharge({
    invoice,
    amount: created.total,
    method: parsed.data.paymentMethod,
    customer: {
      name: parsed.data.customer.name,
      email: parsed.data.customer.email,
      phone: parsed.data.customer.whatsapp,
    },
    items: created.lines.map((line) => ({
      id: line.variant.id,
      name: `${line.product.name} ${line.variant.label}`,
      price: line.variant.price,
      quantity: line.input.qty,
    })),
  })

  const payment = await prisma.paymentAttempt.update({
    where: { id: created.payment.id },
    data: {
      paymentCode: charge.paymentCode,
      qrPayload: charge.qrPayload,
      midtransTransactionId: charge.midtransTransactionId,
      rawResponse: charge.rawResponse as Prisma.InputJsonValue,
    },
  })

  return {
    order: serializeOrder(created.order),
    payment: serializePaymentAttempt(payment),
  }
}

export async function getOrderForCurrentUser(invoice: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  if (!backendFlags.databaseConfigured) return null

  const order = await prisma.order.findFirst({
    where: { invoice, userId: session.user.id },
    include: { items: true },
  })
  return order ? serializeOrder(order) : null
}
