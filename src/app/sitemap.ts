import type { MetadataRoute } from "next"
import { routing } from "@/i18n/routing"
import { articles } from "@/lib/mock/articles"
import { categories } from "@/lib/mock/categories"
import { products } from "@/lib/mock/products"
import { SITE_URL } from "@/lib/seo/site"

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

export default function sitemap(): MetadataRoute.Sitemap {
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

  const categoryRoutes = categories.map((c) => entry(`/kategori/${c.slug}`, "weekly", 0.7))

  const productRoutes = products.map((p) => entry(`/produk/${p.slug}`, "weekly", 0.8))

  const articleRoutes = articles.map((a) => entry(`/artikel/${a.slug}`, "monthly", 0.6, a.date))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...articleRoutes]
}
