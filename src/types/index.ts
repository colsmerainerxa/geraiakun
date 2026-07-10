// ============================================================
// Domain types � marketplace akun digital
// ============================================================

export type ID = string

export type CategorySlug =
  | "ai-chatbot"
  | "desain-kreatif"
  | "streaming"
  | "produktivitas"
  | "api-developer"
  | "edukasi"

export interface Category {
  id: ID
  slug: CategorySlug
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  icon: string // lucide icon name
  color: string // css var token, mis. "accent-pink"
  productCount: number
}

export type AccountType = "sharing" | "private" | "invite" | "lifetime"

export type SortKey = "populer" | "termurah" | "termahal" | "rating" | "terbaru"

export type DurationBucket = "1m" | "3m" | "1y" | "lifetime"

export interface ProductQuery {
  category?: CategorySlug | "semua"
  search?: string
  sort?: SortKey
  minPrice?: number
  maxPrice?: number
  badges?: string[]
  accountType?: AccountType
  duration?: DurationBucket
}

export interface ProductVariant {
  id: ID
  label: string // mis. "1 Bulan Private"
  labelEn: string
  type: AccountType
  durationDays: number | null // null = lifetime
  price: number
  originalPrice: number | null
  stock: number
}

export type ProductBadge = "terlaris" | "baru" | "promo" | "langka"

export interface Product {
  id: ID
  slug: string
  name: string
  brand: string // GPT, Gemini, Canva, Perplexity...
  tagline: string
  taglineEn: string
  description: string
  descriptionEn: string
  category: CategorySlug
  image: string
  gallery: string[]
  logo: string
  accent: string // css token
  badges: ProductBadge[]
  rating: number
  reviewCount: number
  soldCount: number
  featured: boolean
  variants: ProductVariant[]
  features: string[]
  featuresEn: string[]
  faqs: { q: string; a: string; qEn: string; aEn: string }[]
}

// ============================================================
// Frontend-only UX models
// ============================================================

export interface QuizAnswer {
  questionId: ID
  value: string
}

export interface QuizQuestion {
  id: ID
  title: string
  description: string
  options: {
    value: string
    label: string
    description: string
    accent: string
  }[]
}

export interface RecommendationResult {
  product: Product
  variantId: ID
  score: number
  reasons: string[]
}

export type PipelineStatus = string

export interface PipelineColumn<TStatus extends PipelineStatus = PipelineStatus> {
  id: TStatus
  title: string
  description?: string
  accent?: string
}

export interface PipelineItem<TStatus extends PipelineStatus = PipelineStatus> {
  id: ID
  status: TStatus
  title: string
  subtitle?: string
  meta?: string[]
  accent?: string
}

export interface Review {
  id: ID
  productId: ID
  author: string
  avatar: string
  rating: number
  comment: string
  date: string
  variantLabel: string
  verified: boolean
}

export type OrderStatus = "menunggu-pembayaran" | "diproses" | "selesai" | "dibatalkan" | "refund"

export type PaymentMethod = "qris" | "gopay" | "ovo" | "dana" | "bca-va" | "bni-va" | "mandiri-va"

export interface OrderItem {
  productId: ID
  productName: string
  productLogo: string
  variantId: ID
  variantLabel: string
  price: number
  qty: number
}

export interface DeliveredCredential {
  email: string
  password: string
  note: string
  pin?: string
}

export interface Order {
  id: ID
  invoice: string
  customerName: string
  customerEmail: string
  whatsapp: string
  items: OrderItem[]
  subtotal: number
  discount: number
  fee: number
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  createdAt: string
  paidAt: string | null
  credentials: DeliveredCredential[]
}

export interface Customer {
  id: ID
  name: string
  email: string
  avatar: string
  whatsapp: string
  joinedAt: string
  orderCount: number
  totalSpent: number
  status: "aktif" | "baru" | "vip"
}

export interface CredentialStock {
  id: ID
  productId: ID
  productName: string
  variantLabel: string
  email: string
  status: "tersedia" | "terjual" | "kadaluarsa" | "ditahan"
  addedAt: string
}

