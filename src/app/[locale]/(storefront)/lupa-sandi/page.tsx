import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { AuthRecoveryView } from "@/components/storefront/auth-recovery-view"

export const metadata: Metadata = {
  title: "Pulihkan Kata Sandi",
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Container className="flex min-h-[70vh] items-center py-12">
      <AuthRecoveryView mode="forgot" />
    </Container>
  )
}
