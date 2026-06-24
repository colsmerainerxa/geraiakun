"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getPromo } from "@/lib/mock/transactions"
import type { Promo } from "@/types"

interface PromoState {
  promo: Promo | null
  /** Coba terapkan kode promo. Mengembalikan true bila valid & aktif. */
  apply: (code: string) => boolean
  clear: () => void
}

export const usePromo = create<PromoState>()(
  persist(
    (set) => ({
      promo: null,
      apply: (code) => {
        const found = getPromo(code.trim()) ?? null
        set({ promo: found })
        return !!found
      },
      clear: () => set({ promo: null }),
    }),
    { name: "beliakun-promo" },
  ),
)
