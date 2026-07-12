"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { useArticles } from "@/lib/api/queries"
import { cn, formatDate } from "@/lib/utils"

const ACCENTS = ["accent-cyan", "accent-lime", "accent-pink", "accent-purple"]
const EMOJIS = ["🎓", "🤖", "🔐", "⚡"]

export function ArticleList() {
  const t = useTranslations("blog")
  const isEn = useLocale() === "en"
  const [cat, setCat] = useState("all")

  const { data: articles = [] as any[] } = useArticles()

  const cats: string[] = Array.from(new Set(articles.map((a: any) => a.category)))
  const list = cat === "all" ? articles : articles.filter((a: any) => a.category === cat)

  const filters = [
    { value: "all", label: isEn ? "All" : "Semua" },
    ...cats.map((c: string) => ({ value: c, label: c })),
  ]

  if (articles.length === 0) {
    return (
      <p className="py-8 text-center text-foreground/60">
        {isEn ? "No articles yet." : "Belum ada artikel."}
      </p>
    )
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setCat(f.value)}
            aria-pressed={cat === f.value}
            className={cn(
              "rounded-base border-2 border-border px-3.5 py-1.5 font-heading text-sm font-bold transition-all",
              cat === f.value
                ? "bg-main text-main-foreground shadow-shadow-sm"
                : "bg-secondary-background hover:-translate-y-0.5",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a: any, i: number) => (
          <Link
            key={a.slug}
            href={`/artikel/${a.slug}`}
            className="group flex flex-col overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow transition-shadow hover:shadow-shadow-lg"
          >
            <div
              className={cn(
                "flex aspect-[16/9] items-center justify-center border-b-2 border-border text-6xl",
                bgFor(ACCENTS[i % ACCENTS.length]),
              )}
            >
              {EMOJIS[i % EMOJIS.length]}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <Badge variant="neutral">{a.category}</Badge>
              </div>
              <h2 className="font-heading text-lg font-bold leading-snug">
                {a.title}
              </h2>
              <p className="line-clamp-2 text-sm text-foreground/70">
                {a.excerpt}
              </p>
              <span className="mt-auto pt-2 text-xs text-foreground/60">
                {formatDate(a.publishedAt, isEn ? "en-US" : "id-ID")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
