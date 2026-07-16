"use client"

import Image from "next/image"
import { useLocale } from "next-intl"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/navigation"
import type { LocalizedArticle } from "@/lib/server/articles"
import { cn, formatDate } from "@/lib/utils"

const categoryLabels = {
  guides: { id: "Panduan", en: "Guides" },
  comparisons: { id: "Perbandingan", en: "Comparisons" },
  security: { id: "Keamanan", en: "Security" },
  developers: { id: "Developer", en: "Developers" },
} as const

export function ArticleList({ articles }: { articles: LocalizedArticle[] }) {
  const locale = useLocale() === "en" ? "en" : "id"
  const [category, setCategory] = useState("all")
  const categories = Array.from(new Set(articles.map((article) => article.category)))
  const visible =
    category === "all" ? articles : articles.filter((article) => article.category === category)

  if (articles.length === 0) {
    return (
      <p className="py-8 text-center text-foreground/60">
        {locale === "en" ? "No articles yet." : "Belum ada artikel."}
      </p>
    )
  }

  return (
    <>
      <fieldset className="mt-7 flex flex-wrap gap-2">
        <legend className="sr-only">
          {locale === "en" ? "Article categories" : "Kategori artikel"}
        </legend>
        {["all", ...categories].map((value) => {
          const label =
            value === "all"
              ? locale === "en"
                ? "All"
                : "Semua"
              : (categoryLabels[value as keyof typeof categoryLabels]?.[locale] ?? value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={cn(
                "rounded-base border-2 border-border px-3.5 py-1.5 font-heading text-sm font-bold transition-all",
                category === value
                  ? "bg-main text-main-foreground shadow-shadow-sm"
                  : "bg-secondary-background hover:-translate-y-0.5",
              )}
            >
              {label}
            </button>
          )
        })}
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((article, index) => (
          <Link
            key={article.key}
            href={`/artikel/${article.slug}`}
            className="group flex min-w-0 flex-col overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow transition-all hover:-translate-y-1 hover:shadow-shadow-lg"
          >
            <div className="relative aspect-video overflow-hidden border-b-2 border-border bg-main/10">
              <Image
                src={article.coverImage}
                alt=""
                fill
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <Badge variant="neutral" className="w-fit">
                {categoryLabels[article.category as keyof typeof categoryLabels]?.[locale] ??
                  article.category}
              </Badge>
              <h2 className="font-heading text-lg font-bold leading-snug">{article.title}</h2>
              <p className="line-clamp-3 text-sm leading-6 text-foreground/70">{article.excerpt}</p>
              <span className="mt-auto pt-3 text-xs text-foreground/60">
                {formatDate(article.publishedAt, locale === "en" ? "en-US" : "id-ID")} ·{" "}
                {article.readMinutes} {locale === "en" ? "min read" : "menit baca"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
