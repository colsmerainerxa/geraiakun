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

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json([])
  }

  const staff = await prisma.adminStaff.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(staff)
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ ok: true, mode: "demo" })
  }

  const body = await request.json()
  const { name, email, password, role } = body as {
    name?: string
    email?: string
    password?: string
    role?: string
  }

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name too short" }, { status: 400 })
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const { hashPassword } = await import("@/lib/server/password")
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      adminStaff: {
        create: {
          status: "active",
          role: role === "ADMIN" ? "ADMIN" : "ADMIN", // ponytail: UserRole only has CUSTOMER|ADMIN; add when more roles exist
        },
      },
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

  return NextResponse.json({ ok: true, id: user.id })
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
  const { id, role, status, twoFactorEnabled } = body as {
    id?: string
    role?: string
    status?: string
    twoFactorEnabled?: boolean
  }

  if (!id) {
    return NextResponse.json({ error: "Missing staff id" }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (typeof twoFactorEnabled === "boolean") data.twoFactorEnabled = twoFactorEnabled
  if (status) data.status = status
  if (role) data.role = "ADMIN" // ponytail: UserRole only has CUSTOMER|ADMIN

  const staff = await prisma.adminStaff.update({
    where: { userId: id },
    data,
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "staff.update",
      module: "tim",
      targetId: id,
      targetLabel: id,
      outcome: "success",
      detail: `Staf ${id} diperbarui.`,
    },
  })

  return NextResponse.json({ ok: true, staff })
}

export async function DELETE(request: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ ok: true, mode: "demo" })
  }

  const url = new URL(request.url)
  const userId = url.searchParams.get("id")
  if (!userId) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
  }
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
  }

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

  return NextResponse.json({ ok: true })
}
