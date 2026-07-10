import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { CheckoutView } from "@/components/storefront/checkout-view"
import { requireCustomerSession } from "@/lib/server/auth-guards"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "checkout" })
  return {
    title: t("title"),
    alternates: { canonical: "/checkout" },
    robots: { index: false, follow: false },
  }
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireCustomerSession(locale, "/checkout")
  return <CheckoutView />
}
