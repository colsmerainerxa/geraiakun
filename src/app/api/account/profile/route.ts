import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      image: session.user.image ?? "",
      whatsapp: "",
    })
  }

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true },
    }),
    prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
      select: { whatsapp: true },
    }),
  ])

  return NextResponse.json({
    name: user?.name ?? "",
    email: user?.email ?? "",
    image: user?.image ?? "",
    whatsapp: profile?.whatsapp ?? "",
  })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, whatsapp } = body as { name?: string; whatsapp?: string }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ ok: true, mode: "demo" })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: session.user.id }, data })
  }

  if (whatsapp !== undefined) {
    await prisma.customerProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, whatsapp, status: "baru" },
      update: { whatsapp },
    })
  }

  return NextResponse.json({ ok: true })
}
