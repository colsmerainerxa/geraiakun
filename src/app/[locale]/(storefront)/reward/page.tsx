import { redirect } from "next/navigation"

export default async function RewardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale === "en" ? "en" : "id"}/akun`)
}
