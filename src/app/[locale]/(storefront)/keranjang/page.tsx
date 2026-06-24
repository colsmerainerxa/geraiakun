import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { CartView } from "@/components/storefront/cart-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "cart" })
  return {
    title: t("title"),
    alternates: { canonical: "/keranjang" },
    robots: { index: false, follow: false },
  }
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CartView />
}
