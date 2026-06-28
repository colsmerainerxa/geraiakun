import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AdminAuditView } from "@/components/admin/admin-audit-view"

export const metadata: Metadata = { title: "Audit Log | Admin beliakun" }

export default async function AdminAuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AdminAuditView />
}
