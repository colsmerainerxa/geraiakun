import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  brand: z.string().max(100).optional(),
  tagline: z.string().max(300).optional(),
  taglineEn: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  image: z.string().max(500).optional(),
  logo: z.string().max(500).optional(),
  accent: z.string().max(50).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  badges: z.array(z.enum(["BESTSELLER", "NEW", "PROMO", "RARE"])).optional(),
  features: z.array(z.string()).optional(),
  featuresEn: z.array(z.string()).optional(),
  faqs: z.array(z.any()).optional(),
  categoryId: z.string().min(1).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, category: true },
  })

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { id } = await params
  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id },
    data: Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined)),
    include: { variants: true, category: true },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { id } = await params
  const product = await prisma.product.update({
    where: { id },
    data: { active: false },
  })

  return NextResponse.json({ success: true, id: product.id })
}
