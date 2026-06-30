import type { Metadata } from "next"
import { AdminFulfillmentView } from "@/components/admin/admin-fulfillment-view"

export const metadata: Metadata = {
  title: "Fulfillment | Admin geraiakun",
  robots: { index: false, follow: false },
}

export default function AdminFulfillmentPage() {
  return <AdminFulfillmentView />
}
