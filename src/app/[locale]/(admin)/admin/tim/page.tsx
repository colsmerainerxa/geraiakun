import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AdminTeamView } from "@/components/admin/admin-team-view"

export const metadata: Metadata = { title: "Tim & Role | Admin beliakun" }

export default async function AdminTeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AdminTeamView />
}
