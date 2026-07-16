import type { MetadataRoute } from "next"
import { SITE_URL } from "./site"

export interface ArticleSitemapPair {
  idSlug: string
  enSlug: string
  updatedAt: string
}

export function localizedArticlePath(pathname: string, alternateSlug: string) {
  return /^\/artikel\/[^/]+\/?$/.test(pathname) ? `/artikel/${alternateSlug}` : pathname
}

export function articleSitemapEntries(pairs: ArticleSitemapPair[]): MetadataRoute.Sitemap {
  return pairs.flatMap((pair) => {
    const idUrl = `${SITE_URL}/id/artikel/${pair.idSlug}`
    const enUrl = `${SITE_URL}/en/artikel/${pair.enSlug}`
    const languages = { id: idUrl, en: enUrl, "x-default": idUrl }
    return [
      {
        url: idUrl,
        lastModified: pair.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: { languages },
      },
      {
        url: enUrl,
        lastModified: pair.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: { languages },
      },
    ]
  })
}
