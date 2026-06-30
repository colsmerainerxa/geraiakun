import { getTranslations, setRequestLocale } from "next-intl/server"
import { ProductFinderQuiz } from "@/components/storefront/product-finder-quiz"
import type { Locale } from "@/i18n/routing"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "finder" })

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: seoAlternates(locale, "/rekomendasi"),
  }
}

export default async function RecommendationPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ProductFinderQuiz />
}
