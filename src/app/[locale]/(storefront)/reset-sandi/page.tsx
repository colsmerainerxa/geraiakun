import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { AuthRecoveryView } from "@/components/storefront/auth-recovery-view"

export const metadata: Metadata = {
  title: "Reset Kata Sandi",
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { locale } = await params
  const { status } = await searchParams
  setRequestLocale(locale)
  return (
    <Container className="flex min-h-[70vh] items-center py-12">
      <AuthRecoveryView mode="reset" expired={status === "expired"} />
    </Container>
  )
}
