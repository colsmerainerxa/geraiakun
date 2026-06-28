import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AdminProductsView } from "@/components/admin/admin-products-view"

export const metadata: Metadata = { title: "Produk | Admin beliakun" }

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AdminProductsView />
}
