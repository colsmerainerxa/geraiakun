import { cache } from "react"
import { legacyArticleRedirects } from "@/content/articles/redirects"
import { articleContentSchema, articleSourcesSchema } from "@/content/articles/schema"
import type { ArticleContent, ArticleLocale, ArticleSource } from "@/content/articles/types"

async function getPrisma() {
  return (await import("@/lib/server/prisma")).prisma
}

interface TranslationRecord {
  locale: ArticleLocale
  slug: string
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  searchPhrases: string[]
  content: unknown
  sources: unknown
}

export interface ArticleRecord {
  id: string
  key: string
  category: string
  tags: string[]
  relatedProductSlugs: string[]
  coverImage: string
  authorName: string
  reviewerName: string
  published: boolean
  publishedAt: Date
  reviewedAt: Date
  createdAt: Date
  updatedAt: Date
  translations: TranslationRecord[]
}

export interface LocalizedArticle {
  key: string
  slug: string
  alternateSlug: string
  locale: ArticleLocale
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  category: string
  tags: string[]
  relatedProductSlugs: string[]
  coverImage: string
  authorName: string
  reviewerName: string
  publishedAt: string
  reviewedAt: string
  updatedAt: string
  readMinutes: number
  searchPhrases: string[]
  sources: ArticleSource[]
  content: ArticleContent
}

export function toLocalizedArticle(
  article: ArticleRecord,
  locale: ArticleLocale,
): LocalizedArticle {
  const translation = article.translations.find((item) => item.locale === locale)
  const alternate = article.translations.find((item) => item.locale !== locale)
  if (!translation || !alternate) {
    throw new Error(`Article ${article.key} is missing a ${locale} translation pair`)
  }

  return {
    key: article.key,
    slug: translation.slug,
    alternateSlug: alternate.slug,
    locale,
    title: translation.title,
    excerpt: translation.excerpt,
    seoTitle: translation.seoTitle,
    seoDescription: translation.seoDescription,
    category: article.category,
    tags: article.tags,
    relatedProductSlugs: article.relatedProductSlugs,
    coverImage: article.coverImage,
    authorName: article.authorName,
    reviewerName: article.reviewerName,
    publishedAt: article.publishedAt.toISOString(),
    reviewedAt: article.reviewedAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    readMinutes: Math.max(
      1,
      Math.ceil(JSON.stringify(translation.content).split(/\s+/).filter(Boolean).length / 200),
    ),
    searchPhrases: translation.searchPhrases,
    sources: articleSourcesSchema.parse(translation.sources),
    content: articleContentSchema.parse(translation.content),
  }
}

export const listPublishedArticles = cache(async (locale: ArticleLocale) => {
  const prisma = await getPrisma()
  const articles = await prisma.article.findMany({
    where: { published: true, translations: { some: { locale } } },
    include: { translations: true },
    orderBy: { publishedAt: "desc" },
  })
  return articles.map((article) => toLocalizedArticle(article, locale))
})

export const getPublishedArticle = cache(async (locale: ArticleLocale, slug: string) => {
  const prisma = await getPrisma()
  const article = await prisma.article.findFirst({
    where: { published: true, translations: { some: { locale, slug } } },
    include: { translations: true },
  })
  return article ? toLocalizedArticle(article, locale) : null
})

export const getRelatedArticles = cache(
  async (locale: ArticleLocale, articleKey: string, limit = 3) => {
    const prisma = await getPrisma()
    const articles = await prisma.article.findMany({
      where: {
        published: true,
        key: { not: articleKey },
        translations: { some: { locale } },
      },
      include: { translations: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    })
    return articles.map((article) => toLocalizedArticle(article, locale))
  },
)

export const resolveLegacyArticle = cache(async (locale: ArticleLocale, oldSlug: string) => {
  const key = legacyArticleRedirects[oldSlug]
  if (!key) return null
  const prisma = await getPrisma()
  const article = await prisma.article.findUnique({
    where: { key },
    include: { translations: true },
  })
  if (!article?.published) return null
  return toLocalizedArticle(article, locale).slug
})
