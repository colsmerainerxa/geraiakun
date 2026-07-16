import type { ArticleLocale } from "@/content/articles/types"
import { routing } from "@/i18n/routing"

/** Canonical production origin — single source of truth for SEO/metadata. */
export const SITE_URL = "https://geraiakun.id"

/**
 * Build locale-aware `alternates` for Metadata. Indonesian lives at
 * "/id/path"; English at "/en/path". Each page canonicalizes to ITSELF (so /en
 * pages are not deindexed as duplicates of /id), with reciprocal hreflang +
 * x-default pointing at the default-locale URL.
 * Pass `path` without locale prefix, e.g. "/katalog" or "" for home.
 */
export function seoAlternates(locale: string, path: string) {
  const idPath = `/id${path}` // "" -> "/id", "/katalog" -> "/id/katalog"
  const enPath = `/en${path}` // "" -> "/en", "/katalog" -> "/en/katalog"
  const canonical = locale === routing.defaultLocale ? idPath : enPath
  return {
    canonical,
    languages: { id: idPath, en: enPath, "x-default": idPath },
  }
}

export function articleAlternates(locale: ArticleLocale, idSlug: string, enSlug: string) {
  const idPath = `/id/artikel/${idSlug}`
  const enPath = `/en/artikel/${enSlug}`
  return {
    canonical: locale === "id" ? idPath : enPath,
    languages: { id: idPath, en: enPath, "x-default": idPath },
  }
}
