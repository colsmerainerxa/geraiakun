import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags, serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { rejectUntrustedRequestOrigin } from "@/lib/server/request-security"

const productIdSchema = z.object({ productId: z.string().min(1) })

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json([])
  }

  const wishlist = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(wishlist)
}

export async function POST(req: Request) {
  const originError = rejectUntrustedRequestOrigin(req, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const parsed = productIdSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { productId } = parsed.data

  const item = await prisma.wishlist.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId },
    update: {},
    include: { product: true },
  })

  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(req: Request) {
  const originError = rejectUntrustedRequestOrigin(req, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const parsed = productIdSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { productId } = parsed.data

  await prisma.wishlist.deleteMany({
    where: { userId: session.user.id, productId },
  })

  return NextResponse.json({ ok: true })
}
