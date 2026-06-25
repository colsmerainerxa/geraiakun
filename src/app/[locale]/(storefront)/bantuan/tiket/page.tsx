import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { TicketForm } from "@/components/storefront/ticket-form"
import { TicketTracker } from "@/components/storefront/ticket-tracker"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "tickets" })
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: seoAlternates(locale, "/bantuan/tiket"),
    robots: { index: false, follow: true },
  }
}

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ inv?: string }>
}) {
  const { locale } = await params
  const { inv } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations("tickets")

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow={t("openNew")} title={t("title")} subtitle={t("subtitle")} />

        {/* TicketTracker menggunakan useSearchParams → perlu Suspense */}
        <div className="mt-8 flex flex-col gap-8">
          <Suspense fallback={null}>
            <TicketTracker />
          </Suspense>
          <TicketForm defaultType="garansi" defaultInvoice={inv} />
        </div>
      </div>
    </Container>
  )
}
