import { loadEnvConfig } from "@next/env"
import { articleCatalog } from "../src/content/articles/catalog"
import { validateArticleCatalog } from "../src/content/articles/schema"
import type { Prisma } from "../src/generated/prisma/client"

loadEnvConfig(process.cwd())

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

async function main() {
  const catalog = validateArticleCatalog(articleCatalog)
  const { prisma } = await import("../src/lib/server/prisma")

  await prisma.$transaction(async (tx) => {
    for (const definition of catalog) {
      const articleId = `article-${definition.key}`
      const article = await tx.article.upsert({
        where: { key: definition.key },
        update: {
          category: definition.category,
          tags: definition.tags,
          relatedProductSlugs: definition.relatedProductSlugs,
          coverImage: definition.coverImage,
          authorName: definition.authorName,
          reviewerName: definition.reviewerName,
          published: false,
          publishedAt: new Date(`${definition.publishedAt}T00:00:00.000Z`),
          reviewedAt: new Date(`${definition.reviewedAt}T00:00:00.000Z`),
        },
        create: {
          id: articleId,
          key: definition.key,
          category: definition.category,
          tags: definition.tags,
          relatedProductSlugs: definition.relatedProductSlugs,
          coverImage: definition.coverImage,
          authorName: definition.authorName,
          reviewerName: definition.reviewerName,
          published: false,
          publishedAt: new Date(`${definition.publishedAt}T00:00:00.000Z`),
          reviewedAt: new Date(`${definition.reviewedAt}T00:00:00.000Z`),
        },
      })

      for (const locale of ["id", "en"] as const) {
        const translation = definition.translations[locale]
        await tx.articleTranslation.upsert({
          where: { articleId_locale: { articleId: article.id, locale } },
          update: {
            slug: translation.slug,
            title: translation.title,
            excerpt: translation.excerpt,
            seoTitle: translation.seoTitle,
            seoDescription: translation.seoDescription,
            searchPhrases: translation.searchPhrases,
            content: toJson({
              intro: translation.intro,
              keyTakeaways: translation.keyTakeaways,
              sections: translation.sections,
              faq: translation.faq,
            }),
            sources: toJson(definition.sources),
          },
          create: {
            articleId: article.id,
            locale,
            slug: translation.slug,
            title: translation.title,
            excerpt: translation.excerpt,
            seoTitle: translation.seoTitle,
            seoDescription: translation.seoDescription,
            searchPhrases: translation.searchPhrases,
            content: toJson({
              intro: translation.intro,
              keyTakeaways: translation.keyTakeaways,
              sections: translation.sections,
              faq: translation.faq,
            }),
            sources: toJson(definition.sources),
          },
        })
      }

      await tx.article.update({ where: { id: article.id }, data: { published: true } })
    }
  })

  console.log(JSON.stringify({ imported: catalog.length, translations: catalog.length * 2 }))
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
