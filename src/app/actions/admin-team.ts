"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export async function listStaff() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return []

  return prisma.adminStaff.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  })
}

const addStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
})

export async function addStaff(input: z.input<typeof addStaffSchema>) {
  const parsed = addStaffSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data staf tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const { hashPassword } = await import("@/lib/server/password")
  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error("Email sudah terdaftar.")

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "ADMIN",
      adminStaff: { create: { status: "active" } },
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "staff.add",
      module: "tim",
      targetId: user.id,
      targetLabel: user.email ?? user.name ?? "Staf",
      outcome: "success",
      detail: `Staf baru ${user.email} ditambahkan.`,
    },
  })

  return { ok: true, id: user.id }
}

export async function removeStaff(userId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }
  if (userId === session.user.id) throw new Error("Tidak dapat menghapus diri sendiri.")

  await prisma.adminStaff.delete({ where: { userId } })
  await prisma.user.update({
    where: { id: userId },
    data: { role: "CUSTOMER" },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "staff.remove",
      module: "tim",
      targetId: userId,
      targetLabel: userId,
      outcome: "success",
      detail: `Staf ${userId} dihapus dari tim.`,
    },
  })

  return { ok: true }
}

export async function toggleStaffStatus(userId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return { ok: true, mode: "demo" }

  const staff = await prisma.adminStaff.findUnique({ where: { userId } })
  if (!staff) throw new Error("Staf tidak ditemukan.")

  await prisma.adminStaff.update({
    where: { userId },
    data: { status: staff.status === "active" ? "suspended" : "active" },
  })

  return { ok: true }
}
