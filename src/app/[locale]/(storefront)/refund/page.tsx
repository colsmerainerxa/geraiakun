import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { RefundCenterView } from "@/components/storefront/refund-center-view"
import { seoAlternates } from "@/lib/seo/site"
import { requireCustomerSession } from "@/lib/server/auth-guards"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "Refund & Replacement Center",
    description: "Ajukan klaim refund, replacement akun, dan pantau SLA penyelesaian.",
    robots: { index: false, follow: false },
    alternates: seoAlternates(locale, "/refund"),
  }
}

export default async function RefundPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireCustomerSession(locale, "/refund")
  return <RefundCenterView />
}
