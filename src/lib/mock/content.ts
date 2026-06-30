import type { Banner, Testimonial } from "@/types"

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    author: "Salsa Nadhira",
    role: "Mahasiswa DKV",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Salsa",
    comment:
      "ChatGPT Plus-nya kepake banget buat tugas & skripsi. Prosesnya cepet, harga ramah mahasiswa. Mantap!",
    rating: 5,
  },
  {
    id: "t2",
    author: "Reza Aditya",
    role: "Software Engineer",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Reza",
    comment:
      "Top up API Key tiap minggu di sini. Token instan masuk ke key sendiri, cocok buat ngebangun bot. Recommended buat dev.",
    rating: 5,
  },
  {
    id: "t3",
    author: "Maya Kusuma",
    role: "Content Creator",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Maya",
    comment:
      "Gemini Pro + ChatGPT Plus jadi combo wajib bikin konten. Riset cepet, nulis caption makin gampang.",
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
      "Langganan Gemini Pro setahun jauh lebih hemat dari beli sendiri. Garansinya beneran jalan!",
    rating: 5,
  },
  {
    id: "t6",
    author: "Hafidz Maulana",
    role: "Mahasiswa Teknik",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Hafidz",
    comment:
      "ChatGPT Plus sharing cuma 35rb?! Gila sih. Belajar coding makin gampang. Thanks geraiakun!",
    rating: 5,
  },
]

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
