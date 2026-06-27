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
import { products } from "@/lib/mock/products"
import { articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"
import { formatDate } from "@/lib/utils"

export function generateStaticParams() {
  return articles.flatMap((a) => ["id", "en"].map((locale) => ({ locale, slug: a.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const article = getArticle(slug)
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
      title: `${title} · beliakun`,
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
  const article = getArticle(slug)
  if (!article) notFound()

  const t = await getTranslations("blog")
  const tn = await getTranslations("nav")
  const isEn = locale === "en"
  const title = isEn ? article.titleEn : article.title
  const path = locale === "en" ? `/en/artikel/${slug}` : `/artikel/${slug}`

  const related = products.filter((p) => article.relatedSlugs.includes(p.slug))
  const more = relatedArticles(slug)

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
