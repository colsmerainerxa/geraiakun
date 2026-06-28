import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { ResellerPortalView } from "@/components/storefront/reseller-portal-view"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "Portal Reseller",
    description: "Program reseller dan bulk order untuk agency, kelas, dan partner B2B.",
    alternates: seoAlternates(locale, "/reseller"),
  }
}

export default async function ResellerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ResellerPortalView />
}
