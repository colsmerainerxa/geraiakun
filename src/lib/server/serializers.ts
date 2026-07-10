import type { Order, PaymentStatus } from "@/types"
import type { PaymentAttempt } from "@/types/enterprise"
import { orderStatusFromDb, paymentMethodFromDb, paymentStatusFromDb } from "./status"

export function serializePaymentAttempt(payment: {
  id: string
  invoice: string
  method: keyof typeof paymentMethodFromDb
  status: keyof typeof paymentStatusFromDb
  amount: number
  paymentCode: string
  qrPayload: string | null
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  failureReason: string | null
}): PaymentAttempt {
  return {
    id: payment.id,
    invoice: payment.invoice,
    method: paymentMethodFromDb[payment.method],
    status: paymentStatusFromDb[payment.status] as PaymentStatus,
    amount: payment.amount,
    paymentCode: payment.paymentCode,
    qrPayload: payment.qrPayload,
    expiresAt: payment.expiresAt.toISOString(),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    failureReason: payment.failureReason,
  }
}

export function serializeOrder(order: {
  id: string
  invoice: string
  customerName: string
  customerEmail: string
  whatsapp: string
  subtotal: number
  discount: number
  fee: number
  total: number
  status: keyof typeof orderStatusFromDb
  paymentMethod: keyof typeof paymentMethodFromDb
  createdAt: Date
  paidAt: Date | null
  items: {
    productId: string
    productName: string
    productLogo: string
    variantId: string
    variantLabel: string
    price: number
    qty: number
  }[]
}): Order {
  return {
    id: order.id,
    invoice: order.invoice,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    whatsapp: order.whatsapp,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productLogo: item.productLogo,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      price: item.price,
      qty: item.qty,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    fee: order.fee,
    total: order.total,
    status: orderStatusFromDb[order.status],
    paymentMethod: paymentMethodFromDb[order.paymentMethod],
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    credentials: [],
  }
}
