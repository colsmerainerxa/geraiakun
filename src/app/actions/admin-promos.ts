"use server"

import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const promoSchema = z.object({
  code: z.string().min(3).max(20),
  description: z.string().min(5),
  type: z.enum(["PERCENT", "NOMINAL"]),
  value: z.number().int().min(1),
  minSpend: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().nullable().optional(),
  quota: z.number().int().min(1),
  expiresAt: z.string(),
  active: z.boolean().default(true),
  scope: z.string().optional().nullable(),
})

export async function listPromos(filters?: { active?: boolean }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) return []

  return prisma.promo.findMany({
    where: filters?.active !== undefined ? { active: filters.active } : undefined,
    orderBy: { createdAt: "desc" },
  })
}

export async function createPromo(input: z.input<typeof promoSchema>) {
  const parsed = promoSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data promo tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const promo = await prisma.promo.create({
    data: {
      code: parsed.data.code.toUpperCase(),
      description: parsed.data.description,
      type: parsed.data.type,
      value: parsed.data.value,
      minSpend: parsed.data.minSpend,
      maxDiscount: parsed.data.maxDiscount,
      quota: parsed.data.quota,
      expiresAt: new Date(parsed.data.expiresAt),
      active: parsed.data.active,
      scope: parsed.data.scope,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "promo.create",
      module: "promo",
      targetId: promo.id,
      targetLabel: promo.code,
      outcome: "success",
      detail: `Promo ${promo.code} dibuat.`,
    },
  })

  return { ok: true, id: promo.id }
}

export async function updatePromo(id: string, input: z.input<typeof promoSchema>) {
  const parsed = promoSchema.safeParse(input)
  if (!parsed.success) throw new Error("Data promo tidak valid.")

  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const promo = await prisma.promo.update({
    where: { id },
    data: {
      code: parsed.data.code.toUpperCase(),
      description: parsed.data.description,
      type: parsed.data.type,
      value: parsed.data.value,
      minSpend: parsed.data.minSpend,
      maxDiscount: parsed.data.maxDiscount,
      quota: parsed.data.quota,
      expiresAt: new Date(parsed.data.expiresAt),
      active: parsed.data.active,
      scope: parsed.data.scope,
    },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "promo.update",
      module: "promo",
      targetId: promo.id,
      targetLabel: promo.code,
      outcome: "success",
      detail: `Promo ${promo.code} diperbarui.`,
    },
  })

  return { ok: true }
}

export async function deletePromo(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("ADMIN_REQUIRED")
  }
  if (!backendFlags.databaseConfigured) throw new Error("DATABASE_NOT_CONFIGURED")

  const promo = await prisma.promo.delete({ where: { id } })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "promo.delete",
      module: "promo",
      targetId: id,
      targetLabel: promo.code,
      outcome: "success",
      detail: `Promo ${promo.code} dihapus.`,
    },
  })

  return { ok: true }
}
