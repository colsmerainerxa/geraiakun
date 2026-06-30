import type { Metadata } from "next"
import { AdminAnalyticsView } from "@/components/admin/admin-analytics-view"

export const metadata: Metadata = {
  title: "Analytics | Admin geraiakun",
  robots: { index: false, follow: false },
}

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsView />
}
