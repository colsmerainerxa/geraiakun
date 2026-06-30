"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserSession } from "@/types"

// Demo user profile (pre-backend). Persisted so "edits" survive reloads and
// feel real, mirroring the cart / wishlist / tickets stores.

export interface UserProfile {
  name: string
  email: string
  whatsapp: string
  avatar: string | null
  joinedAt: string
}

export interface NotificationPrefs {
  orderUpdates: boolean
  promos: boolean
  ticketReplies: boolean
  newsletter: boolean
}

export interface ActivityEntry {
  id: string
  kind: "login" | "order" | "ticket" | "review" | "profile"
  message: string
  date: string // ISO
}

interface UserState {
  profile: UserProfile
  emailVerified: boolean
  prefs: NotificationPrefs
  activity: ActivityEntry[]
  sessions: UserSession[]
  updateProfile: (patch: Partial<UserProfile>) => void
  setEmailVerified: (verified: boolean) => void
  updatePrefs: (patch: Partial<NotificationPrefs>) => void
  logActivity: (entry: Omit<ActivityEntry, "id" | "date">) => void
  terminateSession: (id: string) => void
  terminateOtherSessions: () => void
  reset: () => void
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Rafa Pratama",
  email: "rafa.pratama@example.com",
  whatsapp: "6281234567890",
  avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Rafa",
  joinedAt: "2026-03-12T08:00:00.000Z",
}

const DEFAULT_PREFS: NotificationPrefs = {
  orderUpdates: true,
  promos: true,
  ticketReplies: true,
  newsletter: false,
}

function seedActivity(): ActivityEntry[] {
  const day = 24 * 60 * 60 * 1000
  const iso = (ago: number) => new Date(Date.now() - ago * day).toISOString()
  return [
    {
      id: "act-seed-1",
      kind: "login",
      message: "Berhasil masuk dari perangkat ini",
      date: iso(0),
    },
    {
      id: "act-seed-2",
      kind: "order",
      message: "Pesanan INV-20260001 — ChatGPT Plus (Selesai)",
      date: iso(3),
    },
    {
      id: "act-seed-3",
      kind: "ticket",
      message: "Tiket TKT-2606-001 dibuka (Garansi)",
      date: iso(2),
    },
    {
      id: "act-seed-4",
      kind: "review",
      message: "Mengulas produk Gemini Advanced",
      date: iso(5),
    },
    {
      id: "act-seed-5",
      kind: "login",
      message: "Berhasil masuk dari Jakarta, ID",
      date: iso(6),
    },
  ]
}

const DEFAULT_SESSIONS: UserSession[] = [
  {
    id: "session-current",
    device: "Windows PC",
    browser: "Chrome",
    location: "Denpasar, ID",
    ipAddress: "103.12.84.21",
    lastActiveAt: "2026-06-28T09:30:00.000Z",
    current: true,
  },
  {
    id: "session-mobile",
    device: "Android Phone",
    browser: "Chrome Mobile",
    location: "Jakarta, ID",
    ipAddress: "180.252.91.7",
    lastActiveAt: "2026-06-27T19:12:00.000Z",
    current: false,
  },
  {
    id: "session-tablet",
    device: "iPad",
    browser: "Safari",
    location: "Surabaya, ID",
    ipAddress: "36.82.17.44",
    lastActiveAt: "2026-06-24T07:45:00.000Z",
    current: false,
  },
]

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      emailVerified: true,
      prefs: DEFAULT_PREFS,
      activity: seedActivity(),
      sessions: DEFAULT_SESSIONS,
      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setEmailVerified: (emailVerified) => set({ emailVerified }),
      updatePrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      logActivity: (entry) =>
        set((s) => ({
          activity: [
            { ...entry, id: `act-${Date.now()}`, date: new Date().toISOString() },
            ...s.activity,
          ],
        })),
      terminateSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((session) => session.current || session.id !== id),
        })),
      terminateOtherSessions: () =>
        set((state) => ({ sessions: state.sessions.filter((session) => session.current) })),
      reset: () =>
        set({
          profile: DEFAULT_PROFILE,
          emailVerified: true,
          prefs: DEFAULT_PREFS,
          activity: seedActivity(),
          sessions: DEFAULT_SESSIONS,
        }),
    }),
    { name: "geraiakun-user" },
  ),
)
