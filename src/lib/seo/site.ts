import { routing } from "@/i18n/routing"

/** Canonical production origin — single source of truth for SEO/metadata. */
export const SITE_URL = "https://beliakun.id"

/**
 * Build locale-aware `alternates` for Metadata. Default locale (id) lives at
 * "/path"; English at "/en/path". Each page canonicalizes to ITSELF (so /en
 * pages are not deindexed as duplicates of /id), with reciprocal hreflang +
 * x-default pointing at the default-locale URL.
 * Pass `path` without locale prefix, e.g. "/katalog" or "" for home.
 */
export function seoAlternates(locale: string, path: string) {
  const idPath = path === "" ? "/" : path
  const enPath = `/en${path}` // "" -> "/en", "/katalog" -> "/en/katalog"
  const canonical = locale === routing.defaultLocale ? idPath : enPath
  return {
    canonical,
    languages: { id: idPath, en: enPath, "x-default": idPath },
  }
}
