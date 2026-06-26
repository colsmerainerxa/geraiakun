"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Aturan poin (demo): 1 poin per Rp1.000 belanja, +100 per review, +50 per referral sukses.
export const POINTS_PER_RP = 1000 // Rp per 1 poin
export const REVIEW_POINTS = 100
export const REFERRAL_POINTS = 50

export interface LoyaltyTier {
  key: string
  name: string
  min: number // batas bawah poin (lifetime earned)
  color: string // css token, mis. "accent-purple"
  perk: string
}

export const TIERS: LoyaltyTier[] = [
  {
    key: "bronze",
    name: "Bronze",
    min: 0,
    color: "accent-pink",
    perk: "Akses flash sale & voucher member",
  },
  {
    key: "silver",
    name: "Silver",
    min: 500,
    color: "accent-cyan",
    perk: "Cashback 2% + prioritas CS",
  },
  {
    key: "gold",
    name: "Gold",
    min: 2000,
    color: "main",
    perk: "Cashback 5% + garansi prioritas",
  },
  {
    key: "platinum",
    name: "Platinum",
    min: 5000,
    color: "accent-purple",
    perk: "Cashback 8% + harga wholesale",
  },
]

export interface RewardOption {
  id: string
  name: string
  cost: number // poin
  type: "voucher"
  code: string // kode voucher yang didapat
  valueDesc: string // mis. "Diskon Rp10.000"
}

// Voucher yang bisa ditukar dengan poin.
export const REWARDS: RewardOption[] = [
  {
    id: "rw-1",
    name: "Voucher Rp10.000",
    cost: 100,
    type: "voucher",
    code: "HEMAT10K",
    valueDesc: "Diskon Rp10.000 min. belanja Rp50.000",
  },
  {
    id: "rw-2",
    name: "Voucher Rp25.000",
    cost: 230,
    type: "voucher",
    code: "HEMAT25K",
    valueDesc: "Diskon Rp25.000 min. belanja Rp100.000",
  },
  {
    id: "rw-3",
    name: "Diskon 10%",
    cost: 350,
    type: "voucher",
    code: "POIN10",
    valueDesc: "Diskon 10% maks. Rp30.000",
  },
  {
    id: "rw-4",
    name: "Voucher Rp50.000",
    cost: 450,
    type: "voucher",
    code: "HEMAT50K",
    valueDesc: "Diskon Rp50.000 min. belanja Rp200.000",
  },
]

export interface PointsEntry {
  id: string
  amount: number // + atau -
  reason: string
  date: string // ISO
}

interface LoyaltyState {
  points: number // saldo poin saat ini
  lifetimeEarned: number // total pernah didapat (untuk tier)
  history: PointsEntry[]
  redeemed: string[] // id reward yang sudah ditukar
  add: (amount: number, reason: string) => void
  redeem: (reward: RewardOption) => { ok: boolean; code?: string }
  reset: () => void
}

function tierFor(lifetime: number): LoyaltyTier {
  let current = TIERS[0]
  for (const t of TIERS) {
    if (lifetime >= t.min) current = t
  }
  return current
}

export function getTier(lifetime: number) {
  return tierFor(lifetime)
}

export function nextTier(lifetime: number): LoyaltyTier | null {
  for (const t of TIERS) {
    if (t.min > lifetime) return t
  }
  return null
}

function seedHistory(): PointsEntry[] {
  const day = 24 * 60 * 60 * 1000
  const iso = (ago: number) => new Date(Date.now() - ago * day).toISOString()
  return [
    { id: "pts-1", amount: 75, reason: "Pesanan INV-20260001", date: iso(3) },
    { id: "pts-2", amount: 100, reason: "Review produk Gemini Advanced", date: iso(5) },
    { id: "pts-3", amount: 50, reason: "Bonus referral teman", date: iso(10) },
    { id: "pts-4", amount: 120, reason: "Pesanan INV-20260007", date: iso(14) },
    { id: "pts-5", amount: 60, reason: "Pesanan INV-20260012", date: iso(20) },
  ]
}

export const useLoyalty = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      points: 405,
      lifetimeEarned: 405,
      history: seedHistory(),
      redeemed: [],
      add: (amount, reason) =>
        set((s) => {
          const next = Math.max(0, s.points + amount)
          return {
            points: next,
            lifetimeEarned:
              amount > 0 ? s.lifetimeEarned + amount : s.lifetimeEarned,
            history: [
              {
                id: `pts-${Date.now()}`,
                amount,
                reason,
                date: new Date().toISOString(),
              },
              ...s.history,
            ],
          }
        }),
      redeem: (reward) => {
        if (get().points < reward.cost) return { ok: false }
        if (get().redeemed.includes(reward.id)) return { ok: false }
        set((s) => ({
          points: s.points - reward.cost,
          history: [
            {
              id: `pts-${Date.now()}`,
              amount: -reward.cost,
              reason: `Tukar ${reward.name}`,
              date: new Date().toISOString(),
            },
            ...s.history,
          ],
          redeemed: [...s.redeemed, reward.id],
        }))
        return { ok: true, code: reward.code }
      },
      reset: () =>
        set({ points: 405, lifetimeEarned: 405, history: seedHistory(), redeemed: [] }),
    }),
    { name: "beliakun-loyalty" },
  ),
)
