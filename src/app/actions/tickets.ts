"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { ticketPriorityToDb, ticketTypeToDb } from "@/lib/server/status"

const ticketSchema = z.object({
  type: z.enum(["garansi", "pembayaran", "akun", "lainnya"]),
  subject: z.string().min(5),
  description: z.string().min(10),
  invoice: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  priority: z.enum(["rendah", "normal", "tinggi"]),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  whatsapp: z.string().min(8),
})

function ticketCode() {
  return `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
}

export async function createTicket(input: z.input<typeof ticketSchema>) {
  const parsed = ticketSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data tiket belum valid.")
  const session = await auth()
  if (!session?.user?.id) throw new Error("AUTH_REQUIRED")

  const code = ticketCode()
  if (!backendFlags.databaseConfigured) return { code }

  const ticket = await prisma.ticket.create({
    data: {
      code,
      userId: session.user.id,
      type: ticketTypeToDb[parsed.data.type],
      subject: parsed.data.subject,
      description: parsed.data.description,
      invoice: parsed.data.invoice || null,
      productId: parsed.data.productId || null,
      productName: parsed.data.productName || null,
      priority: ticketPriorityToDb[parsed.data.priority],
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail.toLowerCase(),
      whatsapp: parsed.data.whatsapp,
      messages: [
        {
          id: crypto.randomUUID(),
          author: parsed.data.customerName,
          role: "pelanggan",
          message: parsed.data.description,
          date: new Date().toISOString(),
        },
      ],
    },
  })

  return { code: ticket.code }
}
