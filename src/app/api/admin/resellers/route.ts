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
  const tier = url.searchParams.get("tier") ?? undefined
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (tier) where.tier = tier
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.reseller.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.reseller.count({ where }),
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

  const { userId, code, tier, commission } = await request.json()

  if (!userId || !code) {
    return NextResponse.json({ error: "userId and code are required" }, { status: 400 })
  }

  const reseller = await prisma.reseller.create({
    data: { userId, code, tier, commission },
    include: { user: { select: { name: true, email: true } } },
  })

  return NextResponse.json(reseller)
}
