"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { articles } from "@/lib/mock/articles"
import { cn, formatDate } from "@/lib/utils"

export function ArticleList() {
  const t = useTranslations("blog")
  const isEn = useLocale() === "en"
  const [cat, setCat] = useState("all")

  // Filter by the id-category string (stable key); display label by locale.
  const cats = Array.from(new Set(articles.map((a) => a.category)))
  const catLabel = (c: string) =>
    isEn ? (articles.find((a) => a.category === c)?.categoryEn ?? c) : c
  const list = cat === "all" ? articles : articles.filter((a) => a.category === cat)

  const filters = [
    { value: "all", label: isEn ? "All" : "Semua" },
    ...cats.map((c) => ({ value: c, label: catLabel(c) })),
  ]

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
        {list.map((a) => (
          <Link
            key={a.slug}
            href={`/artikel/${a.slug}`}
            className="group flex flex-col overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow transition-shadow hover:shadow-shadow-lg"
          >
            <div
              className={cn(
                "flex aspect-[16/9] items-center justify-center border-b-2 border-border text-6xl",
                bgFor(a.accent),
              )}
            >
              {a.emoji}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <Badge variant="neutral">{isEn ? a.categoryEn : a.category}</Badge>
                <span>
                  {a.readMinutes} {t("readTime")}
                </span>
              </div>
              <h2 className="font-heading text-lg font-bold leading-snug">
                {isEn ? a.titleEn : a.title}
              </h2>
              <p className="line-clamp-2 text-sm text-foreground/70">
                {isEn ? a.excerptEn : a.excerpt}
              </p>
              <span className="mt-auto pt-2 text-xs text-foreground/50">
                {formatDate(a.date, isEn ? "en-US" : "id-ID")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
