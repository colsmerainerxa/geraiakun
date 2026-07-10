"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { serializeOrder } from "@/lib/server/serializers"
import type { Prisma } from "@/generated/prisma/client"

const orderStatusSchema = z.enum([
  "WAITING_PAYMENT",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "REFUND",
])

export async function listOrders(filters: {
  page?: number
  limit?: number
  search?: string
  status?: string
  startDate?: string
  endDate?: string
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { data: [], total: 0, page: 1, limit: 20 }

  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Prisma.OrderWhereInput = {}
  if (filters.status) where.status = filters.status as Prisma.OrderWhereInput["status"]
  if (filters.search) {
    where.OR = [
      { invoice: { contains: filters.search, mode: "insensitive" } },
      { customerName: { contains: filters.search, mode: "insensitive" } },
      { customerEmail: { contains: filters.search, mode: "insensitive" } },
    ]
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
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

  return {
    data: orders.map(serializeOrder),
    total,
    page,
    limit,
  }
}

export async function getOrderDetail(invoice: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return null

  const order = await prisma.order.findUnique({
    where: { invoice },
    include: {
      items: true,
      payments: true,
      fulfillmentTasks: true,
      vaultAccounts: true,
      refundCases: true,
      user: { include: { profile: true } },
    },
  })
  return order
}

export async function updateOrderStatus(invoice: string, status: string) {
  const parsed = orderStatusSchema.safeParse(status)
  if (!parsed.success) throw new Error("Status tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const order = await prisma.order.update({
    where: { invoice },
    data: { status: parsed.data },
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
      detail: `Status pesanan ${order.invoice} diubah ke ${parsed.data}.`,
    },
  })

  return { ok: true }
}

export async function exportOrdersCsv(filters: {
  status?: string
  startDate?: string
  endDate?: string
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return ""

  const where: Prisma.OrderWhereInput = {}
  if (filters.status) where.status = filters.status as Prisma.OrderWhereInput["status"]
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  const header = "Invoice,Tanggal,Nama,Email,WhatsApp,Subtotal,Diskon,Fee,Total,Status,Metode\n"
  const rows = orders
    .map((o) => {
      const date = o.createdAt.toISOString().split("T")[0]
      return `${o.invoice},${date},${o.customerName},${o.customerEmail},${o.whatsapp},${o.subtotal},${o.discount},${o.fee},${o.total},${o.status},${o.paymentMethod}`
    })
    .join("\n")

  return header + rows
}
