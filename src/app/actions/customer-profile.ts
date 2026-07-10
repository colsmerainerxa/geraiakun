"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  whatsapp: z.string().min(8).optional(),
})

export async function updateMyProfile(input: z.input<typeof updateProfileSchema>) {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data profil tidak valid.")

  const session = await auth()
  if (!session?.user?.id) throw new Error("AUTH_REQUIRED")
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const data: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  })

  if (parsed.data.whatsapp !== undefined) {
    await prisma.customerProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, whatsapp: parsed.data.whatsapp, status: "baru" },
      update: { whatsapp: parsed.data.whatsapp },
    })
  }

  return { ok: true }
}

export async function getMyTickets() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("AUTH_REQUIRED")
  if (!backendFlags.databaseConfigured) return []

  return prisma.ticket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
}

const replyTicketSchema = z.object({
  ticketId: z.string().min(1),
  message: z.string().min(1),
})

export async function replyMyTicket(input: z.input<typeof replyTicketSchema>) {
  const parsed = replyTicketSchema.safeParse(input)
  if (!parsed.success) throw new Error("Pesan tidak valid.")

  const session = await auth()
  if (!session?.user?.id) throw new Error("AUTH_REQUIRED")
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const ticket = await prisma.ticket.findFirst({
    where: { id: parsed.data.ticketId, userId: session.user.id },
  })
  if (!ticket) throw new Error("Tiket tidak ditemukan.")

  const messages = Array.isArray(ticket.messages) ? ticket.messages : []
  messages.push({
    id: crypto.randomUUID(),
    author: session.user.email ?? "User",
    role: "user",
    message: parsed.data.message,
    date: new Date().toISOString(),
  })

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { messages },
  })

  return { ok: true }
}
