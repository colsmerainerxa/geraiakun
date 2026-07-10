import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { Reveal } from "@/components/shared/motion"
import { ProductCard } from "@/components/storefront/product-card"
import { ShareButtons } from "@/components/storefront/share-buttons"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/navigation"
import { articles, getArticle, relatedArticles } from "@/lib/mock/articles"
import { articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"
import { formatDate } from "@/lib/utils"
import { getCatalogProducts } from "@/lib/server/catalog"
import { backendFlags } from "@/lib/server/env"
import type { Article } from "@/lib/mock/articles"

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

function dbArticleToArticle(
  db: { slug: string; title: string; excerpt: string; body: string; category: string; publishedAt: Date },
): Article {
  return {
    slug: db.slug,
    title: db.title,
    titleEn: db.title,
    excerpt: db.excerpt,
    excerptEn: db.excerpt,
    category: db.category,
    categoryEn: db.category,
    emoji: "📝",
    accent: "accent-cyan",
    date: db.publishedAt.toISOString(),
    readMinutes: Math.max(1, Math.ceil(db.body.split(/\s+/).length / 200)),
    sections: [
      {
        heading: db.title,
        headingEn: db.title,
        body: db.body,
        bodyEn: db.body,
      },
    ],
    relatedSlugs: [],
  }
}

async function getArticleFromDb(slug: string): Promise<Article | null> {
  if (!backendFlags.databaseConfigured) return getArticle(slug) ?? null
  try {
    const prisma = await getPrisma()
    const dbArticle = await prisma.article.findUnique({
      where: { slug, published: true },
    })
    return dbArticle ? dbArticleToArticle(dbArticle) : null
  } catch (error) {
    if (isDbUnavailable(error)) return getArticle(slug) ?? null
    throw error
  }
}

async function getRelatedArticlesFromDb(slug: string, limit = 3): Promise<Article[]> {
  if (!backendFlags.databaseConfigured) return relatedArticles(slug, limit)
  try {
    const prisma = await getPrisma()
    const dbArticles = await prisma.article.findMany({
      where: { published: true, slug: { not: slug } },
      orderBy: { publishedAt: "desc" },
      take: limit,
    })
    return dbArticles.map(dbArticleToArticle)
  } catch (error) {
    if (isDbUnavailable(error)) return relatedArticles(slug, limit)
    throw error
  }
}

export function generateStaticParams() {
  return articles.flatMap((a) => ["id", "en"].map((locale) => ({ locale, slug: a.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const article = await getArticleFromDb(slug)
  if (!article) return {}
  const isEn = locale === "en"
  const title = isEn ? article.titleEn : article.title
  const description = isEn ? article.excerptEn : article.excerpt
  return {
    title,
    description,
    alternates: seoAlternates(locale, `/artikel/${slug}`),
    openGraph: {
      type: "article",
      title: `${title} · geraiakun`,
      description,
      publishedTime: article.date,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const article = await getArticleFromDb(slug)
  if (!article) notFound()

  const t = await getTranslations("blog")
  const tn = await getTranslations("nav")
  const isEn = locale === "en"
  const title = isEn ? article.titleEn : article.title
  const path = locale === "en" ? `/en/artikel/${slug}` : `/artikel/${slug}`

  const allProducts = await getCatalogProducts()
  const related = allProducts.filter((p) => article.relatedSlugs.includes(p.slug))
  const more = await getRelatedArticlesFromDb(slug)

  return (
    <Container className="py-10 lg:py-12">
      <JsonLd
        id={`jsonld-article-${slug}`}
        data={articleJsonLd({
          title,
          description: isEn ? article.excerptEn : article.excerpt,
          slug,
          date: article.date,
        })}
      />
      <JsonLd
        id={`jsonld-article-breadcrumb-${slug}`}
        data={breadcrumbJsonLd([
          { name: "Beranda", path: locale === "en" ? "/en" : "/" },
          { name: tn("blog"), path: locale === "en" ? "/en/artikel" : "/artikel" },
          { name: title, path: `/artikel/${slug}` },
        ])}
      />

      <article className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-foreground/60">
          <Link href="/" className="hover:text-foreground hover:underline">
            {tn("home")}
          </Link>
          <span>/</span>
          <Link href="/artikel" className="hover:text-foreground hover:underline">
            {tn("blog")}
          </Link>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <Badge variant="default">{isEn ? article.categoryEn : article.category}</Badge>
          <span>
            {article.readMinutes} {t("readTime")}
          </span>
          <span>•</span>
          <span>{formatDate(article.date, isEn ? "en-US" : "id-ID")}</span>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-balance sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-lg text-foreground/70">
          {isEn ? article.excerptEn : article.excerpt}
        </p>

        <div className="mt-5">
          <ShareButtons path={path} title={title} />
        </div>

        {/* Body */}
        <div className="mt-8 flex flex-col gap-8">
          {article.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-heading text-xl font-bold">{isEn ? s.headingEn : s.heading}</h2>
              <p className="mt-2 leading-relaxed text-foreground/80">{isEn ? s.bodyEn : s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 border-t-2 border-dashed border-border pt-6">
          <ShareButtons path={path} title={title} />
        </div>
      </article>

      {/* Related products (internal linking) */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-heading text-2xl font-extrabold">{t("related")}</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* More articles */}
      {more.length > 0 && (
        <div className="mt-16">
          <h2 className="font-heading text-2xl font-extrabold">{t("moreArticles")}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {more.map((a) => (
              <Link
                key={a.slug}
                href={`/artikel/${a.slug}`}
                className="flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm transition-all hover:-translate-y-0.5"
              >
                <span className="text-3xl">{a.emoji}</span>
                <span className="font-heading text-sm font-bold leading-snug">
                  {isEn ? a.titleEn : a.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
