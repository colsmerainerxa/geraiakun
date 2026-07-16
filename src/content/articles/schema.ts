import { z } from "zod"
import type { ArticleDefinition } from "./types"

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const articleSourceSchema = z.object({
  title: z.string().min(4),
  publisher: z.string().min(2),
  url: z.url().refine((url) => url.startsWith("https://"), "Source URL must use HTTPS"),
  accessedAt: z.iso.date(),
})

const tableSchema = z
  .object({
    headers: z.array(z.string().min(1)).min(2).max(5),
    rows: z
      .array(z.array(z.string().min(1)).min(2).max(5))
      .min(1)
      .max(12),
  })
  .refine(
    (table) => table.rows.every((row) => row.length === table.headers.length),
    "Table rows must match the header count",
  )

const sectionSchema = z.object({
  id: slugSchema,
  heading: z.string().min(8),
  paragraphs: z.array(z.string().min(80)).min(1).max(4),
  bullets: z.array(z.string().min(20)).min(2).max(8).optional(),
  steps: z.array(z.string().min(20)).min(2).max(10).optional(),
  table: tableSchema.optional(),
})

const faqSchema = z.object({
  question: z.string().min(12),
  answer: z.string().min(60),
})

export const articleContentSchema = z.object({
  intro: z.string().min(120).max(600),
  keyTakeaways: z.array(z.string().min(20)).min(3).max(8),
  sections: z.array(sectionSchema).min(4).max(10),
  faq: z.array(faqSchema).min(2).max(6),
})

export const articleSourcesSchema = z.array(articleSourceSchema).min(1).max(12)

const translationSchema = articleContentSchema.extend({
  slug: slugSchema,
  title: z.string().min(20).max(90),
  excerpt: z.string().min(90).max(240),
  seoTitle: z.string().min(30).max(65),
  seoDescription: z.string().min(120).max(170),
  searchPhrases: z.array(z.string().min(3)).min(3).max(10),
})

export const articleDefinitionSchema = z.object({
  key: slugSchema,
  category: z.enum(["guides", "comparisons", "security", "developers"]),
  tags: z.array(slugSchema).min(2).max(12),
  relatedProductSlugs: z.array(slugSchema).max(6),
  authorName: z.string().min(2),
  reviewerName: z.string().min(2),
  publishedAt: z.iso.date(),
  reviewedAt: z.iso.date(),
  coverImage: z.string().startsWith("/images/articles/").endsWith(".png"),
  sources: articleSourcesSchema.min(2),
  translations: z.object({ id: translationSchema, en: translationSchema }),
})

export function validateArticleCatalog(input: unknown): ArticleDefinition[] {
  const catalog = z.array(articleDefinitionSchema).length(10).parse(input)
  const keys = catalog.map((item) => item.key)
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate article key")

  for (const locale of ["id", "en"] as const) {
    const slugs = catalog.map((item) => item.translations[locale].slug)
    if (new Set(slugs).size !== slugs.length) {
      throw new Error(`Duplicate ${locale} article slug`)
    }
  }

  return catalog
}
