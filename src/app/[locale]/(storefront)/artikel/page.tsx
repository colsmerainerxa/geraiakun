import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { ArticleList } from "@/components/storefront/article-list"
import { articles } from "@/lib/mock/articles"
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"

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
      <ArticleList />
    </Container>
  )
}
