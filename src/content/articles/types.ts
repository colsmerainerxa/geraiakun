import type { Locale } from "@/i18n/routing"

export type ArticleLocale = Locale

export interface ArticleSource {
  title: string
  publisher: string
  url: string
  accessedAt: string
}

export interface ArticleTable {
  headers: string[]
  rows: string[][]
}

export interface ArticleSection {
  id: string
  heading: string
  paragraphs: string[]
  bullets?: string[]
  steps?: string[]
  table?: ArticleTable
}

export interface ArticleFaq {
  question: string
  answer: string
}

export interface ArticleContent {
  intro: string
  keyTakeaways: string[]
  sections: ArticleSection[]
  faq: ArticleFaq[]
}

export interface ArticleTranslation extends ArticleContent {
  slug: string
  title: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  searchPhrases: string[]
}

export interface ArticleDefinition {
  key: string
  category: "guides" | "comparisons" | "security" | "developers"
  tags: string[]
  relatedProductSlugs: string[]
  authorName: string
  reviewerName: string
  publishedAt: string
  reviewedAt: string
  coverImage: string
  sources: ArticleSource[]
  translations: Record<ArticleLocale, ArticleTranslation>
}
