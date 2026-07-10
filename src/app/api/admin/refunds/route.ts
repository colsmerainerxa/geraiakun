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
  const search = url.searchParams.get("search") ?? undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { orderInvoice: { contains: search, mode: "insensitive" } },
      { productName: { contains: search, mode: "insensitive" } },
    ]
  }

  const [refunds, total] = await Promise.all([
    prisma.refundCase.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.refundCase.count({ where }),
  ])

  return NextResponse.json({ data: refunds, total, page, limit })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { id, status, owner, note } = await request.json()
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 })
  }

  const refund = await prisma.refundCase.findUnique({ where: { id } })
  if (!refund) {
    return NextResponse.json({ error: "Refund tidak ditemukan." }, { status: 404 })
  }

  const timeline = Array.isArray(refund.timeline) ? refund.timeline : []
  const labelMap: Record<string, string> = {
    REVIEW: "Review CS",
    REPLACEMENT: "Penggantian",
    REFUND: "Pengembalian dana",
    REJECTED: "Ditolak",
    CLOSED: "Ditutup",
  }
  timeline.push({
    label: labelMap[status] ?? status,
    done: true,
    date: new Date().toISOString(),
    note: note ?? undefined,
  })

  const data: Record<string, unknown> = { status, timeline }
  if (owner != null) data.owner = owner

  const updated = await prisma.refundCase.update({ where: { id }, data })

  if (status === "REFUND") {
    await prisma.order.updateMany({
      where: { id: refund.orderId ?? undefined },
      data: { status: "REFUND" },
    })
  }

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "refund.process",
      module: "refund",
      targetId: refund.id,
      targetLabel: refund.orderInvoice,
      outcome: "success",
      detail: `Refund ${refund.id} untuk ${refund.orderInvoice} diproses: ${status}.`,
    },
  })

  return NextResponse.json(updated)
}
