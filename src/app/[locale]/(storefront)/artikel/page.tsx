import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { ArticleList } from "@/components/storefront/article-list"
import type { ArticleLocale } from "@/content/articles/types"
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"
import { listPublishedArticles } from "@/lib/server/articles"

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

export default async function ArtikelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: ArticleLocale = rawLocale === "en" ? "en" : "id"
  setRequestLocale(locale)
  const t = await getTranslations("blog")
  const articles = await listPublishedArticles(locale)

  return (
    <Container className="py-12">
      <JsonLd
        id="jsonld-article-list"
        data={itemListJsonLd(
          articles.map((article) => ({
            name: article.title,
            path: `/${locale}/artikel/${article.slug}`,
          })),
        )}
      />
      <SectionHeading eyebrow="Blog" title={t("title")} titleAs="h1" subtitle={t("subtitle")} />
      <ArticleList articles={articles} />
    </Container>
  )
}
