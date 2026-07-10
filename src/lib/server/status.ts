import type {
  OrderStatus as DbOrderStatus,
  PaymentStatus as DbPaymentStatus,
} from "@/generated/prisma/client"
import type {
  OrderStatus as UiOrderStatus,
  PaymentMethod as UiPaymentMethod,
  PaymentStatus as UiPaymentStatus,
  TicketPriority as UiTicketPriority,
  TicketType as UiTicketType,
} from "@/types"

export const paymentMethodToDb = {
  qris: "QRIS",
  gopay: "GOPAY",
  ovo: "OVO",
  dana: "DANA",
  "bca-va": "BCA_VA",
  "bni-va": "BNI_VA",
  "mandiri-va": "MANDIRI_VA",
} as const satisfies Record<UiPaymentMethod, string>

export const paymentMethodFromDb = {
  QRIS: "qris",
  GOPAY: "gopay",
  OVO: "ovo",
  DANA: "dana",
  BCA_VA: "bca-va",
  BNI_VA: "bni-va",
  MANDIRI_VA: "mandiri-va",
} as const

export const paymentStatusFromDb = {
  PENDING: "pending",
  CHECKING: "checking",
  PAID: "paid",
  EXPIRED: "expired",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const satisfies Record<string, UiPaymentStatus>

export const orderStatusFromDb = {
  WAITING_PAYMENT: "menunggu-pembayaran",
  PROCESSING: "diproses",
  COMPLETED: "selesai",
  CANCELLED: "dibatalkan",
  REFUND: "refund",
} as const satisfies Record<string, UiOrderStatus>

export const ticketTypeToDb = {
  garansi: "WARRANTY",
  pembayaran: "PAYMENT",
  akun: "ACCOUNT",
  lainnya: "OTHER",
} as const satisfies Record<UiTicketType, string>

export const ticketPriorityToDb = {
  rendah: "LOW",
  normal: "NORMAL",
  tinggi: "HIGH",
} as const satisfies Record<UiTicketPriority, string>

export function mapMidtransStatus(
  transactionStatus: string | undefined,
  fraudStatus?: string,
): { paymentStatus: DbPaymentStatus; orderStatus: DbOrderStatus } {
  if (transactionStatus === "settlement") {
    return { paymentStatus: "PAID", orderStatus: "PROCESSING" }
  }
  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") return { paymentStatus: "CHECKING", orderStatus: "PROCESSING" }
    return { paymentStatus: "PAID", orderStatus: "PROCESSING" }
  }
  if (transactionStatus === "pending") {
    return { paymentStatus: "PENDING", orderStatus: "WAITING_PAYMENT" }
  }
  if (transactionStatus === "expire") {
    return { paymentStatus: "EXPIRED", orderStatus: "CANCELLED" }
  }
  if (transactionStatus === "cancel") {
    return { paymentStatus: "CANCELLED", orderStatus: "CANCELLED" }
  }
  if (transactionStatus === "deny") {
    return { paymentStatus: "FAILED", orderStatus: "WAITING_PAYMENT" }
  }
  return { paymentStatus: "CHECKING", orderStatus: "PROCESSING" }
}
