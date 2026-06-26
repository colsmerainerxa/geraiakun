"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

const MAX_COMPARE = 4

interface CompareState {
  slugs: string[]
  toggle: (slug: string) => { added: boolean; full: boolean }
  remove: (slug: string) => void
  has: (slug: string) => boolean
  clear: () => void
  /** Buka/tutup drawer comparison. */
  open: boolean
  setOpen: (open: boolean) => void
}

// Bandingkan produk (demo: localStorage). Menyimpan slug saja.
export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      slugs: [],
      open: false,
      setOpen: (open) => set({ open }),
      toggle: (slug) => {
        const exists = get().slugs.includes(slug)
        if (exists) {
          set((s) => {
            const next = s.slugs.filter((x) => x !== slug)
            return { slugs: next, open: next.length > 0 && s.open }
          })
          return { added: false, full: false }
        }
        if (get().slugs.length >= MAX_COMPARE) {
          return { added: false, full: true }
        }
        set((s) => ({ slugs: [...s.slugs, slug] }))
        return { added: true, full: false }
      },
      remove: (slug) =>
        set((s) => {
          const next = s.slugs.filter((x) => x !== slug)
          return { slugs: next, open: next.length > 0 ? s.open : false }
        }),
      has: (slug) => get().slugs.includes(slug),
      clear: () => set({ slugs: [], open: false }),
    }),
    { name: "beliakun-compare" },
  ),
)

export const COMPARE_MAX = MAX_COMPARE
