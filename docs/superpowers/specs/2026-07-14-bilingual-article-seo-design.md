# Bilingual Article SEO Design

Date: 2026-07-14
Status: Approved

## Objective

Publish a curated set of ten high-quality geraiakun articles in Indonesian and
English. Each language version must contain real localized content and be
eligible for crawling, indexing, rich search presentation, and citation by
search and AI discovery systems.

Indexing and ranking cannot be guaranteed because they are controlled by each
search provider. The implementation will provide the technical, editorial, and
discovery signals under the site's control.

## Content Strategy

The ten articles form three topic clusters.

### Choosing AI services

1. A current guide to choosing an AI subscription.
2. Paid ChatGPT compared with the free tier.
3. ChatGPT compared with Gemini for common use cases.
4. A practical AI stack for students, including academic-integrity guidance.
5. Using AI for literature research and thesis work responsibly.

### AI APIs

6. API keys for beginners, including safe storage and access controls.
7. Token and cost estimation based on official, date-stamped sources.
8. A secure high-level architecture for an AI-powered WhatsApp bot.

### Digital subscription safety

9. Sharing compared with private access, including privacy and terms-of-service risks.
10. Safe payment, account access, logout troubleshooting, and escalation guidance.

Older articles that overlap will redirect to the closest new article. Content
claims about prices, models, product features, security, or provider policies
must be checked against primary sources when written. Time-sensitive facts must
include a reviewed or updated date and avoid claims that cannot be maintained.

Each article will use an answer-first introduction, descriptive heading
hierarchy, visible key takeaways, tables or steps where useful, visible FAQs,
references, related articles, and relevant product links. Copy must remain
helpful and specific without keyword stuffing or unsupported promotional claims.

## Data Model

`Article` stores language-independent publication data:

- stable ID and publication status;
- category and tags;
- cover image;
- author and reviewer attribution;
- publication, review, and modification dates.

`ArticleTranslation` stores one record per supported locale:

- locale and localized slug;
- title and excerpt;
- structured article body;
- SEO title and description;
- localized search phrases and source references.

The pair `(articleId, locale)` and `(locale, slug)` must be unique. Indonesian
and English records are both required before an article can be published.

Article content will be maintained in a source-controlled catalog and imported
with an idempotent upsert command. Runtime pages continue to read from Prisma so
the database remains the serving source of truth.

## URL And Localization

Language versions use separate localized URLs, for example:

- `/id/artikel/panduan-api-key`
- `/en/artikel/api-key-guide`

Every page canonicalizes to itself. Each version references the other with
reciprocal `hreflang` entries, with Indonesian as `x-default`. Language switching
must resolve the paired translation, not reuse the current slug blindly.

The visible article, page metadata, breadcrumb labels, structured data, related
article links, dates, and category labels must all use the selected locale.

## Search And AI Discovery

Each localized article provides:

- unique title and meta description;
- self-canonical URL and reciprocal language alternates;
- Open Graph article data and Twitter card data;
- a unique 1200x630 article image;
- `BlogPosting` JSON-LD with localized URL, `inLanguage`, headline, description,
  image, author, publisher, publication date, modification date, and keywords;
- localized `BreadcrumbList` JSON-LD;
- crawlable server-rendered article content.

The sitemap will contain both locale URLs and reciprocal language alternates.
Robots rules will keep public articles crawlable while excluding private and
transactional routes. `OAI-SearchBot` access will be explicit. An optional
IndexNow submission script will be enabled only when a valid environment key is
configured. `llms.txt` may be provided as a supplemental content map, but it will
not be treated as a ranking or indexing standard.

Old article slugs will use permanent redirects to preserve external links and
avoid dead URLs.

## Application Changes

The implementation will:

1. Add the translation-aware Prisma schema and migration.
2. Add typed article content and validation.
3. Add an idempotent article import command and run it against the configured database.
4. Replace unlocalized article queries and API responses with locale-aware data access.
5. Update listing and detail pages to render server-available localized content.
6. Correct metadata, JSON-LD, canonical URLs, hreflang, sitemap entries, and robots rules.
7. Add article-specific cover and Open Graph images.
8. Add permanent redirects for superseded article slugs.
9. Add optional IndexNow and supplemental AI discovery output.

An article administration CMS is outside this scope. Content remains editable
through the repository catalog and importer.

## Error Handling

- Publication validation fails when either locale is missing or malformed.
- Import errors abort the transaction so partial article sets are not published.
- Unknown locale/slug pairs return a real 404 and `noindex` behavior from Next.js.
- Missing optional images use a branded article fallback image.
- IndexNow failures are reported without rolling back successfully imported content.
- Database availability errors must not silently substitute stale mock content.

## Verification

Automated checks will cover:

- ten articles with complete Indonesian and English translations;
- unique localized slugs and valid internal references;
- content and metadata length constraints;
- reciprocal canonical and hreflang metadata;
- locale-correct `BlogPosting` and breadcrumb JSON-LD;
- both locale URLs in the sitemap;
- old-slug redirects;
- locale-correct listing and detail rendering;
- idempotent imports.

The final verification includes focused tests, Prisma validation and generation,
the repository quality checks, a production build, live API checks, and browser
inspection of representative Indonesian and English article pages. Structured
data will be checked against Google's Rich Results expectations where applicable.

## References

- Next.js 16.2.9 metadata, sitemap, robots, and Open Graph documentation.
- Google Search Central multilingual and localized-page guidance.
- Google Search Central Article and structured-data guidance.
- Bing Webmaster Guidelines and sitemap guidance.
- Brave Search crawler guidance.
- OpenAI publisher guidance for OAI-SearchBot.
- Semrush guidance for topic clusters and AI-search visibility.
