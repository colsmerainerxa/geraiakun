"use server"

import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export async function getDashboardStats() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }

  if (!backendFlags.databaseConfigured) {
    return {
      revenue: 0,
      orders: 0,
      customers: 0,
      tickets: 0,
      revenueByDay: [],
      salesByProduct: [],
      paymentDistribution: [],
      fulfillmentPerformance: { avgSla: 0, totalTasks: 0 },
      customerGrowth: [],
    }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [revenueAgg, ordersCount, customersCount, ticketsCount] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.ticket.count({ where: { status: { in: ["NEW", "REVIEWING", "PROCESSING"] } } }),
  ])

  // Revenue by day (last 30 days)
  const recentOrders = await prisma.order.findMany({
    where: { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
    select: { total: true, createdAt: true },
  })
  const revenueByDay = aggregateByDay(recentOrders, "total")

  // Sales by product
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { status: "COMPLETED" } },
    select: { productName: true, qty: true, price: true },
  })
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const item of orderItems) {
    const existing = productMap.get(item.productName)
    if (existing) {
      existing.qty += item.qty
      existing.revenue += item.price * item.qty
    } else {
      productMap.set(item.productName, {
        name: item.productName,
        qty: item.qty,
        revenue: item.price * item.qty,
      })
    }
  }
  const salesByProduct = [...productMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Payment method distribution
  const payments = await prisma.paymentAttempt.findMany({
    where: { status: "PAID" },
    select: { method: true },
  })
  const methodMap = new Map<string, number>()
  for (const p of payments) {
    methodMap.set(p.method, (methodMap.get(p.method) ?? 0) + 1)
  }
  const paymentDistribution = [...methodMap.entries()].map(([method, count]) => ({
    method,
    count,
  }))

  // Fulfillment performance
  const fulfilledTasks = await prisma.fulfillmentTask.findMany({
    where: { status: "SENT" },
    select: { slaMinutes: true },
  })
  const totalTasks = fulfilledTasks.length
  const avgSla =
    totalTasks > 0
      ? Math.round(fulfilledTasks.reduce((sum, t) => sum + t.slaMinutes, 0) / totalTasks)
      : 0

  // Customer growth (last 30 days)
  const recentCustomers = await prisma.user.findMany({
    where: { role: "CUSTOMER", createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  })
  const customerGrowth = aggregateByDay(recentCustomers, null as never, true)

  return {
    revenue: revenueAgg._sum.total ?? 0,
    orders: ordersCount,
    customers: customersCount,
    tickets: ticketsCount,
    revenueByDay,
    salesByProduct,
    paymentDistribution,
    fulfillmentPerformance: { avgSla, totalTasks },
    customerGrowth,
  }
}

function aggregateByDay(
  items: { createdAt: Date; total?: number }[],
  valueKey: "total",
  countOnly = false,
) {
  const map = new Map<string, number>()
  for (const item of items) {
    const day = item.createdAt.toISOString().split("T")[0]
    const value = countOnly ? 1 : (item[valueKey] ?? 0)
    map.set(day, (map.get(day) ?? 0) + value)
  }
  return [...map.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getAuditLogs(filters?: {
  page?: number
  limit?: number
  module?: string
  actorId?: string
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { data: [], total: 0, page: 1, limit: 20 }

  const page = Math.max(1, filters?.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (filters?.module) where.module = filters.module
  if (filters?.actorId) where.actorId = filters.actorId

  const [logs, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditEvent.count({ where }),
  ])

  return { data: logs, total, page, limit }
}
