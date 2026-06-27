"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AppNotification, NotificationKind } from "@/types"

interface NotificationsState {
  items: AppNotification[]
  push: (
    n: Omit<AppNotification, "id" | "read" | "createdAt"> & {
      createdAt?: string
    },
  ) => AppNotification
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  clear: () => void
  // derived helpers
  unread: () => number
}

function nowISO() {
  return new Date().toISOString()
}

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: [],
      push: (input) => {
        const n: AppNotification = {
          ...input,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          read: false,
          createdAt: input.createdAt ?? nowISO(),
        }
        set((s) => ({ items: [n, ...s.items].slice(0, 50) }))
        return n
      },
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
      remove: (id) => set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
      clear: () => set({ items: [] }),
      unread: () => get().items.filter((n) => !n.read).length,
    }),
    { name: "beliakun-notifications" },
  ),
)

// Helper untuk membuat notifikasi dengan label yang sudah diterjemahkan
// dipanggil komponen (karena store tidak akses i18n).
export type { NotificationKind }
