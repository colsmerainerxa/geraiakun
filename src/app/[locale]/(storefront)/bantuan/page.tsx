import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { FaqAccordion } from "@/components/storefront/faq-accordion"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "static" })
  return {
    title: t("faqTitle"),
    description: t("faqSubtitle"),
    alternates: {
      canonical: "/bantuan",
      languages: { id: "/bantuan", en: "/en/bantuan" },
    },
  }
}

export default async function BantuanPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("static")

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title={t("faqTitle")}
          subtitle={t("faqSubtitle")}
        />
        <FaqAccordion />
      </div>
    </Container>
  )
}
