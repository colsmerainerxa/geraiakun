import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["WAITING_PAYMENT", "PROCESSING", "COMPLETED", "CANCELLED", "REFUND"]),
})

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
  const search = url.searchParams.get("search") ?? undefined
  const status = url.searchParams.get("status") ?? undefined
  const startDate = url.searchParams.get("startDate") ?? undefined
  const endDate = url.searchParams.get("endDate") ?? undefined

  const skip = (page - 1) * limit
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { invoice: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
    ]
  }
  if (startDate || endDate) {
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)
    where.createdAt = dateFilter
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, payments: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({ data: orders, total, page, limit })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }
  const { id, status } = parsed.data

  const data: Record<string, unknown> = { status }
  if (status === "COMPLETED") {
    data.paidAt = new Date()
  }

  const order = await prisma.order.update({
    where: { id },
    data,
    include: { items: true, payments: true },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "order.status_update",
      module: "pesanan",
      targetId: order.id,
      targetLabel: order.invoice,
      outcome: "success",
      detail: `Status pesanan ${order.invoice} diubah ke ${status}.`,
    },
  })

  return NextResponse.json(order)
}
