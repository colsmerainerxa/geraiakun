import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AdminRiskView } from "@/components/admin/admin-risk-view"

export const metadata: Metadata = { title: "Risk Review | Admin geraiakun" }

export default async function AdminRiskPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AdminRiskView />
}
