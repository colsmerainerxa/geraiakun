import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags, serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { rejectUntrustedRequestOrigin } from "@/lib/server/request-security"
import { createStaffInvite } from "@/lib/server/staff-invite"
import { revokeAllUserAuth } from "@/lib/server/trusted-devices"

const staffRoleSchema = z.enum(["owner", "operations", "customer-support", "finance", "marketing"])

const postSchema = z.strictObject({
  name: z.string().min(2),
  email: z.string().email(),
  role: staffRoleSchema,
})

const patchSchema = z.strictObject({
  id: z.string().min(1),
  role: staffRoleSchema.optional(),
  status: z.enum(["active", "invited", "suspended"]).optional(),
  twoFactorEnabled: z.boolean().optional(),
})

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
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const parsed = postSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { name, email } = parsed.data

  const normalizedEmail = email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  let invitation: Awaited<ReturnType<typeof createStaffInvite>>
  try {
    invitation = await createStaffInvite({ name, email: normalizedEmail })
  } catch {
    return NextResponse.json({ error: "Unable to send staff invitation" }, { status: 503 })
  }
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

  return NextResponse.json({ ok: true, id: user.id, previewUrl: invitation.previewUrl })
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
  const { id, role, status, twoFactorEnabled } = parsed.data

  const data: Record<string, unknown> = {}
  if (typeof twoFactorEnabled === "boolean") data.twoFactorEnabled = twoFactorEnabled
  if (status) data.status = status
  if (role) data.role = "ADMIN" // ponytail: UserRole only has CUSTOMER|ADMIN

  const staff = await prisma.$transaction(async (tx) => {
    const updated = await tx.adminStaff.update({
      where: { userId: id },
      data,
    })
    if (status === "suspended") await revokeAllUserAuth(tx, id, new Date())
    await tx.auditEvent.create({
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
    return updated
  })

  return NextResponse.json({ ok: true, staff })
}

export async function DELETE(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
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
