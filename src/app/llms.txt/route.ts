import { buildLlmsText } from "@/lib/seo/discovery"
import { SITE_URL } from "@/lib/seo/site"
import { listPublishedArticles } from "@/lib/server/articles"

export async function GET() {
  const [idArticles, enArticles] = await Promise.all([
    listPublishedArticles("id"),
    listPublishedArticles("en"),
  ])
  const text = buildLlmsText([
    ...idArticles.map((article) => ({
      locale: "id" as const,
      title: article.title,
      description: article.excerpt,
      url: `${SITE_URL}/id/artikel/${article.slug}`,
    })),
    ...enArticles.map((article) => ({
      locale: "en" as const,
      title: article.title,
      description: article.excerpt,
      url: `${SITE_URL}/en/artikel/${article.slug}`,
    })),
  ])

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
