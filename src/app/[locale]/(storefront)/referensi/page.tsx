import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { ReferralView } from "@/components/storefront/referral-view"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "referral" })
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: seoAlternates(locale, "/referensi"),
    robots: { index: false, follow: true },
  }
}

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ReferralView />
}
