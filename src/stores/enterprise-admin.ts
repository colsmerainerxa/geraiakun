"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { refundCases as seedRefunds } from "@/lib/mock/enterprise"
import { credentials as seedCredentials } from "@/lib/mock/credentials"
import { products as seedProducts } from "@/lib/mock/products"
import { promos as seedPromos } from "@/lib/mock/transactions"
import { useAdminGamification } from "@/stores/admin-gamification"
import type {
  AdminPermission,
  AdminRole,
  AdminStaff,
  AuditEvent,
  BalanceLedgerEntry,
  BulkOrderDraft,
  CredentialStock,
  Product,
  Promo,
  RefundCase,
  RefundDecision,
  ResellerAccount,
  RiskReview,
  RiskReviewStatus,
} from "@/types"

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Owner",
  operations: "Operations",
  "customer-support": "Customer Support",
  finance: "Finance",
  marketing: "Marketing",
}

const ALL_PERMISSIONS: AdminPermission[] = [
  "dashboard.view",
  "products.manage",
  "orders.manage",
  "fulfillment.manage",
  "customers.view",
  "transactions.view",
  "refunds.manage",
  "risk.manage",
  "promos.manage",
  "credentials.manage",
  "tickets.manage",
  "reviews.manage",
  "analytics.view",
  "resellers.manage",
  "staff.manage",
  "audit.view",
]

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: ALL_PERMISSIONS,
  operations: [
    "dashboard.view",
    "products.manage",
    "orders.manage",
    "fulfillment.manage",
    "customers.view",
    "risk.manage",
    "credentials.manage",
    "tickets.manage",
    "analytics.view",
    "resellers.manage",
  ],
  "customer-support": [
    "dashboard.view",
    "orders.manage",
    "customers.view",
    "refunds.manage",
    "tickets.manage",
    "reviews.manage",
  ],
  finance: [
    "dashboard.view",
    "orders.manage",
    "customers.view",
    "transactions.view",
    "refunds.manage",
    "analytics.view",
    "resellers.manage",
    "audit.view",
  ],
  marketing: [
    "dashboard.view",
    "products.manage",
    "customers.view",
    "promos.manage",
    "reviews.manage",
    "analytics.view",
  ],
}

export function roleCan(role: AdminRole, permission: AdminPermission) {
  return ROLE_PERMISSIONS[role].includes(permission)
}

const SEED_STAFF: AdminStaff[] = [
  {
    id: "staff-owner",
    name: "Alya Putri",
    email: "owner@beliakun.id",
    role: "owner",
    status: "active",
    twoFactorEnabled: true,
    lastActiveAt: "2026-06-28T09:45:00.000Z",
  },
  {
    id: "staff-ops",
    name: "Rizky Mahendra",
    email: "ops@beliakun.id",
    role: "operations",
    status: "active",
    twoFactorEnabled: true,
    lastActiveAt: "2026-06-28T09:12:00.000Z",
  },
  {
    id: "staff-cs",
    name: "Naya Anindita",
    email: "cs@beliakun.id",
    role: "customer-support",
    status: "active",
    twoFactorEnabled: false,
    lastActiveAt: "2026-06-28T08:55:00.000Z",
  },
  {
    id: "staff-finance",
    name: "Fina Ramadhani",
    email: "finance@beliakun.id",
    role: "finance",
    status: "active",
    twoFactorEnabled: true,
    lastActiveAt: "2026-06-27T17:30:00.000Z",
  },
  {
    id: "staff-marketing",
    name: "Dio Prasetya",
    email: "marketing@beliakun.id",
    role: "marketing",
    status: "invited",
    twoFactorEnabled: false,
    lastActiveAt: null,
  },
]

const SEED_AUDITS: AuditEvent[] = [
  {
    id: "audit-1",
    actorId: "staff-owner",
    actorName: "Alya Putri",
    action: "updated",
    module: "product",
    targetId: "prod-1",
    targetLabel: "ChatGPT Plus",
    outcome: "success",
    ipAddress: "103.12.84.21",
    createdAt: "2026-06-28T09:20:00.000Z",
    detail: "Harga varian Private diperbarui menjadi Rp70.000.",
  },
  {
    id: "audit-2",
    actorId: "staff-ops",
    actorName: "Rizky Mahendra",
    action: "released",
    module: "credential",
    targetId: "cred-1",
    targetLabel: "stock.chatgpt-plus.1@vault.beliakun",
    outcome: "success",
    ipAddress: "180.252.91.7",
    createdAt: "2026-06-28T08:50:00.000Z",
    detail: "Credential dilepas ke fulfillment INV-20260011.",
  },
  {
    id: "audit-3",
    actorId: "staff-cs",
    actorName: "Naya Anindita",
    action: "assigned",
    module: "refund",
    targetId: "RFD-2606-001",
    targetLabel: "INV-20260004",
    outcome: "success",
    ipAddress: "36.82.17.44",
    createdAt: "2026-06-27T16:12:00.000Z",
    detail: "Kasus refund ditugaskan ke CS Naya.",
  },
]

