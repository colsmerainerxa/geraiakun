import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

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
  const categorySlug = url.searchParams.get("category") ?? undefined
  const active = url.searchParams.get("active")

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ]
  }
  if (categorySlug) {
    where.category = { slug: categorySlug }
  }
  if (active !== null) {
    where.active = active === "true"
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { variants: true, category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({ data, total, page, limit })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const body = await request.json()

  if (!body.name || !body.slug || !body.brand || !body.categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      brand: body.brand,
      tagline: body.tagline ?? "",
      taglineEn: body.taglineEn ?? "",
      description: body.description ?? "",
      descriptionEn: body.descriptionEn ?? "",
      categoryId: body.categoryId,
      image: body.image ?? "",
      logo: body.logo ?? "",
      accent: body.accent ?? "#000000",
      badges: body.badges ?? [],
      features: body.features ?? [],
      featuresEn: body.featuresEn ?? [],
      featured: body.featured ?? false,
      faqs: body.faqs ?? [],
    },
    include: { variants: true, category: true },
  })

  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      actorName: session.user.email ?? "Admin",
      action: "product.create",
      module: "produk",
      targetId: product.id,
      targetLabel: product.name,
      outcome: "success",
      detail: `Produk ${product.name} dibuat.`,
    },
  })

  return NextResponse.json(product)
}
