import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  const category = searchParams.get("category")
  const limit = searchParams.get("limit")

  if (slug) {
    const article = await prisma.article.findUnique({ where: { slug } })
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(article)
  }

  const articles = await prisma.article.findMany({
    where: {
      published: true,
      ...(category ? { category } : {}),
    },
    orderBy: { publishedAt: "desc" },
    ...(limit ? { take: Number(limit) } : {}),
  })

  return NextResponse.json(articles)
}
