import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { WishlistView } from "@/components/storefront/wishlist-view"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "wishlist" })
  return {
    title: t("pageTitle"),
    alternates: seoAlternates(locale, "/wishlist"),
    robots: { index: false, follow: true },
  }
}

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <WishlistView />
}
