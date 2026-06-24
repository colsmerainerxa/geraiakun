import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { FaqAccordion } from "@/components/storefront/faq-accordion"
import { helpFaqs, localizedFaqs } from "@/lib/faq"
import { faqPageJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"

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
    alternates: seoAlternates(locale, "/bantuan"),
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
      <JsonLd data={faqPageJsonLd(localizedFaqs(helpFaqs, locale === "en"))} />
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
