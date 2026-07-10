import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdminSession } from "@/lib/server/auth-guards"

export const metadata: Metadata = {
  title: "Admin · geraiakun",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireAdminSession(locale)
  return <AdminShell>{children}</AdminShell>
}
