import type { MetadataRoute } from "next"
import { routing } from "@/i18n/routing"
import { categories } from "@/lib/mock/categories"
import { products } from "@/lib/mock/products"
import { type ArticleSitemapPair, articleSitemapEntries } from "@/lib/seo/articles"
import { SITE_URL } from "@/lib/seo/site"
import { backendFlags } from "@/lib/server/env"

// Stable content-update date — avoids the "lying lastmod" of new Date() that
// changes on every build/deploy. Bump when content materially changes.
const LAST_UPDATED = "2026-06-24"

// Default locale (id) lives at "/", English at "/en" (localePrefix: "as-needed").
function localized(path: string) {
  const idUrl = `${SITE_URL}${path}`
  const languages: Record<string, string> = { id: idUrl }
  for (const loc of routing.locales) {
    if (loc === routing.defaultLocale) continue
    languages[loc] = `${SITE_URL}/${loc}${path}`
  }
  return { url: idUrl, languages }
}

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  lastModified: string = LAST_UPDATED,
): MetadataRoute.Sitemap[number] {
  const { url, languages } = localized(path)
  return {
    url,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }
}

async function getPrisma() {
  return (await import("@/lib/server/prisma")).prisma
}

function isDbUnavailable(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  const record = error as Record<string, unknown>
  return (
    record.code === "P2021" ||
    String(record.message ?? "").includes("does not exist") ||
    String(record.message ?? "").includes("TableDoesNotExist")
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("", "weekly", 1),
    entry("/katalog", "daily", 0.9),
    entry("/artikel", "weekly", 0.7),
    entry("/lacak", "monthly", 0.4),
    entry("/bantuan", "monthly", 0.5),
    entry("/tentang", "monthly", 0.4),
    entry("/kontak", "monthly", 0.4),
    entry("/syarat", "yearly", 0.2),
    entry("/privasi", "yearly", 0.2),
  ]

  let categorySlugs: string[] = categories.map((c) => c.slug)
  let productRoutes: { slug: string; updatedAt: string }[] = products.map((p) => ({
    slug: p.slug,
    updatedAt: LAST_UPDATED,
  }))
  let articlePairs: ArticleSitemapPair[] = []

  if (backendFlags.databaseConfigured) {
    try {
      const prisma = await getPrisma()
      const [dbCats, dbProducts, dbArticles] = await Promise.all([
        prisma.category.findMany({ select: { slug: true } }),
        prisma.product.findMany({
          where: { active: true },
          select: { slug: true, updatedAt: true },
        }),
        prisma.article.findMany({
          where: { published: true },
          select: {
            updatedAt: true,
            translations: { select: { locale: true, slug: true } },
          },
        }),
      ])
      categorySlugs = dbCats.map((c) => c.slug)
      productRoutes = dbProducts.map((p) => ({
        slug: p.slug,
        updatedAt: p.updatedAt.toISOString().split("T")[0],
      }))
      articlePairs = dbArticles.flatMap((article) => {
        const idSlug = article.translations.find((item) => item.locale === "id")?.slug
        const enSlug = article.translations.find((item) => item.locale === "en")?.slug
        return idSlug && enSlug
          ? [{ idSlug, enSlug, updatedAt: article.updatedAt.toISOString().split("T")[0] }]
          : []
      })
    } catch (error) {
      if (!isDbUnavailable(error)) throw error
      articlePairs = []
    }
  }

  const categoryRoutes = categorySlugs.map((slug) => entry(`/kategori/${slug}`, "weekly", 0.7))
  const productEntries = productRoutes.map((p) =>
    entry(`/produk/${p.slug}`, "weekly", 0.8, p.updatedAt),
  )
  const articleEntries = articleSitemapEntries(articlePairs)

  return [...staticRoutes, ...categoryRoutes, ...productEntries, ...articleEntries]
}
