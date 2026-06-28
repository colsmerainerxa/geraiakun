import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AdminCredentialsView } from "@/components/admin/admin-credentials-view"

export const metadata: Metadata = { title: "Stok Akun | Admin beliakun" }

export default async function AdminStockPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AdminCredentialsView />
}
