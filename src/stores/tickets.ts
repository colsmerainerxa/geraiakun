"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Ticket, TicketMessage, TicketStatus } from "@/types"

interface TicketsState {
  tickets: Ticket[]
  create: (
    t: Omit<Ticket, "id" | "code" | "status" | "messages" | "createdAt" | "updatedAt"> & {
      code?: string
    },
  ) => Ticket
  reply: (id: string, message: Omit<TicketMessage, "id" | "date" | "role">) => void
  /** Agen admin membalas tiket — role "agen". */
  adminReply: (
    id: string,
    message: Omit<TicketMessage, "id" | "date" | "role" | "author"> & {
      author: string
    },
  ) => void
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

// Contoh tiket awal agar panel admin tidak kosong saat demo.
function seedTickets(): Ticket[] {
  const day = 24 * 60 * 60 * 1000
  const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString()
  return [
    {
      id: "ticket-seed-1",
      code: "TKT-2606-001",
      type: "garansi",
      subject: "Akun ChatGPT tidak bisa login",
      description:
        "Halo, akun ChatGPT Plus yang saya beli kemarin tiba-tiba tidak bisa login. Padahal kemarin masih normal. Mohon diganti ya, terima kasih.",
      invoice: "INV-20260001",
      productId: null,
      productName: "ChatGPT Plus",
      priority: "tinggi",
      status: "diproses",
      customerName: "Rafa Pratama",
      customerEmail: "rafa@example.com",
      whatsapp: "6281234567890",
      messages: [
        {
          id: "seed-msg-1",
          role: "pelanggan",
          author: "Rafa Pratama",
          message:
            "Halo, akun ChatGPT Plus yang saya beli kemarin tiba-tiba tidak bisa login. Padahal kemarin masih normal. Mohon diganti ya, terima kasih.",
          date: iso(2),
        },
        {
          id: "seed-msg-2",
          role: "agen",
          author: "CS geraiakun",
          message:
            "Halo Rafa, maaf atas kendalanya. Boleh kirim screenshot error saat login? Kami akan cek dan ganti akunmu secepatnya 🙏",
          date: iso(1),
        },
      ],
      createdAt: iso(2),
      updatedAt: iso(1),
    },
    {
      id: "ticket-seed-2",
      code: "TKT-2606-002",
      type: "pembayaran",
      subject: "Pembayaran terdeteksi tapi order belum selesai",
      description:
        "Saya sudah bayar lewat QRIS dan saldo terpotong, tapi status pesanan masih menunggu pembayaran.",
      invoice: "INV-20260003",
      productId: null,
      productName: "Gemini Advanced",
      priority: "normal",
      status: "baru",
      customerName: "Dewi Lestari",
      customerEmail: "dewi@example.com",
      whatsapp: "6285678901234",
      messages: [
        {
          id: "seed-msg-3",
          role: "pelanggan",
          author: "Dewi Lestari",
          message:
            "Saya sudah bayar lewat QRIS dan saldo terpotong, tapi status pesanan masih menunggu pembayaran.",
          date: iso(0),
        },
      ],
      createdAt: iso(0),
      updatedAt: iso(0),
    },
    {
      id: "ticket-seed-3",
      code: "TKT-2605-014",
      type: "lainnya",
      subject: "Minta panduan aktivasi Canva",
      description: "Bagaimana cara join ke tim Canva? Saya bingung langkah-langkahnya.",
      invoice: "INV-20260007",
      productId: null,
      productName: "Canva Pro",
      priority: "rendah",
      status: "selesai",
      customerName: "Bagus Santoso",
      customerEmail: "bagus@example.com",
      whatsapp: "6281122334455",
      messages: [
        {
          id: "seed-msg-4",
          role: "pelanggan",
          author: "Bagus Santoso",
          message: "Bagaimana cara join ke tim Canva? Saya bingung langkah-langkahnya.",
          date: iso(8),
        },
        {
          id: "seed-msg-5",
          role: "agen",
          author: "CS geraiakun",
          message:
            "Halo Bagus! Cek email kamu, ada undangan dari Canva. Klik tombol 'Join the Team', pakai akun Google/email yang kamu daftarkan. Panduan lengkap: https://geraiakun.com/panduan/canva 🎨",
          date: iso(8),
        },
        {
          id: "seed-msg-6",
          role: "pelanggan",
          author: "Bagus Santoso",
          message: "Sudah berhasil, terima kasih banyak! 🙏",
          date: iso(7),
        },
      ],
      createdAt: iso(8),
      updatedAt: iso(7),
    },
  ]
}

export const useTickets = create<TicketsState>()(
  persist(
    (set, get) => ({
      tickets: seedTickets(),
      create: (input) => {
        const seq = get().tickets.length + 1
        const ticket: Ticket = {
          ...input,
          productName: input.productName ?? null,
          id: `ticket-${Date.now()}`,
          code: input.code ?? genCode(seq),
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
      adminReply: (id, message) =>
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id
              ? {
                  ...t,
                  // Agen membalas -> tiket otomatis berlanjut ke "ditinjau"
                  // kecuali sudah selesai/ditolak.
                  status: t.status === "selesai" || t.status === "ditolak" ? t.status : "ditinjau",
                  updatedAt: nowISO(),
                  messages: [
                    ...t.messages,
                    {
                      ...message,
                      id: `msg-${Date.now()}`,
                      role: "agen",
                      date: nowISO(),
                    },
                  ],
                }
              : t,
          ),
        })),
      setStatus: (id, status) =>
        set((s) => ({
          tickets: s.tickets.map((t) => (t.id === id ? { ...t, status, updatedAt: nowISO() } : t)),
        })),
      getById: (id) => get().tickets.find((t) => t.id === id),
      getByCode: (code) => get().tickets.find((t) => t.code.toLowerCase() === code.toLowerCase()),
      clear: () => set({ tickets: [] }),
    }),
    { name: "geraiakun-tickets" },
  ),
)
