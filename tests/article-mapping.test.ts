import assert from "node:assert/strict"
import test from "node:test"
import { toLocalizedArticle } from "../src/lib/server/articles"

const baseArticle = {
  id: "article-example",
  key: "example",
  category: "guides",
  tags: ["ai", "guide"],
  relatedProductSlugs: ["api-key"],
  coverImage: "/images/articles/example.png",
  authorName: "Editor",
  reviewerName: "Reviewer",
  published: true,
  publishedAt: new Date("2026-07-15T00:00:00.000Z"),
  reviewedAt: new Date("2026-07-15T00:00:00.000Z"),
  createdAt: new Date("2026-07-15T00:00:00.000Z"),
  updatedAt: new Date("2026-07-15T01:00:00.000Z"),
  translations: [
    {
      id: "translation-id",
      articleId: "article-example",
      locale: "id" as const,
      slug: "contoh-artikel",
      title: "Contoh Artikel Indonesia",
      excerpt: "Ringkasan artikel Indonesia yang cukup panjang untuk fixture.",
      seoTitle: "Judul SEO Indonesia",
      seoDescription: "Deskripsi SEO Indonesia",
      searchPhrases: ["contoh artikel"],
      content: {
        intro:
          "Pengantar artikel yang menjelaskan isi utama dengan lengkap, mudah dipahami, dan cukup panjang untuk mewakili konten produksi yang tersimpan di database.",
        keyTakeaways: [
          "Satu takeaway yang sangat jelas",
          "Takeaway kedua yang juga jelas",
          "Takeaway ketiga yang cukup panjang",
        ],
        sections: [
          {
            id: "bagian",
            heading: "Bagian artikel",
            paragraphs: [
              "Paragraf fixture yang berisi penjelasan artikel untuk pengujian mapper locale dan memenuhi panjang validasi konten.",
            ],
          },
          {
            id: "bagian-dua",
            heading: "Bagian artikel kedua",
            paragraphs: [
              "Paragraf kedua menjelaskan bagian lain dari fixture agar struktur tersimpan tetap sama dengan artikel produksi.",
            ],
          },
          {
            id: "bagian-tiga",
            heading: "Bagian artikel ketiga",
            paragraphs: [
              "Paragraf ketiga memberi data valid tambahan untuk memastikan parser menerima artikel yang lengkap dan terstruktur.",
            ],
          },
          {
            id: "bagian-empat",
            heading: "Bagian artikel keempat",
            paragraphs: [
              "Paragraf keempat menutup fixture valid sebelum pengujian mengubah konten menjadi bentuk yang sengaja rusak.",
            ],
          },
        ],
        faq: [
          {
            question: "Apa tujuan fixture ini?",
            answer:
              "Fixture ini memastikan mapper menerima konten artikel Indonesia yang lengkap dan valid.",
          },
          {
            question: "Mengapa perlu dua FAQ?",
            answer:
              "Dua FAQ menjaga fixture konsisten dengan kontrak editorial artikel yang disimpan.",
          },
        ],
      },
      sources: [
        {
          title: "Sumber resmi",
          publisher: "Penerbit",
          url: "https://example.com/source",
          accessedAt: "2026-07-15",
        },
      ],
      createdAt: new Date("2026-07-15T00:00:00.000Z"),
      updatedAt: new Date("2026-07-15T01:00:00.000Z"),
    },
    {
      id: "translation-en",
      articleId: "article-example",
      locale: "en" as const,
      slug: "example-article",
      title: "English Example Article",
      excerpt: "A sufficiently useful English summary for this mapper fixture.",
      seoTitle: "English SEO Title",
      seoDescription: "English SEO description",
      searchPhrases: ["example article"],
      content: {
        intro:
          "An English introduction that clearly describes the primary subject of the example article and remains long enough to represent valid persisted production content.",
        keyTakeaways: [
          "One sufficiently clear takeaway",
          "A second sufficiently clear takeaway",
          "A third sufficiently clear takeaway",
        ],
        sections: [
          {
            id: "section",
            heading: "Article section",
            paragraphs: [
              "A fixture paragraph containing enough detail to exercise locale mapping behavior and satisfy validation.",
            ],
          },
          {
            id: "section-two",
            heading: "Second article section",
            paragraphs: [
              "A second paragraph supplies valid data so persisted content follows the same structure as production articles.",
            ],
          },
          {
            id: "section-three",
            heading: "Third article section",
            paragraphs: [
              "A third paragraph provides another valid section and keeps this English fixture complete for mapping.",
            ],
          },
          {
            id: "section-four",
            heading: "Fourth article section",
            paragraphs: [
              "A fourth paragraph completes the valid fixture before the malformed-content test changes its shape.",
            ],
          },
        ],
        faq: [
          {
            question: "What is this fixture for?",
            answer:
              "This fixture confirms that the mapper accepts complete and valid English article content.",
          },
          {
            question: "Why are two FAQs included?",
            answer:
              "Two FAQ entries keep the fixture aligned with the persisted editorial contract.",
          },
        ],
      },
      sources: [
        {
          title: "Official source",
          publisher: "Publisher",
          url: "https://example.com/source",
          accessedAt: "2026-07-15",
        },
      ],
      createdAt: new Date("2026-07-15T00:00:00.000Z"),
      updatedAt: new Date("2026-07-15T01:00:00.000Z"),
    },
  ],
}

test("maps the requested locale and paired alternate slug", () => {
  const article = toLocalizedArticle(baseArticle, "en")
  assert.equal(article.locale, "en")
  assert.equal(article.slug, "example-article")
  assert.equal(article.alternateSlug, "contoh-artikel")
  assert.equal(article.title, "English Example Article")
  assert.equal(article.seoTitle, "English SEO Title")
})

test("rejects malformed persisted content", () => {
  const malformed = structuredClone(baseArticle)
  malformed.translations[0].content = { intro: "Missing the remaining content fields" } as never
  assert.throws(() => toLocalizedArticle(malformed, "id"))
})
