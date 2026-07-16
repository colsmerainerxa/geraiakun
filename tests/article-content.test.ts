import assert from "node:assert/strict"
import test from "node:test"
import { articleCatalog } from "../src/content/articles/catalog"
import { validateArticleCatalog } from "../src/content/articles/schema"

test("catalog contains ten publishable bilingual articles", () => {
  assert.equal(articleCatalog.length, 10)
  assert.doesNotThrow(() => validateArticleCatalog(articleCatalog))
  for (const article of articleCatalog) {
    assert.deepEqual(Object.keys(article.translations).sort(), ["en", "id"])
  }
})

test("localized slugs and titles are unique", () => {
  for (const locale of ["id", "en"] as const) {
    const slugs = articleCatalog.map((article) => article.translations[locale].slug)
    const titles = articleCatalog.map((article) => article.translations[locale].title)
    assert.equal(new Set(slugs).size, slugs.length)
    assert.equal(new Set(titles).size, titles.length)
  }
})

test("every article has useful visible structure and primary references", () => {
  for (const article of articleCatalog) {
    for (const locale of ["id", "en"] as const) {
      const translation = article.translations[locale]
      assert.ok(translation.intro.length >= 120)
      assert.ok(translation.keyTakeaways.length >= 3)
      assert.ok(translation.sections.length >= 4)
      assert.ok(translation.faq.length >= 2)
      assert.ok(translation.seoTitle.length >= 30 && translation.seoTitle.length <= 65)
      assert.ok(
        translation.seoDescription.length >= 120 && translation.seoDescription.length <= 170,
      )
    }
    assert.ok(article.sources.length >= 2)
    assert.ok(article.sources.every((source) => source.url.startsWith("https://")))
  }
})
