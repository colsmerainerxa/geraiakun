"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Ticket, TicketMessage, TicketStatus } from "@/types"

interface TicketsState {
  tickets: Ticket[]
  create: (
    t: Omit<Ticket, "id" | "code" | "status" | "messages" | "createdAt" | "updatedAt">,
  ) => Ticket
  reply: (id: string, message: Omit<TicketMessage, "id" | "date" | "role">) => void
  setStatus: (id: string, status: TicketStatus) => void
  getById: (id: string) => Ticket | undefined
  getByCode: (code: string) => Ticket | undefined
  clear: () => void
}

function nowISO() {
  return new Date().toISOString()
}

// Kode tiket deterministik berbasis urutan: TKT-YYMM-NNN
function genCode(seq: number) {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const n = String(seq).padStart(3, "0")
  return `TKT-${yy}${mm}-${n}`
}

export const useTickets = create<TicketsState>()(
  persist(
    (set, get) => ({
      tickets: [],
      create: (input) => {
        const seq = get().tickets.length + 1
        const ticket: Ticket = {
          ...input,
          productName: input.productName ?? null,
          id: `ticket-${Date.now()}`,
          code: genCode(seq),
          status: "baru",
          messages: [
            {
              id: `msg-${Date.now()}`,
              role: "pelanggan",
              author: input.customerName,
              message: input.description,
              date: nowISO(),
            },
          ],
          createdAt: nowISO(),
          updatedAt: nowISO(),
        }
        set((s) => ({ tickets: [ticket, ...s.tickets] }))
        return ticket
      },
      reply: (id, message) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: t.status === "selesai" ? t.status : "ditinjau",
                  updatedAt: nowISO(),
                  messages: [
                    ...t.messages,
                    {
                      ...message,
                      id: `msg-${Date.now()}`,
                      role: "pelanggan",
                      date: nowISO(),
                    },
                  ],
                }
              : t,
          ),
        })),
      setStatus: (id, status) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id
              ? { ...t, status, updatedAt: nowISO() }
              : t,
          ),
        })),
      getById: (id) => get().tickets.find((t) => t.id === id),
      getByCode: (code) =>
        get().tickets.find(
          (t) => t.code.toLowerCase() === code.toLowerCase(),
        ),
      clear: () => set({ tickets: [] }),
    }),
    { name: "beliakun-tickets" },
  ),
)
