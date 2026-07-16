"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Ticket, TicketMessage, TicketStatus } from "@/types"

interface TicketsState {
  tickets: Ticket[]
  create: (
    ticket: Omit<Ticket, "id" | "code" | "status" | "messages" | "createdAt" | "updatedAt"> & {
      code?: string
    },
  ) => Ticket
  reply: (id: string, message: Omit<TicketMessage, "id" | "date" | "role">) => void
  adminReply: (
    id: string,
    message: Omit<TicketMessage, "id" | "date" | "role" | "author"> & { author: string },
  ) => void
  setStatus: (id: string, status: TicketStatus) => void
  getById: (id: string) => Ticket | undefined
  getByCode: (code: string) => Ticket | undefined
  clear: () => void
}

function nowISO() {
  return new Date().toISOString()
}

function genCode(sequence: number) {
  const date = new Date()
  const year = String(date.getFullYear()).slice(2)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `TKT-${year}${month}-${String(sequence).padStart(3, "0")}`
}

export const useTickets = create<TicketsState>()(
  persist(
    (set, get) => ({
      tickets: [],
      create: (input) => {
        const ticket: Ticket = {
          ...input,
          productName: input.productName ?? null,
          id: `ticket-${Date.now()}`,
          code: input.code ?? genCode(get().tickets.length + 1),
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
        set((state) => ({ tickets: [ticket, ...state.tickets] }))
        return ticket
      },
      reply: (id, message) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? {
                  ...ticket,
                  status: ticket.status === "selesai" ? ticket.status : "ditinjau",
                  updatedAt: nowISO(),
                  messages: [
                    ...ticket.messages,
                    { ...message, id: `msg-${Date.now()}`, role: "pelanggan", date: nowISO() },
                  ],
                }
              : ticket,
          ),
        })),
      adminReply: (id, message) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? {
                  ...ticket,
                  status:
                    ticket.status === "selesai" || ticket.status === "ditolak"
                      ? ticket.status
                      : "ditinjau",
                  updatedAt: nowISO(),
                  messages: [
                    ...ticket.messages,
                    { ...message, id: `msg-${Date.now()}`, role: "agen", date: nowISO() },
                  ],
                }
              : ticket,
          ),
        })),
      setStatus: (id, status) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id ? { ...ticket, status, updatedAt: nowISO() } : ticket,
          ),
        })),
      getById: (id) => get().tickets.find((ticket) => ticket.id === id),
      getByCode: (code) =>
        get().tickets.find((ticket) => ticket.code.toLowerCase() === code.toLowerCase()),
      clear: () => set({ tickets: [] }),
    }),
    { name: "geraiakun-tickets-v2" },
  ),
)
