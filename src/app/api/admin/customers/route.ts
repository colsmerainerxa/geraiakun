import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") return null
  return session
}

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
  const search = url.searchParams.get("search") ?? undefined
  const status = url.searchParams.get("status") ?? undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { role: "CUSTOMER" }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }
  if (status) where.profile = { status }

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

  return NextResponse.json({ data: users, total, page, limit })
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ ok: true, mode: "demo" })
  }

  const body = await request.json()
  const { id, name, email, whatsapp, notes } = body as {
    id?: string
    name?: string
    email?: string
    whatsapp?: string
    notes?: string
  }

  if (!id) {
    return NextResponse.json({ error: "Missing customer id" }, { status: 400 })
  }

  // Update User fields
  const userData: Record<string, unknown> = {}
  if (name) userData.name = name
  if (email) userData.email = email.toLowerCase()
  if (Object.keys(userData).length > 0) {
    await prisma.user.update({ where: { id }, data: userData })
  }

  // Update CustomerProfile fields
  const profileData: Record<string, unknown> = {}
  if (whatsapp !== undefined) profileData.whatsapp = whatsapp
  // ponytail: no `notes` column on CustomerProfile; skip until schema adds it
  void notes
  if (Object.keys(profileData).length > 0) {
    await prisma.customerProfile.update({
      where: { userId: id },
      data: profileData,
    })
  }

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "customer.update",
      module: "pelanggan",
      targetId: id,
      targetLabel: id,
      outcome: "success",
      detail: `Profil pelanggan diperbarui.`,
    },
  })

  return NextResponse.json({ ok: true })
}
