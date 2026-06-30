"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

const CAP = 8

interface RecentlyViewedState {
  slugs: string[]
  add: (slug: string) => void
  clear: () => void
}

// Produk yang baru dilihat (demo: localStorage). Terbaru di depan, dibatasi CAP.
export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      slugs: [],
      add: (slug) =>
        set((s) => ({
          slugs: [slug, ...s.slugs.filter((x) => x !== slug)].slice(0, CAP),
        })),
      clear: () => set({ slugs: [] }),
    }),
    { name: "geraiakun-recently-viewed" },
  ),
)
