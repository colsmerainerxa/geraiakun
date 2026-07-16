# Bilingual Article SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish ten complete Indonesian/English articles from the database with locale-correct pages, metadata, structured data, discovery files, legacy redirects, and verified search-engine crawlability.

**Architecture:** Source-controlled article definitions contain both translations and are validated before an idempotent Prisma importer writes language-independent `Article` rows and localized `ArticleTranslation` rows. A focused server repository returns locale-specific view models to server-rendered listing/detail pages, while shared SEO helpers generate reciprocal canonical/hreflang metadata, JSON-LD, sitemap entries, redirects, and crawler output.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript 6, next-intl 4, Prisma 7/PostgreSQL, Zod 4, Node test runner through tsx, schema-dts, Next ImageResponse.

---

## File Map

### Content and validation

- Create `src/content/articles/types.ts`: article definition, translation, section, FAQ, and source types.
- Create `src/content/articles/schema.ts`: Zod validation and cross-locale invariants.
- Create `src/content/articles/catalog.ts`: imports and exports all ten definitions.
- Create `src/content/articles/<article-key>.ts`: one bilingual definition per article.
- Create `src/content/articles/redirects.ts`: legacy slug to stable article-key mapping.
- Create `public/images/articles/<article-key>.webp`: ten language-neutral editorial covers.
- Create `tests/article-content.test.ts`: content completeness, uniqueness, references, and editorial constraints.

### Persistence and queries

- Modify `prisma/schema.prisma`: split language-independent article fields from translations.
- Create `prisma/migrations/20260714160000_bilingual_articles/migration.sql`: preserve old Indonesian rows, create translations, and remove legacy text columns.
- Create `prisma/import-articles.ts`: validated transactional upsert.
- Modify `package.json`: add article test and import scripts.
- Create `src/lib/server/articles.ts`: cached locale-aware database repository and redirect resolution.
- Modify `src/app/api/articles/route.ts`: explicit locale-aware API response.
- Modify `src/lib/api/queries.ts`: pass locale to article API consumers.
- Create `tests/article-mapping.test.ts`: pure mapping and locale behavior.

### Pages and presentation

- Modify `src/app/[locale]/(storefront)/artikel/page.tsx`: server-load localized listing.
- Modify `src/components/storefront/article-list.tsx`: render supplied localized data and retain client category filtering.
- Modify `src/app/[locale]/(storefront)/artikel/[slug]/page.tsx`: localized detail, visible sections, takeaways, FAQs, references, and redirects.
- Create `src/components/storefront/article-body.tsx`: render typed article content blocks.
- Modify `src/components/storefront/product-detail.tsx`: request related articles for the active locale.
- Create `tests/article-rendering.test.tsx`: locale-specific article body rendering.

### SEO and discovery

- Modify `src/lib/seo/site.ts`: article-specific reciprocal alternates.
- Modify `src/lib/seo/json-ld.tsx`: complete localized BlogPosting data.
- Modify `src/app/sitemap.ts`: one entry per locale URL with reciprocal alternates.
- Modify `src/app/robots.ts`: explicit public crawler rules including OAI-SearchBot.
- Create `src/app/llms.txt/route.ts`: supplemental article map.
- Create `src/app/indexnow-key.txt/route.ts`: optional key proof endpoint.
- Create `scripts/submit-indexnow.ts`: optional IndexNow submission command.
- Create `src/lib/seo/discovery.ts`: pure llms.txt and IndexNow payload builders.
- Create `src/app/[locale]/(storefront)/artikel/[slug]/opengraph-image.tsx`: localized article social image.
- Create `tests/article-seo.test.ts`: alternates, JSON-LD, sitemap mapping, redirects, and discovery output.

## Task 1: Establish The Bilingual Content Contract

**Files:**
- Create: `src/content/articles/types.ts`
- Create: `src/content/articles/schema.ts`
- Create: `tests/article-content.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the article test command**

Add this script to `package.json`:

```json
"test:articles": "tsx --test tests/article-content.test.ts tests/article-mapping.test.ts tests/article-rendering.test.tsx tests/article-seo.test.ts"
```

- [ ] **Step 2: Write the failing contract tests**

Create `tests/article-content.test.ts` with Node's test runner and assertions for:

```ts
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
        translation.seoDescription.length >= 120 &&
          translation.seoDescription.length <= 170,
      )
    }
    assert.ok(article.sources.length >= 2)
    assert.ok(article.sources.every((source) => source.url.startsWith("https://")))
  }
})
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```powershell
rtk pnpm exec tsx --test tests/article-content.test.ts
```

