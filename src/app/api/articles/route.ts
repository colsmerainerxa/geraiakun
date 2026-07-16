import { NextResponse } from "next/server"
import type { ArticleLocale } from "@/content/articles/types"
import { getPublishedArticle, listPublishedArticles } from "@/lib/server/articles"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  const category = searchParams.get("category")
  const limit = searchParams.get("limit")
  const localeParam = searchParams.get("locale") ?? "id"

  if (localeParam !== "id" && localeParam !== "en") {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 })
  }
  const locale: ArticleLocale = localeParam

  if (slug) {
    const article = await getPublishedArticle(locale, slug)
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(article)
  }

  let articles = await listPublishedArticles(locale)
  if (category) articles = articles.filter((article) => article.category === category)
  if (limit) {
    const take = Number.parseInt(limit, 10)
    if (!Number.isFinite(take) || take < 1 || take > 100) {
      return NextResponse.json({ error: "Invalid limit" }, { status: 400 })
    }
    articles = articles.slice(0, take)
  }

  return NextResponse.json(articles)
}
