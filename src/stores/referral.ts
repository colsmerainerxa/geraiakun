"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Program referral/affiliate (demo). Pemberi & penerima sama-sama dapat manfaat:
// teman dapat voucher diskon, kamu dapat poin + komisi.

export interface ReferralEntry {
  id: string
  name: string
  date: string // ISO
  status: "terdaftar" | "bertransaksi"
  reward: number // poin yang kamu dapat
  commission: number // komisi Rp yang kamu dapat (bertransaksi saja)
}

interface ReferralState {
  code: string
  entries: ReferralEntry[]
  /** Metode pencairan komisi (mock). */
  payoutMethod: string
  payoutAccount: string
  /** Simulasikan: ajak teman (demo button). */
  invite: (name: string, converted: boolean) => void
  setPayout: (method: string, account: string) => void
  reset: () => void
}

function genCode() {
  // Kode deterministik dari profil demo (Rafa Pratama).
  return "RAFA-PARTNER"
}

function seedEntries(): ReferralEntry[] {
  const day = 24 * 60 * 60 * 1000
  const iso = (ago: number) => new Date(Date.now() - ago * day).toISOString()
  return [
    {
      id: "ref-1",
      name: "Sinta Dewi",
      date: iso(4),
      status: "bertransaksi",
      reward: 50,
      commission: 5000,
    },
    {
      id: "ref-2",
      name: "Bagus Maulana",
      date: iso(9),
      status: "bertransaksi",
      reward: 50,
      commission: 7500,
    },
    {
      id: "ref-3",
      name: "Dewi Lestari",
      date: iso(1),
      status: "terdaftar",
      reward: 0,
      commission: 0,
    },
  ]
}

export const useReferral = create<ReferralState>()(
  persist(
    (set) => ({
      code: genCode(),
      entries: seedEntries(),
      payoutMethod: "",
      payoutAccount: "",
      invite: (name, converted) =>
        set((s) => ({
          entries: [
            {
              id: `ref-${Date.now()}`,
              name: name.trim() || "Teman",
              date: new Date().toISOString(),
              status: converted ? "bertransaksi" : "terdaftar",
              reward: converted ? 50 : 0,
              commission: converted ? 5000 : 0,
            },
            ...s.entries,
          ],
        })),
      setPayout: (method, account) => set({ payoutMethod: method, payoutAccount: account }),
      reset: () => set({ code: genCode(), entries: seedEntries(), payoutMethod: "", payoutAccount: "" }),
    }),
    { name: "beliakun-referral" },
  ),
)
