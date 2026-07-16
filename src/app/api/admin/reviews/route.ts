import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags, serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { rejectUntrustedRequestOrigin } from "@/lib/server/request-security"

const postSchema = z.object({
  productId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1),
  body: z.string().optional(),
})

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["published", "rejected"]),
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
  const search = url.searchParams.get("search") ?? undefined
  const rating = url.searchParams.get("rating") ?? undefined
  const productId = url.searchParams.get("productId") ?? undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (productId) where.productId = productId
  if (rating) where.rating = Number(rating)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } },
      { userName: { contains: search, mode: "insensitive" } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  return NextResponse.json({ data, total, page, limit })
}

export async function POST(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
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
  const { productId, userId, userName, rating, title, body } = parsed.data

  const review = await prisma.review.create({
    data: { productId, userId, userName, rating: Number(rating), title, body: body ?? "" },
    include: { product: { select: { name: true } } },
  })

  return NextResponse.json(review)
}

// ponytail: Review has no `status` column; using `verified` as proxy (published→true, rejected→false). Add a status enum when moderation states beyond binary are needed.
export async function PATCH(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
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
  const { id, status } = parsed.data

  const review = await prisma.review.update({
    where: { id },
    data: { verified: status === "published" },
    include: { product: { select: { name: true } } },
  })

  return NextResponse.json(review)
}

export async function DELETE(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
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

  await prisma.review.delete({ where: { id } })

  return NextResponse.json({ success: true, id })
}
