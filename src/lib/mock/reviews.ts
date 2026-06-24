import type { Review } from "@/types"
import { products } from "./products"

const authors = [
  "Rafa Pratama",
  "Dewi Lestari",
  "Bagas Saputra",
  "Nabila Putri",
  "Kevin Wijaya",
  "Siti Rohmah",
  "Dimas Arya",
  "Aulia Rahman",
  "Citra Maharani",
  "Fajar Nugroho",
  "Gita Permata",
  "Yoga Pranata",
]

const comments = [
  "Prosesnya cepat banget, gak sampai 5 menit udah masuk email. Mantap!",
  "Harga termurah yang pernah aku temuin. Akun aman, recommended seller!",
  "Awalnya ragu, ternyata legit. CS-nya ramah dan fast respon. Makasih!",
  "Udah langganan 3 bulan di sini, gak pernah ada masalah. Auto langganan terus.",
  "Akun normal, garansi jalan. Worth it banget buat anak kuliahan kayak aku.",
  "Pelayanan ramah, akun langsung aktif. Bakal beli lagi pasti.",
  "Murah meriah tapi kualitas premium. Top deh pokoknya!",
  "Pengiriman instan, tutorial aktivasinya juga jelas. Newbie friendly!",
]

let rid = 0
export const reviews: Review[] = products.flatMap((p) => {
  const count = Math.min(4, Math.max(2, Math.round(p.rating)))
  return Array.from({ length: count }, (_, i) => {
    rid += 1
    const a = authors[(rid + i) % authors.length]
    return {
      id: `rev-${rid}`,
      productId: p.id,
      author: a,
      avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(a)}`,
      rating: i === 0 ? 5 : Math.max(4, Math.round(p.rating)),
      comment: comments[(rid + i) % comments.length],
      date: `2026-0${((rid + i) % 6) + 1}-1${(rid % 9) + 0}`,
      variantLabel: p.variants[i % p.variants.length].label,
      verified: true,
    }
  })
})

export function reviewsForProduct(productId: string) {
  return reviews.filter((r) => r.productId === productId)
}
