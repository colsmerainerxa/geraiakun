"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import type { Prisma } from "@/generated/prisma/client"

const refundStatusSchema = z.enum([
  "DRAFT",
  "REVIEW",
  "REPLACEMENT",
  "REFUND",
  "REJECTED",
  "CLOSED",
])

const refundActionSchema = z.object({
  refundId: z.string().min(1),
  status: refundStatusSchema,
  note: z.string().optional(),
})

export async function listRefunds(filters?: {
  page?: number
  limit?: number
  status?: string
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

  const where: Prisma.RefundCaseWhereInput = {}
  if (filters?.status) where.status = filters.status as Prisma.RefundCaseWhereInput["status"]
  if (filters?.search) {
    where.OR = [
      { orderInvoice: { contains: filters.search, mode: "insensitive" } },
      { productName: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const [refunds, total] = await Promise.all([
    prisma.refundCase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.refundCase.count({ where }),
  ])

  return { data: refunds, total, page, limit }
}

export async function getRefundDetail(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return null

  return prisma.refundCase.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      order: { include: { items: true } },
    },
  })
}

export async function processRefund(input: z.input<typeof refundActionSchema>) {
  const parsed = refundActionSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data refund tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const refund = await prisma.refundCase.findUnique({ where: { id: parsed.data.refundId } })
  if (!refund) throw new Error("Refund tidak ditemukan.")

  const timeline = Array.isArray(refund.timeline) ? refund.timeline : []
  const labelMap: Record<string, string> = {
    REVIEW: "Review CS",
    REPLACEMENT: "Penggantian",
    REFUND: "Pengembalian dana",
    REJECTED: "Ditolak",
    CLOSED: "Ditutup",
  }
  timeline.push({
    label: labelMap[parsed.data.status] ?? parsed.data.status,
    done: true,
    date: new Date().toISOString(),
    note: parsed.data.note,
  })

  await prisma.refundCase.update({
    where: { id: refund.id },
    data: {
      status: parsed.data.status,
      timeline,
    },
  })

  if (parsed.data.status === "REFUND") {
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
      detail: `Refund ${refund.id} untuk ${refund.orderInvoice} diproses: ${parsed.data.status}.`,
    },
  })

  return { ok: true }
}
