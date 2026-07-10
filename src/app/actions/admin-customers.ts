"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function listCustomers(filters?: {
  page?: number
  limit?: number
  search?: string
  status?: string
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { data: [], total: 0, page: 1, limit: 20 }

  const page = Math.max(1, filters?.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Prisma.UserWhereInput = { role: "CUSTOMER" }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }
  if (filters?.status) {
    where.profile = { status: filters.status }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return { data: users, total, page, limit }
}

export async function getCustomerDetail(userId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return null

  const [user, orders, vaultAccounts, tickets, refundCases] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vaultAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.refundCase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { user, orders, vaultAccounts, tickets, refundCases }
}

const updateProfileSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["baru", "aktif", "vip", "suspended"]).optional(),
  whatsapp: z.string().optional(),
})

export async function updateCustomerProfile(input: z.input<typeof updateProfileSchema>) {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const data: Prisma.CustomerProfileUpdateInput = {}
  if (parsed.data.status) data.status = parsed.data.status
  if (parsed.data.whatsapp) data.whatsapp = parsed.data.whatsapp

  await prisma.customerProfile.update({
    where: { userId: parsed.data.userId },
    data,
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "customer.update",
      module: "pelanggan",
      targetId: parsed.data.userId,
      targetLabel: parsed.data.userId,
      outcome: "success",
      detail: `Profil pelanggan diperbarui.`,
    },
  })

  return { ok: true }
}
