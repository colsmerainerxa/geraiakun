import assert from "node:assert/strict"
import test from "node:test"
import { articleSitemapEntries } from "../src/lib/seo/articles"
import { buildIndexNowPayload, buildLlmsText } from "../src/lib/seo/discovery"
import { articleJsonLd, faqPageJsonLd } from "../src/lib/seo/json-ld"
import { articleAlternates } from "../src/lib/seo/site"

test("article alternates use localized self-canonicals and reciprocal hreflang", () => {
  const alternates = articleAlternates("en", "panduan-api-key", "api-key-guide")
  assert.equal(alternates.canonical, "/en/artikel/api-key-guide")
  assert.deepEqual(alternates.languages, {
    id: "/id/artikel/panduan-api-key",
    en: "/en/artikel/api-key-guide",
    "x-default": "/id/artikel/panduan-api-key",
  })
})

test("BlogPosting JSON-LD is localized and complete", () => {
  const data = articleJsonLd({
    title: "Secure API Key Guide",
    description: "A useful description for the secure API key guide.",
    url: "https://geraiakun.id/en/artikel/api-key-guide",
    image: "https://geraiakun.id/images/articles/api-key-guide.png",
    locale: "en",
    publishedAt: "2026-07-15T00:00:00.000Z",
    modifiedAt: "2026-07-15T01:00:00.000Z",
    authorName: "Editorial Team",
    keywords: ["api key", "security"],
  }) as unknown as Record<string, unknown>

  assert.equal(data.url, "https://geraiakun.id/en/artikel/api-key-guide")
  assert.equal(data.mainEntityOfPage, "https://geraiakun.id/en/artikel/api-key-guide")
  assert.equal(data.inLanguage, "en-US")
  assert.deepEqual(data.image, ["https://geraiakun.id/images/articles/api-key-guide.png"])
  assert.equal(data.datePublished, "2026-07-15T00:00:00.000Z")
  assert.equal(data.dateModified, "2026-07-15T01:00:00.000Z")
  assert.deepEqual(data.keywords, ["api key", "security"])
})

test("FAQ JSON-LD mirrors visible article questions and answers", () => {
  const data = faqPageJsonLd([
    { q: "Can an API key be exposed in a browser?", a: "No. Keep it on the server." },
  ]) as Record<string, unknown>

  assert.equal(data["@type"], "FAQPage")
  assert.deepEqual(data.mainEntity, [
    {
      "@type": "Question",
      name: "Can an API key be exposed in a browser?",
      acceptedAnswer: { "@type": "Answer", text: "No. Keep it on the server." },
    },
  ])
})

test("ten bilingual articles produce twenty localized sitemap entries", () => {
  const pairs = Array.from({ length: 10 }, (_, index) => ({
    idSlug: `artikel-${index + 1}`,
    enSlug: `article-${index + 1}`,
    updatedAt: "2026-07-15",
  }))
  const entries = articleSitemapEntries(pairs)
  assert.equal(entries.length, 20)
  assert.equal(entries[0].url, "https://geraiakun.id/id/artikel/artikel-1")
  assert.equal(entries[1].url, "https://geraiakun.id/en/artikel/article-1")
  assert.deepEqual(entries[0].alternates?.languages, entries[1].alternates?.languages)
})

test("llms text lists both localized article collections", () => {
  const text = buildLlmsText([
    {
      locale: "id",
      title: "Panduan API Key",
      description: "Panduan keamanan API key.",
      url: "https://geraiakun.id/id/artikel/panduan-api-key",
    },
    {
      locale: "en",
      title: "API Key Guide",
      description: "A secure API key guide.",
      url: "https://geraiakun.id/en/artikel/api-key-guide",
    },
  ])
  assert.match(text, /# geraiakun/)
  assert.match(text, /## Bahasa Indonesia/)
  assert.match(text, /## English/)
  assert.match(text, /https:\/\/geraiakun\.id\/en\/artikel\/api-key-guide/)
})

test("IndexNow payload deduplicates localized URLs", () => {
  const payload = buildIndexNowPayload({
    key: "example-key",
    urls: [
      "https://geraiakun.id/id/artikel/panduan-api-key",
      "https://geraiakun.id/id/artikel/panduan-api-key",
      "https://geraiakun.id/en/artikel/api-key-guide",
    ],
  })
  assert.deepEqual(payload, {
    host: "geraiakun.id",
    key: "example-key",
    keyLocation: "https://geraiakun.id/indexnow-key.txt",
    urlList: [
      "https://geraiakun.id/id/artikel/panduan-api-key",
      "https://geraiakun.id/en/artikel/api-key-guide",
    ],
  })
})
