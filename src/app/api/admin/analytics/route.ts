import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

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

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({
      revenue: 0,
      orders: 0,
      customers: 0,
      tickets: 0,
      revenueByDay: [],
      salesByProduct: [],
      paymentDistribution: [],
      fulfillmentPerformance: { avgSla: 0, totalTasks: 0 },
      customerGrowth: [],
    })
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

  const recentOrders = await prisma.order.findMany({
    where: { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
    select: { total: true, createdAt: true },
  })
  const revenueByDay = aggregateByDay(recentOrders, "total")

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

  const payments = await prisma.paymentAttempt.findMany({
    where: { status: "PAID" },
    select: { method: true },
  })
  const methodMap = new Map<string, number>()
  for (const p of payments) {
    methodMap.set(p.method, (methodMap.get(p.method) ?? 0) + 1)
  }
  const paymentDistribution = [...methodMap.entries()].map(([method, count]) => ({ method, count }))

  const fulfilledTasks = await prisma.fulfillmentTask.findMany({
    where: { status: "SENT" },
    select: { slaMinutes: true },
  })
  const totalTasks = fulfilledTasks.length
  const avgSla =
    totalTasks > 0
      ? Math.round(fulfilledTasks.reduce((sum, t) => sum + t.slaMinutes, 0) / totalTasks)
      : 0

  const recentCustomers = await prisma.user.findMany({
    where: { role: "CUSTOMER", createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  })
  const customerGrowth = aggregateByDay(recentCustomers, null as never, true)

  return NextResponse.json({
    revenue: revenueAgg._sum.total ?? 0,
    orders: ordersCount,
    customers: customersCount,
    tickets: ticketsCount,
    revenueByDay,
    salesByProduct,
    paymentDistribution,
    fulfillmentPerformance: { avgSla, totalTasks },
    customerGrowth,
  })
}
