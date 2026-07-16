-- Preserve legacy Indonesian rows as unpublished drafts before removing the
-- single-language columns. The curated importer later creates complete ID/EN pairs.
CREATE TYPE "ArticleLocale" AS ENUM ('id', 'en');

ALTER TABLE "Article"
  ADD COLUMN "key" TEXT,
  ADD COLUMN "relatedProductSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "authorName" TEXT,
  ADD COLUMN "reviewerName" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE TABLE "ArticleTranslation" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "locale" "ArticleLocale" NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "seoTitle" TEXT NOT NULL,
  "seoDescription" TEXT NOT NULL,
  "searchPhrases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "content" JSONB NOT NULL,
  "sources" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ArticleTranslation" (
  "id", "articleId", "locale", "slug", "title", "excerpt", "seoTitle",
  "seoDescription", "content", "sources", "createdAt", "updatedAt"
)
SELECT
  "id" || '-id',
  "id",
  'id'::"ArticleLocale",
  "slug",
  "title",
  "excerpt",
  LEFT("title", 65),
  LEFT("excerpt", 170),
  jsonb_build_object(
    'intro', "excerpt",
    'keyTakeaways', '[]'::jsonb,
    'sections', jsonb_build_array(
      jsonb_build_object(
        'id', 'legacy-content',
        'heading', "title",
        'paragraphs', jsonb_build_array("body")
      )
    ),
    'faq', '[]'::jsonb
  ),
  '[]'::jsonb,
  "createdAt",
  "updatedAt"
FROM "Article";

UPDATE "Article"
SET
  "key" = 'legacy-' || "id",
  "authorName" = 'Tim Editorial geraiakun',
  "reviewerName" = 'Belum ditinjau',
  "reviewedAt" = "updatedAt",
  "published" = false;

DROP INDEX "Article_slug_key";

ALTER TABLE "Article"
  DROP COLUMN "slug",
  DROP COLUMN "title",
  DROP COLUMN "excerpt",
  DROP COLUMN "body",
  ALTER COLUMN "key" SET NOT NULL,
  ALTER COLUMN "authorName" SET NOT NULL,
  ALTER COLUMN "reviewerName" SET NOT NULL,
  ALTER COLUMN "reviewedAt" SET NOT NULL;

CREATE UNIQUE INDEX "Article_key_key" ON "Article"("key");
CREATE UNIQUE INDEX "ArticleTranslation_articleId_locale_key"
  ON "ArticleTranslation"("articleId", "locale");
CREATE UNIQUE INDEX "ArticleTranslation_locale_slug_key"
  ON "ArticleTranslation"("locale", "slug");
CREATE INDEX "ArticleTranslation_locale_slug_idx"
  ON "ArticleTranslation"("locale", "slug");

ALTER TABLE "ArticleTranslation"
  ADD CONSTRAINT "ArticleTranslation_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "Article"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
