import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

const patchSchema = z.object({
  id: z.string().min(1),
  risk: z.enum(["rendah", "sedang", "tinggi"]),
})

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
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20))
  const status = url.searchParams.get("status") ?? undefined
  const risk = url.searchParams.get("risk") ?? undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (risk) {
    where.risk = risk
  } else {
    where.NOT = { risk: "rendah" }
  }

  const [data, total] = await Promise.all([
    prisma.fulfillmentTask.findMany({
      where,
      include: { order: { select: { invoice: true, customerName: true, customerEmail: true, status: true, total: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.fulfillmentTask.count({ where }),
  ])

  return NextResponse.json({ data, total, page, limit })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }
  const { id, risk } = parsed.data

  const task = await prisma.fulfillmentTask.update({
    where: { id },
    data: { risk },
    include: { order: { select: { invoice: true, customerName: true, customerEmail: true, status: true, total: true } } },
  })

  return NextResponse.json(task)
}
