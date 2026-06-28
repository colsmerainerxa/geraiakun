import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AdminResellersView } from "@/components/admin/admin-resellers-view"

export const metadata: Metadata = { title: "Reseller | Admin beliakun" }

export default async function AdminResellerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AdminResellersView />
}
