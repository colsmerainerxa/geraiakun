import type { ID, PaymentMethod } from "./index"

export type PaymentStatus = "pending" | "checking" | "paid" | "expired" | "failed" | "cancelled"

export interface PaymentAttempt {
  id: ID
  invoice: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  paymentCode: string
  qrPayload: string | null
  expiresAt: string
  createdAt: string
  updatedAt: string
  failureReason: string | null
}

export type AdminRole = "owner" | "operations" | "customer-support" | "finance" | "marketing"

export type AdminPermission =
  | "dashboard.view"
  | "products.manage"
  | "orders.manage"
  | "fulfillment.manage"
  | "customers.view"
  | "transactions.view"
  | "refunds.manage"
  | "risk.manage"
  | "promos.manage"
  | "credentials.manage"
  | "tickets.manage"
  | "reviews.manage"
  | "analytics.view"
  | "resellers.manage"
  | "staff.manage"
  | "audit.view"

export interface AdminStaff {
  id: ID
  name: string
  email: string
  role: AdminRole
  status: "active" | "invited" | "suspended"
  twoFactorEnabled: boolean
  lastActiveAt: string | null
}

export interface AuditEvent {
  id: ID
  actorId: ID
  actorName: string
  action: string
  module: string
  targetId: string
  targetLabel: string
  outcome: "success" | "failed"
  ipAddress: string
  createdAt: string
  detail: string
}

export interface UserSession {
  id: ID
  device: string
  browser: string
  location: string
  ipAddress: string
  lastActiveAt: string
  current: boolean
}

export type VaultAccountStatus = "aktif" | "akan-habis" | "ditahan" | "bermasalah"

export interface VaultAccount {
  id: ID
  orderInvoice: string
  productId: ID
  productSlug: string
  variantId: ID
  productName: string
  plan: string
  loginEmail: string
  status: VaultAccountStatus
  expiresAt: string
  warrantyUntil: string
  reorderPrice: number
  healthScore: number
  seats: number
  devices: number
  note: string
}

export interface VaultActivity {
  id: ID
  title: string
  body: string
  date: string
  tone: "lime" | "cyan" | "pink" | "warning"
}

export type RefundStatus = "draft" | "review" | "replacement" | "refund" | "rejected" | "closed"
export type RefundDecision = "replacement" | "refund" | "reject"

export interface RefundCase {
  id: ID
  orderInvoice: string
  ticketId: ID | null
  productId: ID
  productName: string
  reason: string
  amount: number
  status: RefundStatus
  owner: string
  evidence: string[]
  updatedAt: string
  timeline: { label: string; done: boolean }[]
}

export type RiskReviewStatus = "open" | "approved" | "held" | "rejected"

export interface RiskReview {
  id: ID
  invoice: string
  customerName: string
  amount: number
  score: number
  level: "rendah" | "sedang" | "tinggi"
  signals: string[]
  status: RiskReviewStatus
  note: string
  assignedTo: string
  updatedAt: string
}

export type ResellerVerificationStatus = "draft" | "review" | "verified" | "rejected"

export interface ResellerAccount {
  id: ID
  companyName: string
  ownerName: string
  email: string
  whatsapp: string
  verificationStatus: ResellerVerificationStatus
  tierId: string
  balance: number
  joinedAt: string
  teamSeats: number
}

export interface BalanceLedgerEntry {
  id: ID
  resellerId: ID
  kind: "topup" | "order" | "adjustment" | "refund"
  amount: number
  balanceAfter: number
  note: string
  createdAt: string
}

export interface BulkOrderLine {
  id: ID
  productId: ID
  variantId: ID
  productName: string
  variantLabel: string
  quantity: number
  unitPrice: number
}

export type BulkOrderStatus = "draft" | "confirmed" | "queued" | "delivered" | "cancelled"

export interface BulkOrderDraft {
  id: ID
  resellerId: ID
  lines: BulkOrderLine[]
  subtotal: number
  discount: number
  total: number
  status: BulkOrderStatus
  createdAt: string
}
