import type { RefundCase, VaultAccount, VaultActivity } from "@/types"

export type {
  RefundCase,
  RefundStatus,
  VaultAccount,
  VaultAccountStatus,
  VaultActivity,
} from "@/types"

export interface ResellerPlan {
  id: string
  name: string
  minTopup: number
  discount: string
  margin: string
  perks: string[]
  accent: string
}

export interface ResellerOrder {
  id: string
  buyer: string
  product: string
  qty: number
  margin: number
  status: "paid" | "queued" | "delivered"
}

export type FulfillmentStatus = "menunggu-stok" | "siap-kirim" | "review-risiko" | "terkirim"
export type RiskLevel = "rendah" | "sedang" | "tinggi"

export interface FulfillmentTask {
  id: string
  invoice: string
  customer: string
  productName: string
  variant: string
  status: FulfillmentStatus
  risk: RiskLevel
  slaMinutes: number
  credentialEmail: string
  channel: "email" | "dashboard" | "whatsapp"
  createdAt: string
}

export interface AnalyticsMetric {
  label: string
  value: string
  delta: string
  tone: "lime" | "cyan" | "pink" | "purple"
}

export interface CustomerSegment {
  id: string
  name: string
  customers: number
  revenue: number
  conversion: number
  signal: string
  action: string
}

export const vaultAccounts: VaultAccount[] = [
  {
    id: "vault-1",
    orderInvoice: "INV-20260001",
    productId: "prod-1",
    productSlug: "chatgpt-plus",
    variantId: "var-2",
    productName: "ChatGPT Plus",
    plan: "1 Bulan Private",
    loginEmail: "rafa.chatgpt@premium.mail",
    status: "aktif",
    expiresAt: "2026-07-21",
    warrantyUntil: "2026-07-21",
    reorderPrice: 70000,
    healthScore: 98,
    seats: 1,
    devices: 2,
    note: "Akun sehat. Login terakhir dari dashboard pelanggan.",
  },
  {
    id: "vault-2",
    orderInvoice: "INV-20260003",
    productId: "prod-2",
    productSlug: "gemini-pro",
    variantId: "var-4",
    productName: "Gemini Pro",
    plan: "1 Tahun Via Invite",
    loginEmail: "rafa.workspace@gmail.com",
    status: "akan-habis",
    expiresAt: "2026-07-02",
    warrantyUntil: "2026-07-02",
    reorderPrice: 35000,
    healthScore: 82,
    seats: 1,
    devices: 1,
    note: "Masa aktif hampir habis. Beli lagi jika masih membutuhkan akses.",
  },
  {
    id: "vault-3",
    orderInvoice: "INV-20260007",
    productId: "prod-3",
    productSlug: "api-key",
    variantId: "var-8",
    productName: "API Key",
    plan: "Pro - 5 Juta Token",
    loginEmail: "vault.api.2035@beliakun.dev",
    status: "ditahan",
    expiresAt: "2026-08-11",
    warrantyUntil: "2026-07-11",
    reorderPrice: 10000,
    healthScore: 74,
    seats: 3,
    devices: 4,
    note: "Ditahan sementara karena ada perubahan IP yang tidak biasa.",
  },
]

export const vaultActivities: VaultActivity[] = [
  {
    id: "act-1",
    title: "Credential rotated",
    body: "Password ChatGPT Plus diperbarui oleh tim fulfillment.",
    date: "2026-06-27T09:15:00",
    tone: "lime",
  },
  {
    id: "act-2",
    title: "Pengingat masa aktif",
    body: "Gemini Pro berakhir dalam 5 hari dan siap dibeli kembali.",
    date: "2026-06-26T16:20:00",
    tone: "warning",
  },
  {
    id: "act-3",
    title: "Warranty check",
    body: "Health check API Key selesai tanpa error login.",
    date: "2026-06-25T10:00:00",
    tone: "cyan",
  },
]

export const refundCases: RefundCase[] = [
  {
    id: "RFD-2606-001",
    orderInvoice: "INV-20260004",
    ticketId: "TKT-2606-001",
    productId: "prod-1",
    productName: "ChatGPT Plus",
    reason: "Akun tidak bisa login setelah pengiriman.",
    amount: 70000,
    status: "replacement",
    owner: "CS Naya",
    evidence: ["screenshot-login-error.png", "video-login.mp4"],
    updatedAt: "2026-06-27T08:45:00",
    timeline: [
      { label: "Klaim diterima", done: true },
      { label: "Bukti diverifikasi", done: true },
      { label: "Akun pengganti disiapkan", done: true },
      { label: "Konfirmasi pelanggan", done: false },
    ],
  },
  {
    id: "RFD-2606-002",
    orderInvoice: "INV-20260008",
    ticketId: "TKT-2606-002",
    productId: "prod-2",
    productName: "Gemini Pro",
    reason: "Pembayaran sukses tetapi stok belum tersedia.",
    amount: 20000,
    status: "review",
    owner: "Finance",
    evidence: ["receipt-qris.png"],
    updatedAt: "2026-06-27T07:30:00",
    timeline: [
      { label: "Klaim diterima", done: true },
      { label: "Payment gateway dicek", done: true },
      { label: "Pilih refund atau tunggu stok", done: false },
      { label: "Dana dikembalikan", done: false },
    ],
  },
]