Expected: FAIL because `catalog`, `schema`, and `types` do not exist.

- [ ] **Step 4: Add the content types**

Create `src/content/articles/types.ts`:

```ts
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
```

- [ ] **Step 5: Add Zod validation and cross-record checks**

Create `src/content/articles/schema.ts` with schemas that match the types, use
`z.iso.date()` for dates, require lowercase hyphenated slugs with
`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, require 3-8 takeaways, 4-10 sections, 2-6 FAQs,
2-12 sources, and export:

```ts
export function validateArticleCatalog(input: unknown): ArticleDefinition[] {
  const catalog = z.array(articleDefinitionSchema).length(10).parse(input)
  for (const locale of ["id", "en"] as const) {
    const slugs = catalog.map((item) => item.translations[locale].slug)
    if (new Set(slugs).size !== slugs.length) {
      throw new Error(`Duplicate ${locale} article slug`)
    }
  }
  return catalog
}
```

- [ ] **Step 6: Re-run the test and confirm the remaining RED failure**

Run the same test command.

Expected: FAIL only because `articleCatalog` and the ten content modules do not exist.

- [ ] **Step 7: Commit the contract**

```powershell
rtk git add package.json src/content/articles/types.ts src/content/articles/schema.ts tests/article-content.test.ts
rtk git commit -m "test: define bilingual article contract"
```

## Task 2: Write And Validate The Ten Curated Articles

**Files:**
- Create: `src/content/articles/catalog.ts`
- Create: `src/content/articles/ai-subscription-guide.ts`
- Create: `src/content/articles/chatgpt-paid-vs-free.ts`
- Create: `src/content/articles/chatgpt-vs-gemini.ts`
- Create: `src/content/articles/ai-stack-for-students.ts`
- Create: `src/content/articles/ai-for-thesis-research.ts`
- Create: `src/content/articles/api-key-beginners.ts`
- Create: `src/content/articles/token-cost-estimation.ts`
- Create: `src/content/articles/whatsapp-ai-bot.ts`
- Create: `src/content/articles/shared-vs-private.ts`
- Create: `src/content/articles/safe-digital-subscriptions.ts`
- Create: `src/content/articles/redirects.ts`
- Create: `public/images/articles/*.webp`
- Test: `tests/article-content.test.ts`

- [ ] **Step 1: Verify every time-sensitive claim against primary sources**

Use official provider documentation for current ChatGPT, Gemini, API pricing,
WhatsApp Cloud API, QRIS, and crawler statements. Record the exact source title,
publisher, URL, and access date `2026-07-14` in the applicable article definition.
Do not state a price, model name, usage limit, or policy unless its source is in
that article's `sources` array.

- [ ] **Step 2: Create the exact article catalog**

Use these stable keys, localized slugs, and intents:

| Key | Indonesian slug | English slug | Primary intent |
| --- | --- | --- | --- |
| `ai-subscription-guide` | `panduan-memilih-langganan-ai` | `how-to-choose-an-ai-subscription` | Choose an AI subscription by use case, budget, privacy, and workflow |
| `chatgpt-paid-vs-free` | `chatgpt-berbayar-vs-gratis` | `chatgpt-paid-vs-free` | Decide whether a paid plan is necessary |
| `chatgpt-vs-gemini` | `chatgpt-vs-gemini` | `chatgpt-vs-gemini` | Compare strengths without declaring a universal winner |
| `ai-stack-for-students` | `stack-ai-untuk-mahasiswa` | `ai-stack-for-students` | Build a responsible student workflow |
| `ai-for-thesis-research` | `ai-untuk-riset-dan-skripsi` | `ai-for-research-and-thesis-work` | Research faster while preserving verification and academic integrity |
| `api-key-beginners` | `panduan-api-key-untuk-pemula` | `api-key-guide-for-beginners` | Understand keys, authentication, storage, quotas, and first request |
| `token-cost-estimation` | `cara-menghitung-token-dan-biaya-api` | `how-to-estimate-api-tokens-and-cost` | Estimate variable costs without hard-coding stale prices |
| `whatsapp-ai-bot` | `arsitektur-bot-whatsapp-dengan-ai` | `whatsapp-ai-bot-architecture` | Explain a secure server-side architecture and operational controls |
| `shared-vs-private` | `akun-sharing-vs-private` | `shared-vs-private-accounts` | Explain privacy, reliability, policy, and ownership risks clearly |
| `safe-digital-subscriptions` | `panduan-aman-langganan-digital` | `safe-digital-subscription-guide` | Combine payment, QRIS, access, logout, warranty, and escalation guidance |

Each file must export one `ArticleDefinition` with both translations. Indonesian
copy uses natural Indonesian; English copy is independently edited English, not
literal sentence-by-sentence translation. Every section ID remains stable and
language-neutral so analytics and rendering can identify the same concept.

- [ ] **Step 3: Apply the editorial structure to every translation**

Each translation contains:

1. A direct 120-300 character answer-first introduction.
2. Three to six specific key takeaways.
3. Four to eight H2 sections, each with one to four paragraphs and optional bullets, steps, or a comparison table.
4. Two to five visible FAQs that answer actual follow-up questions.
5. A non-promotional conclusion with the next useful action.

Security-sensitive articles must explicitly say not to share API keys, passwords,
recovery codes, or sensitive personal content. Student articles must require fact
verification, citation of original sources, and compliance with institutional rules.

- [ ] **Step 4: Generate ten language-neutral article covers**

Use the image generation skill to create one 1600x900 WebP editorial cover for
each stable article key. The covers must depict the topic clearly, avoid provider
logos and embedded text, use the existing geraiakun yellow/pink/cyan accents, and
remain legible when center-cropped to 16:9. Save them as
`public/images/articles/<article-key>.webp` and set each definition's `coverImage`
to the corresponding absolute public path.

- [ ] **Step 5: Add the catalog export**

Create `src/content/articles/catalog.ts`:

```ts
import { aiForThesisResearch } from "./ai-for-thesis-research"
import { aiStackForStudents } from "./ai-stack-for-students"
import { aiSubscriptionGuide } from "./ai-subscription-guide"
import { apiKeyBeginners } from "./api-key-beginners"
import { chatgptPaidVsFree } from "./chatgpt-paid-vs-free"
import { chatgptVsGemini } from "./chatgpt-vs-gemini"
import { safeDigitalSubscriptions } from "./safe-digital-subscriptions"
import { sharedVsPrivate } from "./shared-vs-private"
import { tokenCostEstimation } from "./token-cost-estimation"
import { whatsappAiBot } from "./whatsapp-ai-bot"
import { validateArticleCatalog } from "./schema"

export const articleCatalog = validateArticleCatalog([
  aiSubscriptionGuide,
  chatgptPaidVsFree,
  chatgptVsGemini,
  aiStackForStudents,
  aiForThesisResearch,
  apiKeyBeginners,
  tokenCostEstimation,
  whatsappAiBot,
  sharedVsPrivate,
  safeDigitalSubscriptions,
])
```

- [ ] **Step 6: Add complete legacy redirects**

Create `src/content/articles/redirects.ts` mapping all 13 former mock slugs and
the four former database slugs to one of the ten keys. Include these exact old
slugs: `stack-ai-hemat-mahasiswa-2026`, `chatgpt-plus-vs-gratis-2026`,
`sharing-vs-private-chatgpt-plus`, `panduan-api-key-pemula`,
`aktifkan-gemini-pro-invite-vs-login`, `chatgpt-plus-logout-sendiri-solusi`,
`chatgpt-plus-atau-gemini-pro-2026`, `estimasi-token-api-key`,
`cara-bayar-qris-akun-premium`, `apa-itu-akun-private`,
`gemini-pro-untuk-skripsi`, `bikin-bot-whatsapp-api-key`,
`tips-aman-akun-sharing`, `tips-maksimalkan-chatgpt-plus-untuk-mahasiswa`,
`perbandingan-chatgpt-plus-vs-gemini-pro-2025`,
`cara-aman-berlangganan-akun-ai-sharing`, and
`manfaat-api-key-ai-untuk-developer-pemula`.

- [ ] **Step 7: Run content tests and verify GREEN**

```powershell
rtk pnpm exec tsx --test tests/article-content.test.ts
```

Expected: 3 tests pass, 0 fail.

- [ ] **Step 8: Commit the curated content**

```powershell
rtk git add src/content/articles tests/article-content.test.ts
rtk git commit -m "feat: add curated bilingual article catalog"
```

## Task 3: Add Translation-Aware Persistence And Import

**Files:**
- Modify: `prisma/schema.prisma:573`
- Create: `prisma/migrations/20260714160000_bilingual_articles/migration.sql`
- Create: `prisma/import-articles.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the Prisma models**

Replace the legacy Article text fields with:

```prisma
enum ArticleLocale {
  id
  en
}

model Article {
  id                  String               @id
  key                 String               @unique
  category            String
  tags                String[]             @default([])
  relatedProductSlugs String[]             @default([])
  coverImage          String               @default("")
  authorName          String
  reviewerName        String
  published           Boolean              @default(false)
  publishedAt         DateTime
  reviewedAt          DateTime
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  translations        ArticleTranslation[]

  @@index([published, publishedAt])
}

model ArticleTranslation {
  id             String        @id @default(cuid())
  articleId      String
  locale         ArticleLocale
  slug           String
  title          String
  excerpt        String
  seoTitle       String
  seoDescription String
  searchPhrases  String[]      @default([])
  content        Json
  sources        Json
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  article        Article       @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([articleId, locale])
  @@unique([locale, slug])
  @@index([locale, slug])
}
```

- [ ] **Step 2: Generate and inspect the SQL migration**

Run Prisma's create-only migration command:

```powershell
rtk pnpm exec prisma migrate dev --create-only --name bilingual_articles
```

Expected: a new migration directory is created and the configured database is
not changed. Rename the generated directory to
`20260714160000_bilingual_articles` before editing its SQL. Then ensure the SQL:

1. Creates the enum and `ArticleTranslation` table.
2. Adds the new Article columns as nullable during data transfer.
3. Copies each legacy row into an Indonesian translation using its existing slug/title/excerpt/body.
4. Sets legacy rows to unpublished because English is absent.
5. Makes required columns non-null.
6. Drops legacy `slug`, `title`, `excerpt`, and `body` columns and indexes.
7. Creates both uniqueness constraints and the locale/slug index.

Run:

```powershell
rtk pnpm exec prisma validate
```

Expected: Prisma schema is valid.

- [ ] **Step 3: Add the idempotent transactional importer**

Create `prisma/import-articles.ts`. It must call `loadEnvConfig(process.cwd())`,
validate `articleCatalog`, and for each definition upsert `Article` by `key` and
upsert both translations by `articleId_locale`. Use the stable ID
`article-${definition.key}`. Set `published: true` only after both translation
upserts succeed inside one `prisma.$transaction`.

The persisted `content` JSON is:

```ts
{
  intro: translation.intro,
  keyTakeaways: translation.keyTakeaways,
  sections: translation.sections,
  faq: translation.faq,
}
```

Print this deterministic summary:

```ts
console.log(JSON.stringify({ imported: articleCatalog.length, translations: 20 }))
```

- [ ] **Step 4: Add the import script**

Add to `package.json`:

```json
"db:import-articles": "tsx prisma/import-articles.ts"
```

- [ ] **Step 5: Apply migration and verify idempotency**

```powershell
rtk pnpm exec prisma migrate deploy
rtk pnpm run db:import-articles
rtk pnpm run db:import-articles
```

Expected: both imports report `{"imported":10,"translations":20}` and database
counts remain 10 articles and 20 translations.

- [ ] **Step 6: Commit persistence changes**

```powershell
rtk git add prisma/schema.prisma prisma/migrations/20260714160000_bilingual_articles/migration.sql prisma/import-articles.ts package.json
rtk git commit -m "feat: persist bilingual article translations"
```

## Task 4: Build The Locale-Aware Article Repository And API

**Files:**
- Create: `src/lib/server/articles.ts`
- Modify: `src/app/api/articles/route.ts`
- Modify: `src/lib/api/queries.ts`
- Create: `tests/article-mapping.test.ts`

- [ ] **Step 1: Write failing locale mapping tests**

Test the exported pure `toLocalizedArticle` mapper with one article and two
translations. Assert that `locale: "en"` returns the English slug, title, SEO
fields, and paired Indonesian URL data while `locale: "id"` returns Indonesian.
Also assert that malformed content JSON throws rather than silently returning an
empty body.

- [ ] **Step 2: Run mapping tests and verify RED**

```powershell
rtk pnpm exec tsx --test tests/article-mapping.test.ts
```

Expected: FAIL because `src/lib/server/articles.ts` does not exist.

- [ ] **Step 3: Implement the repository**

Create `src/lib/server/articles.ts` with:

```ts
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
  searchPhrases: string[]
  sources: ArticleSource[]
  content: ArticleContent
}
```

Export `listPublishedArticles(locale)`, `getPublishedArticle(locale, slug)`,
`getRelatedArticles(locale, articleKey, limit)`, and
`resolveLegacyArticle(locale, oldSlug)`. Wrap database reads with React `cache`.
Always query the requested translation and the paired alternate translation in
one Prisma query. Never fall back from English to Indonesian.

- [ ] **Step 4: Make the API locale explicit**

Update `/api/articles` to accept `locale=id|en`, default to `id`, return `400`
for any other locale, and return localized list/detail DTOs. Detail lookup must
use `(locale, slug)` and `published: true` through the parent relation.

- [ ] **Step 5: Update client queries**

Change the hooks to:

```ts
export function useArticles(locale: "id" | "en", category?: string, limit?: number)
export function useArticle(locale: "id" | "en", slug: string)
```

Include locale in both query keys and URL parameters. Update product detail to
pass `useLocale()` after narrowing it to `id` or `en`.

- [ ] **Step 6: Run mapping tests and verify GREEN**

```powershell
rtk pnpm exec tsx --test tests/article-mapping.test.ts
```

Expected: all mapping tests pass.

- [ ] **Step 7: Commit repository and API changes**

```powershell
rtk git add src/lib/server/articles.ts src/app/api/articles/route.ts src/lib/api/queries.ts src/components/storefront/product-detail.tsx tests/article-mapping.test.ts
rtk git commit -m "feat: serve locale-aware articles"
```

## Task 5: Render Crawlable Localized Listing And Detail Pages

**Files:**
- Modify: `src/app/[locale]/(storefront)/artikel/page.tsx`
- Modify: `src/components/storefront/article-list.tsx`
- Modify: `src/app/[locale]/(storefront)/artikel/[slug]/page.tsx`
- Create: `src/components/storefront/article-body.tsx`
- Create: `tests/article-rendering.test.tsx`

- [ ] **Step 1: Add a rendering test for typed content**

Render `ArticleBody` with a fixture containing takeaways, paragraphs, bullets,
steps, a two-column table, FAQs, and references. Assert each visible string is
present and the output contains H2 headings and H3 FAQ questions.

- [ ] **Step 2: Run rendering test and verify RED**

```powershell
rtk pnpm exec tsx --test tests/article-rendering.test.tsx
```

Expected: FAIL because `ArticleBody` does not exist.

- [ ] **Step 3: Implement `ArticleBody`**

Render semantic HTML only: `<aside>` for key takeaways, `<section>` and `<h2>`
for sections, `<ol>` for steps, `<ul>` for bullets, `<table>` with `<thead>` and
`<tbody>` for comparisons, a FAQ section with `<h3>` questions, and an ordered
reference list of external links using `rel="noopener noreferrer"`.

- [ ] **Step 4: Server-render the article listing**

In the listing page, call `listPublishedArticles(locale)` and pass the result to
`<ArticleList articles={articles} />`. Remove React Query from ArticleList so
article titles and links are present in the initial HTML. Keep category filtering
as client state over supplied data. Use `article.coverImage` with stable aspect
ratio and descriptive alt text.

- [ ] **Step 5: Rebuild the detail page around `LocalizedArticle`**

Fetch `getPublishedArticle(locale, slug)`. When absent, call
`resolveLegacyArticle(locale, slug)` and `permanentRedirect` to the localized
replacement URL; otherwise call `notFound()`. Render author, reviewer, published
and reviewed dates, the localized body, related products, and related articles.
All language-switch and related links use the paired localized slug.

- [ ] **Step 6: Run rendering tests and verify GREEN**

```powershell
rtk pnpm exec tsx --test tests/article-rendering.test.tsx
```

Expected: all article rendering tests pass.

- [ ] **Step 7: Commit the localized pages**

```powershell
rtk git add 'src/app/[locale]/(storefront)/artikel' src/components/storefront/article-list.tsx src/components/storefront/article-body.tsx tests/article-rendering.test.tsx
rtk git commit -m "feat: render bilingual article pages"
```

## Task 6: Complete Metadata, JSON-LD, Sitemap, Robots, And Social Images

**Files:**
- Modify: `src/lib/seo/site.ts`
- Modify: `src/lib/seo/json-ld.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`
- Create: `src/app/[locale]/(storefront)/artikel/[slug]/opengraph-image.tsx`
- Create: `tests/article-seo.test.ts`

- [ ] **Step 1: Write failing SEO helper tests**

Assert that an English article produces an English self-canonical, Indonesian
and English reciprocal alternates, and Indonesian `x-default`. Assert that
`articleJsonLd` contains localized `url`, `mainEntityOfPage`, `inLanguage`, image,
headline, author, publisher, datePublished, dateModified, and keywords. Assert
the localized sitemap helper emits 20 article entries.

- [ ] **Step 2: Run SEO tests and verify RED**

```powershell
rtk pnpm exec tsx --test tests/article-seo.test.ts
```

Expected: FAIL because current article SEO helpers always construct Indonesian URLs.

- [ ] **Step 3: Implement article alternates**

Add:

```ts
export function articleAlternates(locale: ArticleLocale, idSlug: string, enSlug: string) {
  const idPath = `/id/artikel/${idSlug}`
  const enPath = `/en/artikel/${enSlug}`
  return {
    canonical: locale === "id" ? idPath : enPath,
    languages: { id: idPath, en: enPath, "x-default": idPath },
  }
}
```

Use it in article metadata. Add Open Graph URL, locale, alternateLocale, image,
publishedTime, modifiedTime, authors, and tags. Add equivalent Twitter title,
description, and image.

- [ ] **Step 4: Make BlogPosting locale-aware**

Change `articleJsonLd` to accept the complete localized article URL and image
URL. Set `dateModified` from `updatedAt`, `inLanguage` to `id-ID` or `en-US`, and
use the localized URL for both `url` and `mainEntityOfPage`.

- [ ] **Step 5: Emit both localized sitemap entries**

For each published article, load both translations and emit one ID entry and one
EN entry. Both entries use the same reciprocal `alternates.languages` map and
their own canonical `url`. Use `updatedAt` as `lastModified`.

- [ ] **Step 6: Add explicit crawler rules**

Return separate robots groups for `*` and `OAI-SearchBot`, both allowing `/` and
disallowing `/admin`, `/checkout`, `/keranjang`, `/akun`, `/masuk`, `/daftar`, and
`/api`. Keep the sitemap and host entries.

- [ ] **Step 7: Add localized dynamic Open Graph images**

Implement a 1200x630 `ImageResponse` using the localized title, category,
`geraiakun` brand, and a high-contrast stable layout. Use only supported flexbox
styles. Return `notFound()` for unknown or unpublished locale/slug pairs.

- [ ] **Step 8: Run SEO tests and verify GREEN**

```powershell
rtk pnpm exec tsx --test tests/article-seo.test.ts
```

Expected: all SEO tests pass.

- [ ] **Step 9: Commit SEO changes**

```powershell
rtk git add src/lib/seo src/app/sitemap.ts src/app/robots.ts 'src/app/[locale]/(storefront)/artikel/[slug]/opengraph-image.tsx' tests/article-seo.test.ts
rtk git commit -m "feat: add bilingual article SEO metadata"
```

## Task 7: Add Supplemental AI Discovery And Optional IndexNow

**Files:**
- Create: `src/app/llms.txt/route.ts`
- Create: `src/app/indexnow-key.txt/route.ts`
- Create: `scripts/submit-indexnow.ts`
- Create: `src/lib/seo/discovery.ts`
- Modify: `.env.example`
- Modify: `package.json`
- Test: `tests/article-seo.test.ts`

- [ ] **Step 1: Add failing discovery tests**

In `src/lib/seo/discovery.ts`, test a pure `buildLlmsText` helper for site name, article index, both localized
URLs, titles, and descriptions. Test `buildIndexNowPayload` for `host`, `key`,
`keyLocation`, and a deduplicated list of 20 localized URLs.

- [ ] **Step 2: Run the SEO test and verify RED**

Expected: FAIL because discovery helpers do not exist.

- [ ] **Step 3: Implement `/llms.txt` as a supplemental map**

Return UTF-8 `text/plain` with a short site description, sitemap URL, and one
section per locale listing the ten canonical article URLs and descriptions. Add
`Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.

- [ ] **Step 4: Implement optional IndexNow support**

Add `INDEXNOW_KEY` to `.env.example`. The proof route returns the key only when
configured and otherwise returns 404. The submission script exits with a clear
message when absent; when present, it POSTs the 20 localized URLs to
`https://api.indexnow.org/indexnow` and fails on non-2xx responses.

Add:

```json
"seo:submit-indexnow": "tsx scripts/submit-indexnow.ts"
```

- [ ] **Step 5: Run discovery tests and verify GREEN**

```powershell
rtk pnpm exec tsx --test tests/article-seo.test.ts
```

Expected: all discovery and SEO tests pass.

- [ ] **Step 6: Commit discovery support**

```powershell
rtk git add src/app/llms.txt src/app/indexnow-key.txt scripts/submit-indexnow.ts .env.example package.json tests/article-seo.test.ts
rtk git commit -m "feat: add article discovery endpoints"
```

## Task 8: Import, Verify, And Inspect The Complete Experience

**Files:**
- Verify all files from Tasks 1-7

- [ ] **Step 1: Run the focused automated suite**

```powershell
rtk pnpm run test:articles
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Validate and regenerate Prisma**

```powershell
rtk pnpm exec prisma validate
rtk pnpm exec prisma generate
```

Expected: both commands exit 0.

- [ ] **Step 3: Run repository quality checks**

Run the configured Biome checks, followed by type checking and the build:

```powershell
rtk pnpm exec biome check src tests prisma scripts
rtk pnpm exec tsc --noEmit
rtk pnpm run build
```

Expected: Biome, type checking, and production build exit 0.

- [ ] **Step 4: Re-import and check live counts**

```powershell
rtk pnpm run db:import-articles
```

Query Prisma read-only and verify exactly 10 published Article rows and 20
ArticleTranslation rows.

- [ ] **Step 5: Start or reuse the development server**

```powershell
rtk pnpm run dev
```

Use another port only if 3000 is occupied by an unrelated process.

- [ ] **Step 6: Inspect representative pages in a real browser**

Use Playwright to verify desktop and mobile for:

- `/id/artikel`
- `/en/artikel`
- `/id/artikel/panduan-api-key-untuk-pemula`
- `/en/artikel/api-key-guide-for-beginners`

Confirm visible translated content, stable layouts, no overlaps, working locale
switching, article images, related links, and no browser console errors. Capture
screenshots for both detail locales.

- [ ] **Step 7: Inspect discovery responses**

Verify `200` responses and correct content for `/robots.txt`, `/sitemap.xml`,
`/llms.txt`, both representative page sources, and both Open Graph image URLs.
Verify a legacy slug returns a permanent redirect to the correct localized URL.

- [ ] **Step 8: Validate structured data**

Extract the page JSON-LD, parse it as JSON, and confirm all URLs match the active
locale. Use Google's Rich Results Test on the deployed URL when a public deployment
is available; local validation must not claim external eligibility.

- [ ] **Step 9: Review the final diff**

```powershell
rtk git status --short
rtk git diff --check
rtk git diff --stat
```

Confirm only article, SEO, migration, test, asset, and documentation files from
this plan are included. Preserve unrelated worktree changes.

- [ ] **Step 10: Close verification without broad staging**

Do not create a catch-all commit. If verification required a code adjustment,
return to the task that owns that file, repeat its RED/GREEN check, and use that
task's explicit staging command. When verification made no code changes, leave
the task commits from Steps 1-7 as the complete implementation history.
