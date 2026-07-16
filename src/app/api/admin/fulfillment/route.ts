import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags, serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { rejectUntrustedRequestOrigin } from "@/lib/server/request-security"

export const runtime = "nodejs"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") return null
  return session
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["WAITING_STOCK", "READY_TO_SEND", "RISK_REVIEW", "SENT"]).optional(),
  risk: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)))
  const status = url.searchParams.get("status") ?? undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const [tasks, total] = await Promise.all([
    prisma.fulfillmentTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.fulfillmentTask.count({ where }),
  ])

  return NextResponse.json({ data: tasks, total, page, limit })
}

export async function PATCH(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { id, status, risk } = parsed.data

  const data: Record<string, unknown> = {}
  if (status) data.status = status
  if (risk) data.risk = risk

  const task = await prisma.fulfillmentTask.update({
    where: { id },
    data,
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "fulfillment.update",
      module: "fulfillment",
      targetId: task.invoice,
      targetLabel: task.productName,
      outcome: "success",
      detail: `Fulfillment ${task.invoice} diperbarui.`,
    },
  })

  return NextResponse.json({ ok: true, task })
}
