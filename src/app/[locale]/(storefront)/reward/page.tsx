import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { LoyaltyView } from "@/components/storefront/loyalty-view"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "loyalty" })
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: seoAlternates(locale, "/reward"),
    robots: { index: false, follow: true },
  }
}

export default async function RewardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <LoyaltyView />
}
