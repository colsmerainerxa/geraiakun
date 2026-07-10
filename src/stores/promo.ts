"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Promo } from "@/types"

interface PromoState {
  code: string | null
  promo: Promo | null
  /** Coba terapkan kode promo. Mengembalikan true bila valid & aktif. */
  apply: (code: string) => Promise<boolean>
  clear: () => void
}

async function fetchPromo(code: string): Promise<Promo | null> {
  try {
    const r = await fetch(`/api/admin/promos?search=${encodeURIComponent(code)}`)
    if (!r.ok) return null
    const d = await r.json()
    const found = (d.data ?? d)?.find?.((p: any) => p.code === code && p.active)
    if (!found) return null
    return {
      id: found.id,
      code: found.code,
      description: found.description ?? "",
      type: found.type === "PERCENTAGE" ? "persen" : "nominal",
      value: found.value,
      minSpend: found.minPurchase ?? 0,
      maxDiscount: found.maxDiscount ?? null,
      used: found.usedCount ?? 0,
      quota: found.maxUses ?? 0,
      expiresAt: found.expiresAt,
      active: found.active,
    } as Promo
  } catch {
    return null
  }
}

export const usePromo = create<PromoState>()(
  persist(
    (set) => ({
      code: null,
      promo: null,
      apply: async (raw) => {
        const code = raw.trim()
        const found = await fetchPromo(code)
        set({ code: found ? code : null, promo: found })
        return !!found
      },
      clear: () => set({ code: null, promo: null }),
    }),
    {
      name: "geraiakun-promo",
      partialize: (s) => ({ code: s.code }),
      onRehydrateStorage: () => (state) => {
        // Re-validate on load
        if (state?.code) {
          fetchPromo(state.code).then((promo) => {
            if (!promo) state.clear()
            else state.promo = promo
          })
        }
      },
    },
  ),
)