const SEED_RISKS: RiskReview[] = [
  {
    id: "risk-1",
    invoice: "INV-20260013",
    customerName: "DevHouse Solo",
    amount: 420000,
    score: 86,
    level: "tinggi",
    signals: ["Order pertama bernilai besar", "IP berbeda negara", "20 item identik"],
    status: "open",
    note: "Perlu konfirmasi identitas pembeli dan tujuan penggunaan.",
    assignedTo: "Rizky Mahendra",
    updatedAt: "2026-06-28T09:05:00.000Z",
  },
  {
    id: "risk-2",
    invoice: "INV-20260012",
    customerName: "Studio Konten Bali",
    amount: 280000,
    score: 54,
    level: "sedang",
    signals: ["Perangkat baru", "Top up dan order dalam 2 menit"],
    status: "held",
    note: "Menunggu bukti transfer top up reseller.",
    assignedTo: "Fina Ramadhani",
    updatedAt: "2026-06-28T08:40:00.000Z",
  },
]

const SEED_RESELLERS: ResellerAccount[] = [
  {
    id: "reseller-1",
    companyName: "Studio Konten Bali",
    ownerName: "Kadek Arta",
    email: "finance@studiokonten.id",
    whatsapp: "6281234001200",
    verificationStatus: "verified",
    tierId: "pro",
    balance: 1350000,
    joinedAt: "2026-04-12",
    teamSeats: 4,
  },
  {
    id: "reseller-2",
    companyName: "Kelas AI Nusantara",
    ownerName: "Nadia Utami",
    email: "hello@kelasai.id",
    whatsapp: "6281255509900",
    verificationStatus: "review",
    tierId: "starter",
    balance: 480000,
    joinedAt: "2026-06-20",
    teamSeats: 2,
  },
  {
    id: "reseller-3",
    companyName: "DevHouse Solo",
    ownerName: "Bagus Purnomo",
    email: "billing@devhouse.id",
    whatsapp: "6281333100100",
    verificationStatus: "verified",
    tierId: "enterprise",
    balance: 6200000,
    joinedAt: "2026-02-08",
    teamSeats: 8,
  },
]

const SEED_LEDGER: BalanceLedgerEntry[] = [
  {
    id: "ledger-1",
    resellerId: "reseller-1",
    kind: "topup",
    amount: 1000000,
    balanceAfter: 1530000,
    note: "Top up via QRIS",
    createdAt: "2026-06-27T11:30:00.000Z",
  },
  {
    id: "ledger-2",
    resellerId: "reseller-1",
    kind: "order",
    amount: -180000,
    balanceAfter: 1350000,
    note: "Bulk order RS-001",
    createdAt: "2026-06-27T12:04:00.000Z",
  },
]

const SEED_BULK_ORDERS: BulkOrderDraft[] = [
  {
    id: "bulk-1",
    resellerId: "reseller-1",
    lines: [
      {
        id: "bulk-line-1",
        productId: "prod-1",
        variantId: "var-1",
        productName: "ChatGPT Plus",
        variantLabel: "1 Bulan Sharing",
        quantity: 6,
        unitPrice: 29750,
      },
    ],
    subtotal: 178500,
    discount: 31500,
    total: 178500,
    status: "queued",
    createdAt: "2026-06-27T12:04:00.000Z",
  },
]

