"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getPromo } from "@/lib/mock/transactions"
import type { Promo } from "@/types"

interface PromoState {
  code: string | null
  promo: Promo | null
  /** Coba terapkan kode promo. Mengembalikan true bila valid & aktif. */
  apply: (code: string) => boolean
  clear: () => void
}

export const usePromo = create<PromoState>()(
  persist(
    (set) => ({
      code: null,
      promo: null,
      apply: (raw) => {
        const code = raw.trim()
        const found = getPromo(code) ?? null
        set({ code: found ? code : null, promo: found })
        return !!found
      },
      clear: () => set({ code: null, promo: null }),
    }),
    {
      name: "beliakun-promo",
      // SECURITY: persist only the code, never the discount object. On load we
      // re-resolve it through getPromo (the trusted source), so a tampered
      // localStorage code can't inject an arbitrary discount.
      partialize: (s) => ({ code: s.code }),
      merge: (persisted, current) => {
        const code =
          (persisted as { code?: string | null } | undefined)?.code ?? null
        const promo = code ? (getPromo(code) ?? null) : null
        return { ...current, code: promo ? code : null, promo }
      },
    },
  ),
)
