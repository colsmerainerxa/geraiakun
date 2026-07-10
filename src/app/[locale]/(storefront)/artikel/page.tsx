import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { ArticleList } from "@/components/storefront/article-list"
import { articles } from "@/lib/mock/articles"
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"
import { backendFlags } from "@/lib/server/env"

async function getPrisma() {
  return (await import("@/lib/server/prisma")).prisma
}

function isDbUnavailable(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  const record = error as Record<string, unknown>
  return (
    record.code === "P2021" ||
    String(record.message ?? "").includes("does not exist") ||
    String(record.message ?? "").includes("TableDoesNotExist")
  )
}

async function getArticleSlugs() {
  if (!backendFlags.databaseConfigured)
    return articles.map((a) => ({ slug: a.slug, title: a.title }))
  try {
    const prisma = await getPrisma()
    const dbArticles = await prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    })
    return dbArticles
  } catch (error) {
    if (isDbUnavailable(error)) return articles.map((a) => ({ slug: a.slug, title: a.title }))
    throw error
  }
}

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
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("blog")

  const articleSlugs = await getArticleSlugs()

  return (
    <Container className="py-12">
      <JsonLd
        id="jsonld-article-list"
        data={itemListJsonLd(
          articleSlugs.map((a) => ({
            name: a.title,
            path: `/artikel/${a.slug}`,
          })),
        )}
      />
      <SectionHeading eyebrow="Blog" title={t("title")} subtitle={t("subtitle")} />
      <ArticleList />
    </Container>
  )
}
