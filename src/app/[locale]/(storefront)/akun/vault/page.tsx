import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AccountVaultView } from "@/components/storefront/account-vault-view"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "Account Vault & Beli Lagi",
    description: "Kelola akun digital, masa aktif, garansi, health check, dan pembelian ulang.",
    robots: { index: false, follow: false },
    alternates: seoAlternates(locale, "/akun/vault"),
  }
}

export default async function AccountVaultPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AccountVaultView />
}
