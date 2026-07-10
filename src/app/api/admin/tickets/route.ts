import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)))
  const status = url.searchParams.get("status") ?? undefined
  const priority = url.searchParams.get("priority") ?? undefined
  const search = url.searchParams.get("search") ?? undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ]
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.ticket.count({ where }),
  ])

  return NextResponse.json({ data: tickets, total, page, limit })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { id, status } = await request.json()
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 })
  }

  const ticket = await prisma.ticket.update({ where: { id }, data: { status } })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "ticket.status_update",
      module: "tiket",
      targetId: ticket.id,
      targetLabel: ticket.code,
      outcome: "success",
      detail: `Status tiket ${ticket.code} diubah ke ${status}.`,
    },
  })

  return NextResponse.json(ticket)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { id, message } = await request.json()
  if (!id || !message) {
    return NextResponse.json({ error: "id and message are required" }, { status: 400 })
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) {
    return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 })
  }

  const messages = Array.isArray(ticket.messages) ? ticket.messages : []
  messages.push({
    id: crypto.randomUUID(),
    author: session.user.email ?? "Admin",
    role: "admin",
    message,
    date: new Date().toISOString(),
  })

  const updated = await prisma.ticket.update({
    where: { id },
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

  return NextResponse.json(updated)
}
