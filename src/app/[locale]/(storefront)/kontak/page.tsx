import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { ContactForm } from "@/components/storefront/contact-form"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "static" })
  return {
    title: t("contactTitle"),
    description: t("contactSubtitle"),
    alternates: {
      canonical: "/kontak",
      languages: { id: "/kontak", en: "/en/kontak" },
    },
  }
}

export default async function KontakPage({
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
          eyebrow={t("contactTitle")}
          title={t("contactTitle")}
          subtitle={t("contactSubtitle")}
        />
        <ContactForm />
      </div>
    </Container>
  )
}
