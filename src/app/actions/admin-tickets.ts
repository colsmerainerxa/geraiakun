"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import type { Prisma } from "@/generated/prisma/client"

const ticketStatusSchema = z.enum(["NEW", "REVIEWING", "PROCESSING", "DONE", "REJECTED"])

const replySchema = z.object({
  ticketId: z.string().min(1),
  message: z.string().min(1),
})

export async function listTickets(filters?: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  type?: string
  search?: string
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { data: [], total: 0, page: 1, limit: 20 }

  const page = Math.max(1, filters?.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Prisma.TicketWhereInput = {}
  if (filters?.status) where.status = filters.status as Prisma.TicketWhereInput["status"]
  if (filters?.priority) where.priority = filters.priority as Prisma.TicketWhereInput["priority"]
  if (filters?.type) where.type = filters.type as Prisma.TicketWhereInput["type"]
  if (filters?.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { subject: { contains: filters.search, mode: "insensitive" } },
      { customerName: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ])

  return { data: tickets, total, page, limit }
}

export async function getTicketDetail(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return null

  return prisma.ticket.findUnique({
    where: { id },
    include: { user: { include: { profile: true } } },
  })
}

export async function replyTicket(input: z.input<typeof replySchema>) {
  const parsed = replySchema.safeParse(input)
  if (!parsed.success) throw new Error("Pesan tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const ticket = await prisma.ticket.findUnique({ where: { id: parsed.data.ticketId } })
  if (!ticket) throw new Error("Tiket tidak ditemukan.")

  const messages = Array.isArray(ticket.messages) ? ticket.messages : []
  messages.push({
    id: crypto.randomUUID(),
    author: session.user.email ?? "Admin",
    role: "admin",
    message: parsed.data.message,
    date: new Date().toISOString(),
  })

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      messages,
      status: ticket.status === "NEW" ? "REVIEWING" : ticket.status,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "ticket.reply",
      module: "tiket",
      targetId: ticket.id,
      targetLabel: ticket.code,
      outcome: "success",
      detail: `Balasan dikirim untuk tiket ${ticket.code}.`,
    },
  })

  return { ok: true }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const parsed = ticketStatusSchema.safeParse(status)
  if (!parsed.success) throw new Error("Status tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: parsed.data },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "ticket.status_update",
      module: "tiket",
      targetId: ticket.id,
      targetLabel: ticket.code,
      outcome: "success",
      detail: `Status tiket ${ticket.code} diubah ke ${parsed.data}.`,
    },
  })

  return { ok: true }
}
