import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { AccountView } from "@/components/storefront/account-view"
import { requireCustomerSession } from "@/lib/server/auth-guards"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "account" })
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  }
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireCustomerSession(locale, "/akun")
  return (
    <Container className="py-10">
      <AccountView />
    </Container>
  )
}
