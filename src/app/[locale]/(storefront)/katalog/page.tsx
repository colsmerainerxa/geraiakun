import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"
import { CatalogView } from "@/components/storefront/catalog-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "catalog" })
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/katalog", languages: { id: "/katalog", en: "/en/katalog" } },
  }
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Suspense>
      <CatalogView />
    </Suspense>
  )
}
