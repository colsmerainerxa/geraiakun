import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"
import { TrackView } from "@/components/storefront/track-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "track" })
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: "/lacak",
      languages: { id: "/lacak", en: "/en/lacak" },
    },
  }
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Suspense>
      <TrackView />
    </Suspense>
  )
}
