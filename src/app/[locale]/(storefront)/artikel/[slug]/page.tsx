import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { Reveal } from "@/components/shared/motion"
import { ArticleBody } from "@/components/storefront/article-body"
import { ProductCard } from "@/components/storefront/product-card"
import { ShareButtons } from "@/components/storefront/share-buttons"
import { Badge } from "@/components/ui/badge"
import type { ArticleLocale } from "@/content/articles/types"
import { Link } from "@/i18n/navigation"
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { articleAlternates, SITE_URL } from "@/lib/seo/site"
import {
  getPublishedArticle,
  getRelatedArticles,
  resolveLegacyArticle,
} from "@/lib/server/articles"
import { getCatalogProducts } from "@/lib/server/catalog"
import { formatDate } from "@/lib/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale: ArticleLocale = rawLocale === "en" ? "en" : "id"
  const article = await getPublishedArticle(locale, slug)
  if (!article) return {}
  const idSlug = locale === "id" ? article.slug : article.alternateSlug
  const enSlug = locale === "en" ? article.slug : article.alternateSlug
  const articlePath = `/${locale}/artikel/${article.slug}`
  const articleUrl = `${SITE_URL}${articlePath}`
  const imageUrl = `${SITE_URL}${article.coverImage}`
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: articleAlternates(locale, idSlug, enSlug),
    openGraph: {
      type: "article",
      url: articleUrl,
      locale: locale === "en" ? "en_US" : "id_ID",
      alternateLocale: locale === "en" ? ["id_ID"] : ["en_US"],
      title: article.seoTitle,
      description: article.seoDescription,
      images: [{ url: imageUrl, width: 1600, height: 900, alt: article.title }],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.seoDescription,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale: ArticleLocale = rawLocale === "en" ? "en" : "id"
  setRequestLocale(locale)
  const article = await getPublishedArticle(locale, slug)
  if (!article) {
    const replacementSlug = await resolveLegacyArticle(locale, slug)
    if (replacementSlug) permanentRedirect(`/${locale}/artikel/${replacementSlug}`)
    notFound()
  }

  const t = await getTranslations("blog")
  const tn = await getTranslations("nav")
  const isEn = locale === "en"
  const alternateLocale: ArticleLocale = isEn ? "id" : "en"
  const sharePath = `/${locale}/artikel/${article.slug}`
  const articleUrl = `${SITE_URL}${sharePath}`
  const allProducts = await getCatalogProducts()
  const relatedProducts = allProducts.filter((product) =>
    article.relatedProductSlugs.includes(product.slug),
  )
  const relatedArticles = await getRelatedArticles(locale, article.key)

  return (
    <Container className="py-10 lg:py-12">
      <JsonLd
        id={`jsonld-article-${article.key}-${locale}`}
        data={articleJsonLd({
          title: article.title,
          description: article.excerpt,
          url: articleUrl,
          image: `${SITE_URL}${article.coverImage}`,
          locale,
          publishedAt: article.publishedAt,
          modifiedAt: article.updatedAt,
          authorName: article.authorName,
          keywords: article.tags,
        })}
      />
      <JsonLd
        id={`jsonld-article-breadcrumb-${article.key}-${locale}`}
        data={breadcrumbJsonLd([
          { name: tn("home"), path: `/${locale}` },
          { name: tn("blog"), path: `/${locale}/artikel` },
          { name: article.title, path: sharePath },
        ])}
      />
      <JsonLd
        id={`jsonld-article-faq-${article.key}-${locale}`}
        data={faqPageJsonLd(
          article.content.faq.map((item) => ({ q: item.question, a: item.answer })),
        )}
      />
      <article className="mx-auto max-w-3xl">
        <nav
          className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-foreground/60"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-foreground hover:underline">
            {tn("home")}
          </Link>
          <span>/</span>
          <Link href="/artikel" className="hover:text-foreground hover:underline">
            {tn("blog")}
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/60">
          <Badge variant="default">{article.category}</Badge>
          <span>
            {article.readMinutes} {t("readTime")}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt}>
            {formatDate(article.publishedAt, isEn ? "en-US" : "id-ID")}
          </time>
        </div>
        <h1 className="mt-3 text-balance font-heading text-3xl font-extrabold leading-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/70">{article.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y-2 border-dashed border-border py-4 text-sm">
          <div>
            <span className="font-semibold">{article.authorName}</span>
            <span className="text-foreground/60">
              {" "}
              · {isEn ? "Reviewed by" : "Ditinjau oleh"} {article.reviewerName}
            </span>
          </div>
          <Link
            href={`/artikel/${article.alternateSlug}`}
            locale={alternateLocale}
            className="font-bold underline decoration-2 underline-offset-4"
          >
            {isEn ? "Baca dalam Bahasa Indonesia" : "Read in English"}
          </Link>
        </div>

        <ArticleBody content={article.content} sources={article.sources} isEn={isEn} />

        <div className="mt-10 border-t-2 border-dashed border-border pt-6">
          <ShareButtons path={sharePath} title={article.title} />
        </div>
      </article>

      {relatedProducts.length > 0 && (
        <section className="mt-16" aria-labelledby="related-products-heading">
          <h2 id="related-products-heading" className="font-heading text-2xl font-extrabold">
            {t("related")}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.05}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {relatedArticles.length > 0 && (
        <section className="mt-16" aria-labelledby="more-articles-heading">
          <h2 id="more-articles-heading" className="font-heading text-2xl font-extrabold">
            {t("moreArticles")}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link
                key={related.key}
                href={`/artikel/${related.slug}`}
                className="flex min-h-28 items-center rounded-base border-2 border-border bg-secondary-background p-4 font-heading text-sm font-bold leading-snug shadow-shadow-sm transition-all hover:-translate-y-0.5"
              >
                {related.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  )
}
