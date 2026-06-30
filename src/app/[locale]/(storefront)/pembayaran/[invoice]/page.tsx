import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { PaymentStatusView } from "@/components/storefront/payment-status-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; invoice: string }>
}): Promise<Metadata> {
  const { invoice } = await params
  return {
    title: `Pembayaran ${invoice}`,
    description: "Pantau status pembayaran dan lanjutkan proses pesanan geraiakun.",
    robots: { index: false, follow: false },
  }
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ locale: string; invoice: string }>
}) {
  const { locale, invoice } = await params
  setRequestLocale(locale)
  return <PaymentStatusView invoice={invoice} />
}
