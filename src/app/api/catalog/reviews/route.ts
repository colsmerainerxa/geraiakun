import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { rejectUntrustedRequestOrigin } from "@/lib/server/request-security"

const postSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  userName: z.string().min(1).optional(),
  title: z.string().optional(),
  body: z.string().optional(),
})

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")
  const slug = searchParams.get("slug")

  if (!productId && !slug) {
    return NextResponse.json({ error: "productId or slug required" }, { status: 400 })
  }

  let resolvedProductId = productId
  if (!resolvedProductId && slug) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    resolvedProductId = product.id
  }

  const reviews = await prisma.review.findMany({
    where: { productId: resolvedProductId! },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(reviews)
}

export async function POST(req: Request) {
  const originError = rejectUntrustedRequestOrigin(req, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = postSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { productId, rating, title, body } = parsed.data

  const review = await prisma.review.create({
    data: {
      productId,
      userId: session.user.id,
      userName: session.user.name ?? "Anonymous",
      rating: Number(rating),
      title: title ?? "",
      body: body ?? "",
    },
  })

  return NextResponse.json(review, { status: 201 })
}
