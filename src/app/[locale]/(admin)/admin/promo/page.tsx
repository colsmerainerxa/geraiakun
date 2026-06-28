import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AdminPromosView } from "@/components/admin/admin-promos-view"

export const metadata: Metadata = { title: "Promo | Admin beliakun" }

export default async function AdminPromoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AdminPromosView />
}