interface EnterpriseAdminState {
  activeStaffId: string
  staff: AdminStaff[]
  audits: AuditEvent[]
  refunds: RefundCase[]
  risks: RiskReview[]
  resellers: ResellerAccount[]
  ledger: BalanceLedgerEntry[]
  bulkOrders: BulkOrderDraft[]
  catalog: Product[]
  promos: Promo[]
  credentials: CredentialStock[]
  setActiveStaff: (id: string) => void
  inviteStaff: (input: Pick<AdminStaff, "name" | "email" | "role">) => void
  updateStaff: (id: string, patch: Partial<AdminStaff>) => void
  logAudit: (
    input: Omit<AuditEvent, "id" | "actorId" | "actorName" | "ipAddress" | "createdAt">,
  ) => void
  assignRefund: (id: string, owner: string) => void
  decideRefund: (id: string, decision: RefundDecision) => void
  decideRisk: (id: string, status: RiskReviewStatus, note: string) => void
  saveProduct: (product: Product) => void
  removeProduct: (id: string) => void
  savePromo: (promo: Promo) => void
  removePromo: (id: string) => void
  addCredential: (credential: CredentialStock) => void
  removeCredential: (id: string) => void
  updateCredential: (id: string, patch: Partial<CredentialStock>) => void
  bulkCredentialStatus: (ids: string[], status: CredentialStock["status"]) => void
  updateReseller: (id: string, patch: Partial<ResellerAccount>) => void
  adjustResellerBalance: (id: string, amount: number, note: string) => void
  submitBulkOrder: (draft: BulkOrderDraft) => { ok: boolean; message: string }
  reset: () => void
}

function cloneProducts() {
  return seedProducts.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({ ...variant })),
    badges: [...product.badges],
    features: [...product.features],
    featuresEn: [...product.featuresEn],
    faqs: product.faqs.map((faq) => ({ ...faq })),
  }))
}

function auditEvent(
  state: EnterpriseAdminState,
  input: Omit<AuditEvent, "id" | "actorId" | "actorName" | "ipAddress" | "createdAt">,
) {
  const actor = state.staff.find((item) => item.id === state.activeStaffId) ?? state.staff[0]
  return {
    ...input,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorId: actor.id,
    actorName: actor.name,
    ipAddress: "103.12.84.21",
    createdAt: new Date().toISOString(),
  } satisfies AuditEvent
}

