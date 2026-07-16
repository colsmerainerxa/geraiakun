import { SITE_URL } from "./site"

export interface DiscoveryArticle {
  locale: "id" | "en"
  title: string
  description: string
  url: string
}

export function buildLlmsText(articles: DiscoveryArticle[]) {
  const sections = (["id", "en"] as const).map((locale) => {
    const heading = locale === "id" ? "Bahasa Indonesia" : "English"
    const entries = articles
      .filter((article) => article.locale === locale)
      .map((article) => `- [${article.title}](${article.url}): ${article.description}`)
      .join("\n")
    return `## ${heading}\n\n${entries}`
  })

  return [
    "# geraiakun",
    "",
    "Marketplace dan panduan praktis untuk layanan digital. Artikel publik tersedia dalam Bahasa Indonesia dan English.",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
    ...sections,
    "",
  ].join("\n")
}

export function buildIndexNowPayload({ key, urls }: { key: string; urls: string[] }) {
  return {
    host: new URL(SITE_URL).host,
    key,
    keyLocation: `${SITE_URL}/indexnow-key.txt`,
    urlList: Array.from(new Set(urls)),
  }
}
