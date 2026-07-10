import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const createSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  type: z.enum(["PERCENT", "NOMINAL"]),
  value: z.number().min(0),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().min(1),
  active: z.boolean().optional(),
  maxUses: z.number().int().min(1).optional(),
})
const patchSchema = createSchema.partial()

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json([])
  }

  const promos = await prisma.promo.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(promos)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }
  const { code, description, type, value, minPurchase, maxDiscount, startsAt, expiresAt, active, maxUses } = parsed.data

  const promo = await prisma.promo.create({
    data: {
      code: String(code).toUpperCase(),
      description,
      type,
      value: Number(value),
      minSpend: Number(minPurchase ?? 0),
      maxDiscount: maxDiscount != null ? Number(maxDiscount) : null,
      quota: Number(maxUses ?? 1),
      expiresAt: new Date(expiresAt),
      active: active ?? true,
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

  return NextResponse.json(promo)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }
  const { code, description, type, value, minPurchase, maxDiscount, startsAt, expiresAt, active, maxUses } = parsed.data

  const data: Record<string, unknown> = {}
  if (code != null) data.code = String(code).toUpperCase()
  if (description != null) data.description = description
  if (type != null) data.type = type
  if (value != null) data.value = Number(value)
  if (minPurchase != null) data.minSpend = Number(minPurchase)
  if (maxDiscount !== undefined) data.maxDiscount = maxDiscount != null ? Number(maxDiscount) : null
  if (expiresAt != null) data.expiresAt = new Date(expiresAt)
  if (active != null) data.active = active
  if (maxUses != null) data.quota = Number(maxUses)

  const promo = await prisma.promo.update({ where: { id }, data })

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

  return NextResponse.json(promo)
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 })
  }

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

  return NextResponse.json({ success: true, id })
}
