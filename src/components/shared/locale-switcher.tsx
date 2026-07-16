"use client"

import { useParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { type ReactElement, useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { useArticle } from "@/lib/api/queries"
import { localizedArticlePath } from "@/lib/seo/articles"

// SVG flags — cross-platform, no emoji font dependency
const FlagID = () => (
  <svg viewBox="0 0 24 16" className="h-3.5 w-5 rounded-[3px] ring-1 ring-border" aria-hidden>
    <title>Indonesia</title>
    <rect width="24" height="16" fill="#fff" />
    <rect width="24" height="8" y="0" fill="#e70011" />
  </svg>
)
const FlagEN = () => (
  <svg viewBox="0 0 24 16" className="h-3.5 w-5 rounded-[3px] ring-1 ring-border" aria-hidden>
    <title>English</title>
    <rect width="24" height="16" fill="#012169" />
    <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="3" />
    <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.5" />
    <path d="M12,0 V16 M0,8 H24" stroke="#fff" strokeWidth="5" />
    <path d="M12,0 V16 M0,8 H24" stroke="#C8102E" strokeWidth="3" />
  </svg>
)

const LOCALES: { code: Locale; label: string; Flag: () => ReactElement }[] = [
  { code: "id", label: "Bahasa Indonesia", Flag: FlagID },
  { code: "en", label: "English", Flag: FlagEN },
]

export function LocaleSwitcher() {
  const locale = useLocale()
  const t = useTranslations("common")
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [isPending, startTransition] = useTransition()
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]
  const articleSlug =
    pathname.startsWith("/artikel/") && typeof params.slug === "string" ? params.slug : ""
  const { data: article, isLoading: isArticleLoading } = useArticle(locale as Locale, articleSlug)

  function onSelect(next: Locale) {
    startTransition(() => {
      const nextPathname =
        next !== locale && article?.alternateSlug
          ? localizedArticlePath(pathname, article.alternateSlug)
          : pathname
      // @ts-expect-error -- params type is generic
      router.replace({ pathname: nextPathname, params }, { locale: next })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending || (articleSlug !== "" && isArticleLoading)}
        className="flex h-9 items-center justify-center gap-1 rounded-base border-2 border-border bg-secondary-background px-2 transition-all hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-60"
        aria-label={t("changeLanguage")}
      >
        <current.Flag />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => onSelect(l.code)}>
            <l.Flag />
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
