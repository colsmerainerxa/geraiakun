import type { Product, ProductBadge, ProductVariant } from "@/types"

let vid = 0
function v(
  label: string,
  labelEn: string,
  type: ProductVariant["type"],
  durationDays: number | null,
  price: number,
  originalPrice: number | null,
  stock: number,
): ProductVariant {
  vid += 1
  return {
    id: `var-${vid}`,
    label,
    labelEn,
    type,
    durationDays,
    price,
    originalPrice,
    stock,
  }
}

interface Seed {
  slug: string
  name: string
  brand: string
  logo: string
  tagline: string
  taglineEn: string
  category: Product["category"]
  accent: string
  badges: ProductBadge[]
  rating: number
  reviewCount: number
  soldCount: number
  featured?: boolean
  variants: ProductVariant[]
  features: string[]
  featuresEn: string[]
}

const seeds: Seed[] = [
  {
    slug: "chatgpt-plus",
    name: "ChatGPT Plus",
    brand: "OpenAI",
    logo: "🤖",
    tagline: "GPT-5 & GPT-4o tanpa antre, respons super cepat",
    taglineEn: "GPT-5 & GPT-4o with no queue, blazing fast",
    category: "ai-chatbot",
    accent: "accent-cyan",
    badges: ["terlaris", "promo"],
    rating: 4.9,
    reviewCount: 1284,
    soldCount: 5300,
    featured: true,
    variants: [
      v("1 Bulan Sharing", "1 Month Sharing", "sharing", 30, 35000, 50000, 60),
      v("1 Bulan Private", "1 Month Private", "private", 30, 70000, 150000, 25),
    ],
    features: [
      "Akses GPT-5, GPT-4o & o-series",
      "Limit chat jauh lebih tinggi",
      "Akses lebih awal ke fitur baru",
      "Pembuatan gambar & analisis file",
    ],
    featuresEn: [
      "Access GPT-5, GPT-4o & o-series",
      "Much higher chat limits",
      "Early access to new features",
      "Image generation & file analysis",
    ],
  },
  {
    slug: "gemini-pro",
    name: "Gemini Pro",
    brand: "Google",
    logo: "✨",
    tagline: "Gemini 2.5 Pro + 2TB storage & integrasi Workspace",
    taglineEn: "Gemini 2.5 Pro + 2TB storage & Workspace integration",
    category: "ai-chatbot",
    accent: "accent-blue",
    badges: ["terlaris"],
    rating: 4.8,
    reviewCount: 642,
    soldCount: 2100,
    featured: true,
    variants: [
      v("1 Bulan", "1 Month", "private", 30, 20000, 50000, 40),
      v("1 Tahun Via Invite", "1 Year via Invite", "invite", 365, 35000, 60000, 30),
      v("1 Tahun Via Login", "1 Year via Login", "private", 365, 60000, 100000, 20),
    ],
    features: [
      "Model Gemini 2.5 Pro tercanggih",
      "Google One 2TB termasuk",
      "Terintegrasi Gmail, Docs & Sheets",
      "Deep Research & Veo video",
    ],
    featuresEn: [
      "Most advanced Gemini 2.5 Pro",
      "Google One 2TB included",
      "Integrated with Gmail, Docs & Sheets",
      "Deep Research & Veo video",
    ],
  },
  {
    slug: "api-key",
    name: "API Key",
    brand: "OpenAI",
    logo: "🔑",
    tagline: "Kredit API untuk akses model AI langsung dari kodemu",
    taglineEn: "API credits to access AI models straight from your code",
    category: "api-developer",
    accent: "accent-lime",
    badges: ["baru"],
    rating: 4.9,
    reviewCount: 312,
    soldCount: 1500,
    featured: true,
    variants: [
      v("Trial Gratis", "Free Trial", "private", null, 0, null, 100),
      v("Basic — 10 Juta Token", "Basic — 10M Tokens", "private", null, 10000, 20000, 80),
      v("Pro — 5 Juta Token", "Pro — 5M Tokens", "private", null, 10000, 40000, 50),
    ],
    features: [
      "Akses model AI via API (GPT & lainnya)",
      "Token masuk ke akun/key milikmu sendiri",
      "Cocok untuk app, bot, & automasi",
      "Mulai gratis lewat varian Trial",
    ],
    featuresEn: [
      "Access AI models via API (GPT & more)",
      "Tokens credited to your own key",
      "Great for apps, bots & automation",
      "Start free with the Trial variant",
    ],
  },
]

function buildFaqs(p: Seed) {
  return [
    {
      q: `Apakah akun ${p.name} aman dan legal?`,
      a: "Akun yang kami jual aktif dan bergaransi penuh selama masa langganan. Kami sarankan tidak mengganti data sensitif pada akun sharing.",
      qEn: `Is the ${p.name} account safe and legal?`,
      aEn: "The accounts we sell are active and fully warranted during the subscription period. We recommend not changing sensitive data on sharing accounts.",
    },
    {
      q: "Berapa lama proses setelah pembayaran?",
      a: "Untuk produk ready stock, akun dikirim otomatis ke email & dashboard dalam hitungan detik—menit setelah pembayaran terverifikasi.",
      qEn: "How long does it take after payment?",
      aEn: "For ready-stock products, the account is delivered automatically to your email & dashboard within seconds–minutes after payment is verified.",
    },
    {
      q: "Bagaimana jika akun bermasalah?",
      a: "Tenang, semua pembelian bergaransi. Hubungi CS dan kami akan ganti akun baru tanpa biaya selama masa garansi.",
      qEn: "What if the account has an issue?",
      aEn: "Don't worry, all purchases are warranted. Contact support and we'll replace it free of charge within the warranty period.",
    },
  ]
}

export const products: Product[] = seeds.map((s, i) => ({
  id: `prod-${i + 1}`,
  slug: s.slug,
  name: s.name,
  brand: s.brand,
  logo: s.logo,
  tagline: s.tagline,
  taglineEn: s.taglineEn,
  description: `${s.name} bergaransi penuh selama masa langganan. ${s.tagline}. Cocok untuk kebutuhan harian, kuliah, maupun profesional. Proses cepat, harga hemat, dan didukung tim CS 24 jam.`,
  descriptionEn: `${s.name} with full warranty for its duration. ${s.taglineEn}. Perfect for daily, study, or professional needs. Fast process, fair pricing, backed by 24/7 support.`,
  category: s.category,
  image: "",
  gallery: [],
  accent: s.accent,
  badges: s.badges,
  rating: s.rating,
  reviewCount: s.reviewCount,
  soldCount: s.soldCount,
  featured: s.featured ?? false,
  variants: s.variants,
  features: s.features,
  featuresEn: s.featuresEn,
  faqs: buildFaqs(s),
}))

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug)
}

export function productMinPrice(p: Product) {
  return Math.min(...p.variants.map((v) => v.price))
}

export function productTotalStock(p: Product) {
  return p.variants.reduce((sum, v) => sum + v.stock, 0)
}
