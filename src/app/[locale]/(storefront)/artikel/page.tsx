import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { articles } from "@/lib/mock/articles"
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"
import { cn, formatDate } from "@/lib/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "blog" })
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: seoAlternates(locale, "/artikel"),
  }
}

export default async function ArtikelPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("blog")
  const isEn = locale === "en"

  return (
    <Container className="py-12">
      <JsonLd
        data={itemListJsonLd(
          articles.map((a) => ({
            name: isEn ? a.titleEn : a.title,
            path: `/artikel/${a.slug}`,
          })),
        )}
      />
      <SectionHeading eyebrow="Blog" title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
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
                <Badge variant="neutral">
                  {isEn ? a.categoryEn : a.category}
                </Badge>
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
    </Container>
  )
}