export type PromoType = "persen" | "nominal"

export interface Promo {
  id: ID
  code: string
  description: string
  type: PromoType
  value: number
  minSpend: number
  maxDiscount: number | null
  used: number
  quota: number
  expiresAt: string
  active: boolean
  scope?: string
}

export interface Transaction {
  id: ID
  invoice: string
  customerName: string
  amount: number
  method: PaymentMethod
  status: "berhasil" | "pending" | "gagal"
  createdAt: string
}

export interface Banner {
  id: ID
  title: string
  subtitle: string
  cta: string
  href: string
  accent: string
  active: boolean
}

export interface Testimonial {
  id: ID
  author: string
  avatar: string
  role: string
  comment: string
  rating: number
}

// Cart (client state)
export interface CartItem {
  productId: ID
  productName: string
  productLogo: string
  productSlug: string
  variantId: ID
  variantLabel: string
  price: number
  qty: number
  accent: string
}

// ============================================================
// User-generated content (client state, persisted)
// ============================================================

/** Review yang ditulis pengguna (di luar seed mock). */
export interface UserReview {
  id: ID
  productId: ID
  author: string
  rating: number
  title: string
  comment: string
  variantLabel: string
  date: string // ISO
  verified: boolean
}

/** Pertanyaan Q&A yang diajukan pengguna di halaman produk. */
export interface QaQuestion {
  id: ID
  productId: ID
  author: string
  question: string
  date: string // ISO
  answer: string | null
  answeredBy: string | null
  answeredAt: string | null
}

// ============================================================
// Support � Ticketing & notifikasi
// ============================================================

export type TicketType =
  | "garansi" // klaim garansi / ganti akun
  | "pembayaran" // masalah pembayaran / refund
  | "akun" // akun bermasalah / tidak bisa login
  | "lainnya"

export type TicketStatus =
  | "baru" // baru dibuat, belum ditangani
  | "ditinjau" // sedang diperiksa tim
  | "diproses" // proses penggantian/refund
  | "selesai"
  | "ditolak"

export type TicketPriority = "rendah" | "normal" | "tinggi"

export interface TicketMessage {
  id: ID
  author: string
  role: "pelanggan" | "agen"
  message: string
  date: string // ISO
}

export interface Ticket {
  id: ID
  code: string // mis. TKT-2401-001
  type: TicketType
  subject: string
  description: string
  invoice: string | null // terkait pesanan (opsional)
  productId: ID | null // terkait produk (opsional)
  productName: string | null // nama produk terkait (opsional, untuk display)
  priority: TicketPriority
  status: TicketStatus
  customerName: string
  customerEmail: string
  whatsapp: string
  messages: TicketMessage[]
  createdAt: string // ISO
  updatedAt: string // ISO
}

export type NotificationKind =
  | "pesanan" // status pesanan berubah
  | "promo" // promo / flash sale
  | "tiket" // update tiket
  | "info" // pengumuman umum

export interface AppNotification {
  id: ID
  kind: NotificationKind
  title: string
  body: string
  href: string | null
  read: boolean
  createdAt: string // ISO
}

export type {
  ActivationGuide,
  ActivationStep,
  AdminPermission,
  AdminRole,
  AdminStaff,
  AnalyticsMetric,
  AuditEvent,
  BalanceLedgerEntry,
  BulkOrderDraft,
  BulkOrderLine,
  BulkOrderStatus,
  CustomerSegment,
  FulfillmentStatus,
  FulfillmentTask,
  PaymentAttempt,
  PaymentStatus,
  RefundCase,
  RefundDecision,
  RefundStatus,
  ResellerAccount,
  ResellerOrder,
  ResellerPlan,
  ResellerVerificationStatus,
  RiskLevel,
  RiskReview,
  RiskReviewStatus,
  UserSession,
  VaultAccount,
  VaultAccountStatus,
  VaultActivity,
} from "./enterprise"
