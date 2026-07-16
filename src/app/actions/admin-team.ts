"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { createStaffInvite } from "@/lib/server/staff-invite"
import { revokeAllUserAuth } from "@/lib/server/trusted-devices"

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

const addStaffSchema = z.strictObject({
  email: z.string().email(),
  name: z.string().min(2),
})

export async function addStaff(input: z.input<typeof addStaffSchema>) {
  const parsed = addStaffSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data staf tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error("Email sudah terdaftar.")

  const invitation = await createStaffInvite({ name: parsed.data.name, email })
  const { user } = invitation

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

  return { ok: true, id: user.id, previewUrl: invitation.previewUrl }
}

export async function removeStaff(userId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")
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
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const staff = await prisma.adminStaff.findUnique({ where: { userId } })
  if (!staff) throw new Error("Staf tidak ditemukan.")

  const status = staff.status === "active" ? "suspended" : "active"
  await prisma.$transaction(async (tx) => {
    await tx.adminStaff.update({ where: { userId }, data: { status } })
    if (status === "suspended") await revokeAllUserAuth(tx, userId, new Date())
    await tx.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.email ?? "Admin",
        action: "staff.status",
        module: "tim",
        targetId: userId,
        targetLabel: userId,
        outcome: "success",
        detail: `Status staf ${userId} diubah menjadi ${status}.`,
      },
    })
  })

  return { ok: true }
}
