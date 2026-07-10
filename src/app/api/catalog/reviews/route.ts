import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/server/prisma"

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
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { productId, rating, title, body } = await req.json()

  if (!productId || !rating || !title || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const review = await prisma.review.create({
    data: {
      productId,
      userId: session.user.id,
      userName: session.user.name ?? "Anonymous",
      rating: Number(rating),
      title,
      body,
    },
  })

  return NextResponse.json(review, { status: 201 })
}