export const useEnterpriseAdmin = create<EnterpriseAdminState>()(
  persist(
    (set, get) => ({
      activeStaffId: "staff-owner",
      staff: SEED_STAFF,
      audits: SEED_AUDITS,
      refunds: seedRefunds,
      risks: SEED_RISKS,
      resellers: SEED_RESELLERS,
      ledger: SEED_LEDGER,
      bulkOrders: SEED_BULK_ORDERS,
      catalog: cloneProducts(),
      promos: seedPromos,
      credentials: seedCredentials,
      setActiveStaff: (activeStaffId) => set({ activeStaffId }),
      inviteStaff: (input) =>
        set((state) => {
          const member: AdminStaff = {
            ...input,
            id: `staff-${Date.now()}`,
            status: "invited",
            twoFactorEnabled: false,
            lastActiveAt: null,
          }
          return {
            staff: [...state.staff, member],
            audits: [
              auditEvent(state, {
                action: "invited",
                module: "staff",
                targetId: member.id,
                targetLabel: member.email,
                outcome: "success",
                detail: `Undangan role ${ADMIN_ROLE_LABELS[member.role]} dikirim.`,
              }),
              ...state.audits,
            ],
          }
        }),
      updateStaff: (id, patch) =>
        set((state) => ({
          staff: state.staff.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          audits: [
            auditEvent(state, {
              action: "updated",
              module: "staff",
              targetId: id,
              targetLabel: state.staff.find((item) => item.id === id)?.email ?? id,
              outcome: "success",
              detail: "Status, role, atau keamanan staf diperbarui.",
            }),
            ...state.audits,
          ],
        })),
      logAudit: (input) =>
        set((state) => ({ audits: [auditEvent(state, input), ...state.audits] })),
      assignRefund: (id, owner) =>
        set((state) => ({
          refunds: state.refunds.map((item) =>
            item.id === id ? { ...item, owner, updatedAt: new Date().toISOString() } : item,
          ),
          audits: [
            auditEvent(state, {
              action: "assigned",
              module: "refund",
              targetId: id,
              targetLabel: state.refunds.find((item) => item.id === id)?.orderInvoice ?? id,
              outcome: "success",
              detail: `Kasus ditugaskan ke ${owner}.`,
            }),
            ...state.audits,
          ],
        })),
      decideRefund: (id, decision) => {
        set((state) => {
          const nextStatus = decision === "reject" ? "rejected" : decision
          return {
            refunds: state.refunds.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: nextStatus,
                    updatedAt: new Date().toISOString(),
                    timeline: item.timeline.map((step, index) =>
                      index <= 2 ? { ...step, done: true } : step,
                    ),
                  }
                : item,
            ),
            audits: [
              auditEvent(state, {
                action: decision,
                module: "refund",
                targetId: id,
                targetLabel: state.refunds.find((item) => item.id === id)?.orderInvoice ?? id,
                outcome: "success",
                detail: `Keputusan kasus: ${decision}.`,
              }),
              ...state.audits,
            ],
          }
        })
        // Gamification: deciding a refund is an operational win.
        useAdminGamification.getState().award("refund.decided")
      },
      decideRisk: (id, status, note) => {
        set((state) => ({
          risks: state.risks.map((item) =>
            item.id === id ? { ...item, status, note, updatedAt: new Date().toISOString() } : item,
          ),
          audits: [
            auditEvent(state, {
              action: status,
              module: "risk",
              targetId: id,
              targetLabel: state.risks.find((item) => item.id === id)?.invoice ?? id,
              outcome: "success",
              detail: note || `Risk review diubah menjadi ${status}.`,
            }),
            ...state.audits,
          ],
        }))
        // Gamification: closing a risk review is an operational win.
        useAdminGamification.getState().award("risk.approved")
      },
      saveProduct: (product) =>
        set((state) => {
          const exists = state.catalog.some((item) => item.id === product.id)
          return {
            catalog: exists
              ? state.catalog.map((item) => (item.id === product.id ? product : item))
              : [product, ...state.catalog],
            audits: [
              auditEvent(state, {
                action: exists ? "updated" : "created",
                module: "product",
                targetId: product.id,
                targetLabel: product.name,
                outcome: "success",
                detail: `${product.variants.length} varian tersimpan.`,
              }),
              ...state.audits,
            ],
          }
        }),
      removeProduct: (id) =>
        set((state) => ({
          catalog: state.catalog.filter((item) => item.id !== id),
          audits: [
            auditEvent(state, {
              action: "deleted",
              module: "product",
              targetId: id,
              targetLabel: state.catalog.find((item) => item.id === id)?.name ?? id,
              outcome: "success",
              detail: "Produk dihapus dari katalog lokal.",
            }),
            ...state.audits,
          ],
        })),
      savePromo: (promo) =>
        set((state) => {
          const exists = state.promos.some((item) => item.id === promo.id)
          return {
            promos: exists
              ? state.promos.map((item) => (item.id === promo.id ? promo : item))
              : [promo, ...state.promos],
            audits: [
              auditEvent(state, {
                action: exists ? "updated" : "created",
                module: "promo",
                targetId: promo.id,
                targetLabel: promo.code,
                outcome: "success",
                detail: promo.description,
              }),
              ...state.audits,
            ],
          }
        }),
      removePromo: (id) =>
        set((state) => ({
          promos: state.promos.filter((item) => item.id !== id),
          audits: [
            auditEvent(state, {
              action: "deleted",
              module: "promo",
              targetId: id,
              targetLabel: state.promos.find((item) => item.id === id)?.code ?? id,
              outcome: "success",
              detail: "Promo dihapus.",
            }),
            ...state.audits,
          ],
        })),
      addCredential: (credential) =>
        set((state) => ({
          credentials: [credential, ...state.credentials],
          audits: [
            auditEvent(state, {
              action: "created",
              module: "credential",
              targetId: credential.id,
              targetLabel: credential.email,
              outcome: "success",
              detail: `${credential.productName} - ${credential.variantLabel}`,
            }),
            ...state.audits,
          ],
        })),
      removeCredential: (id) =>
        set((state) => ({
          credentials: state.credentials.filter((item) => item.id !== id),
          audits: [
            auditEvent(state, {
              action: "deleted",
              module: "credential",
              targetId: id,
              targetLabel: state.credentials.find((item) => item.id === id)?.email ?? id,
              outcome: "success",
              detail: "Credential dihapus dari vault stok.",
            }),
            ...state.audits,
          ],
        })),
      updateCredential: (id, patch) =>
        set((state) => ({
          credentials: state.credentials.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
          audits: [
            auditEvent(state, {
              action: "updated",
              module: "credential",
              targetId: id,
              targetLabel: state.credentials.find((item) => item.id === id)?.email ?? id,
              outcome: "success",
              detail: "Status atau identitas credential diperbarui.",
            }),
            ...state.audits,
          ],
        })),
      bulkCredentialStatus: (ids, status) =>
        set((state) => ({
          credentials: state.credentials.map((item) =>
            ids.includes(item.id) ? { ...item, status } : item,
          ),
          audits: [
            auditEvent(state, {
              action: "bulk-updated",
              module: "credential",
              targetId: ids.join(","),
              targetLabel: `${ids.length} credential`,
              outcome: "success",
              detail: `Status massal diubah menjadi ${status}.`,
            }),
            ...state.audits,
          ],
        })),
      updateReseller: (id, patch) =>
        set((state) => ({
          resellers: state.resellers.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          audits: [
            auditEvent(state, {
              action: "updated",
              module: "reseller",
              targetId: id,
              targetLabel: state.resellers.find((item) => item.id === id)?.companyName ?? id,
              outcome: "success",
              detail: "Profil, verifikasi, atau tier reseller diperbarui.",
            }),
            ...state.audits,
          ],
        })),
      adjustResellerBalance: (id, amount, note) =>
        set((state) => {
          const reseller = state.resellers.find((item) => item.id === id)
          if (!reseller) return state
          const balanceAfter = Math.max(0, reseller.balance + amount)
          const entry: BalanceLedgerEntry = {
            id: `ledger-${Date.now()}`,
            resellerId: id,
            kind: amount >= 0 ? "adjustment" : "order",
            amount,
            balanceAfter,
            note,
            createdAt: new Date().toISOString(),
          }
          return {
            resellers: state.resellers.map((item) =>
              item.id === id ? { ...item, balance: balanceAfter } : item,
            ),
            ledger: [entry, ...state.ledger],
            audits: [
              auditEvent(state, {
                action: "balance-adjusted",
                module: "reseller",
                targetId: id,
                targetLabel: reseller.companyName,
                outcome: "success",
                detail: `${note}: ${amount}.`,
              }),
              ...state.audits,
            ],
          }
        }),
      submitBulkOrder: (draft) => {
        const state = get()
        const reseller = state.resellers.find((item) => item.id === draft.resellerId)
        if (!reseller) return { ok: false, message: "Reseller tidak ditemukan." }
        if (draft.lines.length === 0) return { ok: false, message: "Tambahkan minimal satu item." }
        if (draft.total > reseller.balance)
          return { ok: false, message: "Saldo reseller tidak cukup." }
        for (const line of draft.lines) {
          const product = state.catalog.find((item) => item.id === line.productId)
          const variant = product?.variants.find((item) => item.id === line.variantId)
          if (!variant || line.quantity < 1)
            return { ok: false, message: "Item bulk order tidak valid." }
          if (line.quantity > variant.stock)
            return { ok: false, message: `Stok ${line.productName} tidak cukup.` }
        }
        const balanceAfter = reseller.balance - draft.total
        const ledgerEntry: BalanceLedgerEntry = {
          id: `ledger-${Date.now()}`,
          resellerId: reseller.id,
          kind: "order",
          amount: -draft.total,
          balanceAfter,
          note: `Bulk order ${draft.id}`,
          createdAt: new Date().toISOString(),
        }
        set((current) => ({
          bulkOrders: [{ ...draft, status: "queued" }, ...current.bulkOrders],
          resellers: current.resellers.map((item) =>
            item.id === reseller.id ? { ...item, balance: balanceAfter } : item,
          ),
          ledger: [ledgerEntry, ...current.ledger],
          audits: [
            auditEvent(current, {
              action: "submitted",
              module: "bulk-order",
              targetId: draft.id,
              targetLabel: reseller.companyName,
              outcome: "success",
              detail: `${draft.lines.length} baris, total ${draft.total}.`,
            }),
            ...current.audits,
          ],
        }))
        return { ok: true, message: "Bulk order masuk antrean fulfillment." }
      },
      reset: () =>
        set({
          activeStaffId: "staff-owner",
          staff: SEED_STAFF,
          audits: SEED_AUDITS,
          refunds: seedRefunds,
          risks: SEED_RISKS,
          resellers: SEED_RESELLERS,
          ledger: SEED_LEDGER,
          bulkOrders: SEED_BULK_ORDERS,
          catalog: cloneProducts(),
          promos: seedPromos,
          credentials: seedCredentials,
        }),
    }),
    { name: "beliakun-enterprise-admin" },
  ),
)
