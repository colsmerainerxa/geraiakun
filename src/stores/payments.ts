"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { PaymentAttempt, PaymentMethod, PaymentStatus } from "@/types"

interface CreatePaymentInput {
  invoice: string
  method: PaymentMethod
  amount: number
}

interface PaymentState {
  attempts: PaymentAttempt[]
  createAttempt: (input: CreatePaymentInput) => PaymentAttempt
  upsertAttempt: (attempt: PaymentAttempt) => void
  getByInvoice: (invoice: string) => PaymentAttempt | undefined
  setStatus: (invoice: string, status: PaymentStatus, failureReason?: string | null) => void
  changeMethod: (invoice: string, method: PaymentMethod) => void
  retry: (invoice: string) => void
}

function paymentCode(invoice: string, method: PaymentMethod) {
  const digits = invoice.replace(/\D/g, "").slice(-10).padStart(10, "0")
  if (method === "qris") return `QR-${digits}`
  if (method.endsWith("-va")) return `8808${digits}`
  return `${method.toUpperCase()}-${digits.slice(-8)}`
}

function buildAttempt(input: CreatePaymentInput): PaymentAttempt {
  const now = new Date()
  return {
    id: `pay-${input.invoice}-${Date.now()}`,
    invoice: input.invoice,
    method: input.method,
    status: "pending",
    amount: input.amount,
    paymentCode: paymentCode(input.invoice, input.method),
    qrPayload:
      input.method === "qris"
        ? `00020101021226670016ID.GERAIAKUN.WWW0118${input.invoice}520458125303360540${input.amount}5802ID`
        : null,
    expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    failureReason: null,
  }
}

export const usePayments = create<PaymentState>()(
  persist(
    (set, get) => ({
      attempts: [],
      createAttempt: (input) => {
        const attempt = buildAttempt(input)
        set((state) => ({
          attempts: [attempt, ...state.attempts.filter((item) => item.invoice !== input.invoice)],
        }))
        return attempt
      },
      upsertAttempt: (attempt) =>
        set((state) => ({
          attempts: [attempt, ...state.attempts.filter((item) => item.id !== attempt.id)],
        })),
      getByInvoice: (invoice) =>
        get().attempts.find((item) => item.invoice.toLowerCase() === invoice.toLowerCase()),
      setStatus: (invoice, status, failureReason = null) =>
        set((state) => ({
          attempts: state.attempts.map((item) =>
            item.invoice === invoice
              ? {
                  ...item,
                  status,
                  failureReason,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        })),
      changeMethod: (invoice, method) =>
        set((state) => ({
          attempts: state.attempts.map((item) =>
            item.invoice === invoice
              ? {
                  ...item,
                  method,
                  status: "pending",
                  paymentCode: paymentCode(invoice, method),
                  qrPayload:
                    method === "qris"
                      ? `00020101021226670016ID.GERAIAKUN.WWW0118${invoice}520458125303360540${item.amount}5802ID`
                      : null,
                  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                  updatedAt: new Date().toISOString(),
                  failureReason: null,
                }
              : item,
          ),
        })),
      retry: (invoice) =>
        set((state) => ({
          attempts: state.attempts.map((item) =>
            item.invoice === invoice
              ? {
                  ...item,
                  status: "pending",
                  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                  updatedAt: new Date().toISOString(),
                  failureReason: null,
                }
              : item,
          ),
        })),
    }),
    { name: "geraiakun-payments" },
  ),
)
