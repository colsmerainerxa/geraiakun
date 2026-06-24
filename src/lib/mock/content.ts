import type { Banner, Testimonial } from "@/types"

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    author: "Salsa Nadhira",
    role: "Mahasiswa DKV",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Salsa",
    comment:
      "Canva Pro-nya kepake banget buat tugas. Murah, cepet, dan gak pernah error. beliakun emang juara!",
    rating: 5,
  },
  {
    id: "t2",
    author: "Reza Aditya",
    role: "Software Engineer",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Reza",
    comment:
      "Top up OpenAI API tiap minggu di sini. Instan masuk ke akun sendiri, dashboard usage aman. Recommended buat dev.",
    rating: 5,
  },
  {
    id: "t3",
    author: "Maya Kusuma",
    role: "Content Creator",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Maya",
    comment:
      "CapCut Pro + ChatGPT Plus paket lengkap bikin konten. Workflow makin ngebut, biaya makin hemat.",
    rating: 5,
  },
  {
    id: "t4",
    author: "Andi Firmansyah",
    role: "Freelancer",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Andi",
    comment:
      "Pelayanan CS-nya ramah banget, sabar jawab pertanyaan newbie. Akun langsung aktif. Mantul!",
    rating: 5,
  },
  {
    id: "t5",
    author: "Putri Ananda",
    role: "Marketing",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Putri",
    comment:
      "Spotify + Netflix langganan setahun lebih hemat dari beli sendiri. Garansinya beneran jalan!",
    rating: 5,
  },
  {
    id: "t6",
    author: "Hafidz Maulana",
    role: "Mahasiswa Teknik",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Hafidz",
    comment:
      "Perplexity Pro setahun cuma 89rb?! Gila sih ini. Belajar makin gampang. Thanks beliakun!",
    rating: 5,
  },
]

export const banners: Banner[] = [
  {
    id: "b1",
    title: "Flash Sale AI Tools",
    subtitle: "Diskon hingga 70% untuk ChatGPT, Gemini & Claude",
    cta: "Serbu Sekarang",
    href: "/kategori/ai-chatbot",
    accent: "accent-cyan",
    active: true,
  },
  {
    id: "b2",
    title: "Paket Hemat Mahasiswa",
    subtitle: "Bundling Canva + CapCut + Spotify mulai 50rb",
    cta: "Lihat Paket",
    href: "/katalog",
    accent: "accent-pink",
    active: true,
  },
  {
    id: "b3",
    title: "Gratis Garansi Penuh",
    subtitle: "Semua produk bergaransi selama masa aktif langganan",
    cta: "Pelajari",
    href: "/bantuan",
    accent: "accent-lime",
    active: false,
  },
]
