"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Demo admin gamification (no backend). Awards XP for operational actions
// (kirim credential, resolve ticket, approve risk, decide refund), tracks a
// daily streak, and unlocks milestone badges at XP thresholds. Persisted so a
// staff member's "level" survives reloads — pure motivational UI, never gates
// real permissions.

export type GamificationAction =
  | "fulfillment.kirim"
  | "ticket.resolved"
  | "risk.approved"
  | "refund.decided"

export const ACTION_XP: Record<GamificationAction, number> = {
  "fulfillment.kirim": 15,
  "ticket.resolved": 10,
  "risk.approved": 12,
  "refund.decided": 8,
}

// Cumulative-XP milestone badges. Unlocked automatically when xp crosses threshold.
export interface Achievement {
  id: string
  label: string
  threshold: number
  accent: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-steps", label: "Langkah Pertama", threshold: 50, accent: "bg-accent-cyan" },
  { id: "steady", label: "Konsisten", threshold: 150, accent: "bg-accent-lime" },
  { id: "veteran", label: "Veteran Operasional", threshold: 300, accent: "bg-accent-purple" },
  { id: "machine", label: "Mesin Fulfillment", threshold: 600, accent: "bg-accent-pink" },
  { id: "legend", label: "Legenda geraiakun", threshold: 1000, accent: "bg-main" },
]

// Level = 1 + number of thresholds crossed. Each level needs more xp.
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900]

export function levelForXp(xp: number): number {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  return level
}

export function levelProgress(xp: number): { current: number; next: number; pct: number } {
  const level = levelForXp(xp)
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0
  const next = LEVEL_THRESHOLDS[level] ?? current + 500
  const span = Math.max(1, next - current)
  return { current, next, pct: Math.min(100, Math.round(((xp - current) / span) * 100)) }
}

function todayIso(): string {
  // Stable per-day string (yyyy-mm-dd) for streak math.
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00.000Z`).getTime()
  const db = new Date(`${b}T00:00:00.000Z`).getTime()
  return Math.round((db - da) / (24 * 60 * 60 * 1000))
}

interface GamificationState {
  xp: number
  streak: number
  lastActionDate: string | null
  actions: Record<GamificationAction, number>
  unlocked: string[]
  award: (action: GamificationAction) => void
  reset: () => void
}

export const useAdminGamification = create<GamificationState>()(
  persist(
    (set, _get) => ({
      xp: 0,
      streak: 0,
      lastActionDate: null,
      actions: {
        "fulfillment.kirim": 0,
        "ticket.resolved": 0,
        "risk.approved": 0,
        "refund.decided": 0,
      },
      unlocked: [],
      award: (action) =>
        set((state) => {
          const today = todayIso()
          const prev = state.lastActionDate
          let streak = state.streak
          if (!prev) streak = 1
          else {
            const diff = dayDiff(prev, today)
            if (diff === 0) streak = Math.max(1, state.streak)
            else if (diff === 1) streak = state.streak + 1
            else streak = 1
          }
          const gained = ACTION_XP[action]
          const xp = state.xp + gained
          const actions = { ...state.actions, [action]: state.actions[action] + 1 }
          const unlocked = ACHIEVEMENTS.filter(
            (a) => xp >= a.threshold && !state.unlocked.includes(a.id),
          ).map((a) => a.id)
          return {
            xp,
            streak,
            lastActionDate: today,
            actions,
            unlocked: unlocked.length ? [...state.unlocked, ...unlocked] : state.unlocked,
          }
        }),
      reset: () =>
        set({
          xp: 0,
          streak: 0,
          lastActionDate: null,
          actions: {
            "fulfillment.kirim": 0,
            "ticket.resolved": 0,
            "risk.approved": 0,
            "refund.decided": 0,
          },
          unlocked: [],
        }),
    }),
    { name: "geraiakun-admin-gamification" },
  ),
)