export const resellerPlans: ResellerPlan[] = [
  {
    id: "starter",
    name: "Starter Reseller",
    minTopup: 250000,
    discount: "8%",
    margin: "Rp5rb - Rp12rb / order",
    accent: "bg-accent-cyan",
    perks: ["Katalog reseller", "Harga grosir", "Kode referral reseller"],
  },
  {
    id: "pro",
    name: "Pro Agency",
    minTopup: 1000000,
    discount: "15%",
    margin: "Rp12rb - Rp30rb / order",
    accent: "bg-accent-purple",
    perks: ["Seat tim", "Prioritas stok", "Invoice white-label"],
  },
  {
    id: "enterprise",
    name: "Enterprise Partner",
    minTopup: 5000000,
    discount: "Custom",
    margin: "Margin kontrak",
    accent: "bg-accent-lime",
    perks: ["SLA khusus", "Bulk activation", "Account manager"],
  },
]

export const resellerOrders: ResellerOrder[] = [
  {
    id: "RS-001",
    buyer: "Kelas AI Nusantara",
    product: "ChatGPT Plus",
    qty: 12,
    margin: 180000,
    status: "delivered",
  },
  {
    id: "RS-002",
    buyer: "Studio Konten Bali",
    product: "Canva Pro",
    qty: 8,
    margin: 96000,
    status: "queued",
  },
  {
    id: "RS-003",
    buyer: "DevHouse Solo",
    product: "API Key",
    qty: 20,
    margin: 220000,
    status: "paid",
  },
]

export const fulfillmentTasks: FulfillmentTask[] = [
  {
    id: "ful-1",
    invoice: "INV-20260011",
    customer: "Rafa Pratama",
    productName: "ChatGPT Plus",
    variant: "1 Bulan Private",
    status: "siap-kirim",
    risk: "rendah",
    slaMinutes: 4,
    credentialEmail: "stock.chatgpt-plus.17@vault.beliakun",
    channel: "dashboard",
    createdAt: "2026-06-27T09:05:00",
  },
  {
    id: "ful-2",
    invoice: "INV-20260012",
    customer: "Studio Konten Bali",
    productName: "Canva Pro",
    variant: "Team Seat",
    status: "menunggu-stok",
    risk: "sedang",
    slaMinutes: 28,
    credentialEmail: "waiting-stock",
    channel: "email",
    createdAt: "2026-06-27T08:55:00",
  },
  {
    id: "ful-3",
    invoice: "INV-20260013",
    customer: "DevHouse Solo",
    productName: "API Key",
    variant: "Pro - 5 Juta Token",
    status: "review-risiko",
    risk: "tinggi",
    slaMinutes: 11,
    credentialEmail: "stock.api-key.31@vault.beliakun",
    channel: "whatsapp",
    createdAt: "2026-06-27T08:42:00",
  },
  {
    id: "ful-4",
    invoice: "INV-20260010",
    customer: "Nabila Putri",
    productName: "Gemini Pro",
    variant: "1 Tahun Via Login",
    status: "terkirim",
    risk: "rendah",
    slaMinutes: 0,
    credentialEmail: "stock.gemini-pro.22@vault.beliakun",
    channel: "dashboard",
    createdAt: "2026-06-27T08:10:00",
  },
]

export const analyticsMetrics: AnalyticsMetric[] = [
  { label: "GMV bulan ini", value: "Rp84,6jt", delta: "+18,4%", tone: "lime" },
  { label: "Conversion rate", value: "7,8%", delta: "+1,2 pts", tone: "cyan" },
  { label: "Repeat purchase", value: "42%", delta: "+6,5%", tone: "pink" },
  { label: "Refund ratio", value: "1,6%", delta: "-0,4 pts", tone: "purple" },
]

export const revenueSeries = [
  { day: "S1", value: 6200000 },
  { day: "S2", value: 7000000 },
  { day: "S3", value: 6800000 },
  { day: "S4", value: 8100000 },
  { day: "S5", value: 7500000 },
  { day: "S6", value: 9000000 },
  { day: "S7", value: 8600000 },
  { day: "Sen", value: 7200000 },
  { day: "Sel", value: 8600000 },
  { day: "Rab", value: 7800000 },
  { day: "Kam", value: 9400000 },
  { day: "Jum", value: 11800000 },
  { day: "Sab", value: 13200000 },
  { day: "Min", value: 11100000 },
]

export const customerSegments: CustomerSegment[] = [
  {
    id: "vip-ai",
    name: "VIP AI Power Users",
    customers: 328,
    revenue: 28600000,
    conversion: 18,
    signal: "Sering beli ChatGPT, API Key, dan Perplexity.",
    action: "Tawarkan bundle AI Pro untuk pembelian berikutnya.",
  },
  {
    id: "reseller",
    name: "Reseller aktif",
    customers: 74,
    revenue: 19300000,
    conversion: 31,
    signal: "Order banyak seat dan butuh invoice.",
    action: "Arahkan ke topup grosir dan SLA fulfillment.",
  },
  {
    id: "at-risk",
    name: "Masa aktif hampir habis",
    customers: 211,
    revenue: 9200000,
    conversion: 6,
    signal: "Akses berakhir dalam 7 hari dan belum membeli lagi.",
    action: "Kirim voucher beli lagi dan pengingat WhatsApp.",
  },
  {
    id: "new",
    name: "Pembeli baru",
    customers: 612,
    revenue: 14100000,
    conversion: 9,
    signal: "Order pertama via katalog atau referral.",
    action: "Dorong review, reward poin, dan repeat purchase.",
  },
]

export const checkoutAssuranceSteps = [
  {
    label: "Invoice dibuat",
    description: "Nomor invoice dan instruksi bayar langsung tersedia.",
  },
  {
    label: "Pembayaran dipantau",
    description: "QRIS, e-wallet, dan VA ditampilkan sebagai status real-time.",
  },
  {
    label: "Risk check",
    description: "Order dicek dari sinyal fraud, stok, dan duplikasi akun.",
  },
  {
    label: "Credential dikirim",
    description: "Akun masuk ke dashboard, email, dan riwayat pesanan.",
  },
]
