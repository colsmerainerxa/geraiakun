import { createHash } from "node:crypto"
import midtransClient from "midtrans-client"
import { backendFlags, serverEnv } from "./env"
import type { paymentMethodToDb } from "./status"

type UiPaymentMethod = keyof typeof paymentMethodToDb

export interface MidtransCustomer {
  name: string
  email: string
  phone: string
}

export interface MidtransItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface CreateMidtransChargeInput {
  invoice: string
  amount: number
  method: UiPaymentMethod
  customer: MidtransCustomer
  items: MidtransItem[]
}

function coreApi() {
  return new midtransClient.CoreApi({
    isProduction: serverEnv.MIDTRANS_IS_PRODUCTION,
    serverKey: serverEnv.MIDTRANS_SERVER_KEY,
    clientKey: serverEnv.MIDTRANS_CLIENT_KEY,
  })
}

export function demoPaymentCode(invoice: string, method: UiPaymentMethod) {
  const digits = invoice.replace(/\D/g, "").slice(-10).padStart(10, "0")
  if (method === "qris") return `QR-${digits}`
  if (method.endsWith("-va")) return `8808${digits}`
  return `${method.toUpperCase()}-${digits.slice(-8)}`
}

function bankFor(method: UiPaymentMethod) {
  if (method === "bca-va") return "bca"
  if (method === "bni-va") return "bni"
  if (method === "mandiri-va") return "mandiri"
  return null
}

function chargePayload(input: CreateMidtransChargeInput) {
  const base = {
    transaction_details: {
      order_id: input.invoice,
      gross_amount: input.amount,
    },
    customer_details: {
      first_name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
    },
    item_details: input.items.map((item) => ({
      id: item.id,
      name: item.name.slice(0, 50),
      price: item.price,
      quantity: item.quantity,
    })),
  }

  const bank = bankFor(input.method)
  if (bank) {
    return {
      ...base,
      payment_type: "bank_transfer",
      bank_transfer: { bank },
    }
  }

  if (input.method === "gopay") {
    return {
      ...base,
      payment_type: "gopay",
      gopay: {
        enable_callback: true,
        callback_url: `${serverEnv.APP_URL}/pembayaran/${input.invoice}`,
      },
    }
  }

  return {
    ...base,
    payment_type: "qris",
    custom_field1: input.method === "qris" ? "qris" : `preferred:${input.method}`,
  }
}

function normalizeChargeResponse(
  invoice: string,
  method: UiPaymentMethod,
  amount: number,
  response: Record<string, unknown>,
) {
  const vaNumbers = Array.isArray(response.va_numbers)
    ? (response.va_numbers as { va_number?: string }[])
    : []
  const actions = Array.isArray(response.actions) ? (response.actions as { url?: string }[]) : []
  const paymentCode =
    vaNumbers[0]?.va_number ??
    (response.permata_va_number as string | undefined) ??
    (response.bill_key as string | undefined) ??
    (response.transaction_id as string | undefined) ??
    demoPaymentCode(invoice, method)

  const qrPayload =
    (response.qr_string as string | undefined) ??
    actions.find((action) => action.url)?.url ??
    (method === "qris"
      ? `00020101021226670016ID.GERAIAKUN.WWW0118${invoice}520458125303360540${amount}5802ID`
      : null)

  return {
    paymentCode,
    qrPayload,
    midtransTransactionId: (response.transaction_id as string | undefined) ?? null,
    rawResponse: response,
  }
}

export async function createMidtransCharge(input: CreateMidtransChargeInput) {
  if (!backendFlags.midtransConfigured) {
    return {
      paymentCode: demoPaymentCode(input.invoice, input.method),
      qrPayload:
        input.method === "qris"
          ? `00020101021226670016ID.GERAIAKUN.WWW0118${input.invoice}520458125303360540${input.amount}5802ID`
          : null,
      midtransTransactionId: null,
      rawResponse: { mode: "demo", invoice: input.invoice, method: input.method },
    }
  }

  const response = await coreApi().charge(chargePayload(input))
  return normalizeChargeResponse(input.invoice, input.method, input.amount, response)
}

export async function normalizeMidtransNotification(payload: Record<string, unknown>) {
  if (!backendFlags.midtransConfigured) return payload
  return coreApi().transaction.notification(payload)
}

export function isValidMidtransSignature(payload: Record<string, unknown>) {
  if (!backendFlags.midtransConfigured) return true
  const orderId = String(payload.order_id ?? "")
  const statusCode = String(payload.status_code ?? "")
  const grossAmount = String(payload.gross_amount ?? "")
  const signature = String(payload.signature_key ?? "")
  const expected = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverEnv.MIDTRANS_SERVER_KEY}`)
    .digest("hex")
  return signature === expected
}
