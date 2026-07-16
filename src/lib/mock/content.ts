import type { Banner } from "@/types"

export const banners: Banner[] = [
  {
    id: "b1",
    title: "Promo AI Tools",
    subtitle: "Hemat hingga 50% untuk ChatGPT Plus & Gemini Pro",
    cta: "Lihat Sekarang",
    href: "/kategori/ai-chatbot",
    accent: "accent-cyan",
    active: true,
  },
  {
    id: "b2",
    title: "Coba API Key Gratis",
    subtitle: "Mulai bangun bot & automasi dengan varian Trial",
    cta: "Mulai Gratis",
    href: "/kategori/api-developer",
    accent: "accent-lime",
    active: true,
  },
  {
    id: "b3",
    title: "Gratis Garansi Penuh",
    subtitle: "Semua produk bergaransi selama masa aktif langganan",
    cta: "Pelajari",
    href: "/bantuan",
    accent: "accent-pink",
    active: false,
  },
]
