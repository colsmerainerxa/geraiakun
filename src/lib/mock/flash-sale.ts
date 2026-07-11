import type { Product } from "@/types"
import { products } from "./products"

/**
 * Produk flash sale: punya badge promo & harga coret. Diambil maksimal 6.
 * Target waktu akhir dihitung dinamis — selalu "akhir hari ini + geser" agar
 * countdown selalu aktif di demo.
 */
export interface FlashSaleItem {
  product: Product
  salePrice: number
  originalPrice: number
  off: number
  // 0..1 — seberapa banyak stok "terjual" (untuk progress bar urgensi)
  claimedRatio: number
  soldCount: number
}

const RATIO_SEEDS = [0.42, 0.67, 0.81, 0.55, 0.73, 0.9]

export function getFlashSaleItems(): FlashSaleItem[] {
  const deals = products
    .filter((p) => p.badges.includes("promo"))
    .map((p) => {
      // Ambil varian termurah yang punya harga coret
      const v =
        [...p.variants]
          .filter((x) => x.originalPrice && x.originalPrice > x.price)
          .sort((a, b) => a.price - b.price)[0] ?? p.variants[0]
      return { p, v }
    })
    .filter((x) => x.v?.originalPrice)
    .slice(0, 6)

  return deals.map((x, i) => ({
    product: x.p,
    salePrice: x.v.price,
    originalPrice: x.v.originalPrice ?? x.v.price,
    off: Math.round(((x.v.originalPrice! - x.v.price) / x.v.originalPrice!) * 100),
    claimedRatio: RATIO_SEEDS[i % RATIO_SEEDS.length],
    soldCount: Math.round(pseudoSold(x.p.slug, 40, 180)),
  }))
}

// Pseudo-random deterministik dari slug (tanpa dependensi Math.random agar
// SSR & client cocok).
function pseudoSold(slug: string, min: number, max: number) {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997
  return min + ((h % 100) / 100) * (max - min)
}

/**
 * Target akhir flash sale — selalu "5 jam dari sekarang" saat runtime client,
 * tapi untuk konsistensi SSR kita simpan di state komponen.
 */
export function defaultFlashSaleEnd() {
  const d = new Date()
  d.setHours(23, 59, 59, 0) // akhir hari ini
  // kalau kurang dari 1 jam lagi, dorong ke besok
  if (d.getTime() - Date.now() < 60 * 60 * 1000) {
    d.setDate(d.getDate() + 1)
  }
  return d.toISOString()
}
