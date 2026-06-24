import type { Promo } from "@/types"

/**
 * Hitung nominal diskon dari sebuah promo terhadap subtotal.
 * Mengembalikan 0 jika subtotal belum memenuhi minimum belanja.
 */
export function computeDiscount(promo: Promo | null, subtotal: number): number {
  if (!promo) return 0
  if (subtotal < promo.minSpend) return 0
  const raw =
    promo.type === "persen"
      ? Math.round((subtotal * promo.value) / 100)
      : promo.value
  const capped =
    promo.maxDiscount != null ? Math.min(raw, promo.maxDiscount) : raw
  return Math.min(capped, subtotal)
}
