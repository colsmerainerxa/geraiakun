"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WishlistState {
  slugs: string[]
  toggle: (slug: string) => void
  remove: (slug: string) => void
  clear: () => void
}

// Favorit produk (demo: localStorage). Simpan slug saja; data produk dilookup
// dari mock yang statis. Komponen pakai selector `s.slugs.includes(slug)`
// untuk reaktivitas.
export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      slugs: [],
      toggle: (slug) =>
        set((s) => ({
          slugs: s.slugs.includes(slug) ? s.slugs.filter((x) => x !== slug) : [slug, ...s.slugs],
        })),
      remove: (slug) => set((s) => ({ slugs: s.slugs.filter((x) => x !== slug) })),
      clear: () => set({ slugs: [] }),
    }),
    { name: "beliakun-wishlist" },
  ),
)
