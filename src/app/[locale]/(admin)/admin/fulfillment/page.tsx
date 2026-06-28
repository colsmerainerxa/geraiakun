import type { Metadata } from "next"
import { AdminFulfillmentView } from "@/components/admin/admin-fulfillment-view"

export const metadata: Metadata = {
  title: "Fulfillment | Admin beliakun",
  robots: { index: false, follow: false },
}

export default function AdminFulfillmentPage() {
  return <AdminFulfillmentView />
}
