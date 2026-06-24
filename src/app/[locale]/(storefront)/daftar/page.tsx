import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { AuthForm } from "@/components/storefront/auth-form"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "auth" })
  return {
    title: t("registerTitle"),
    alternates: { canonical: "/daftar" },
    robots: { index: false, follow: false },
  }
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Container className="flex min-h-[70vh] items-center py-12">
      <AuthForm mode="register" />
    </Container>
  )
}
