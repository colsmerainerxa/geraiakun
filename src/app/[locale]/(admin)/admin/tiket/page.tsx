"use client"

import { useMounted } from "@/hooks/use-mounted"
import { AdminTicketsSkeleton, AdminTicketsView } from "@/components/admin/admin-tickets-view"

export default function AdminTicketsPage() {
  const mounted = useMounted()
  // Wait for the persisted zustand store to hydrate before rendering the view
  // to avoid a flash of empty data.
  if (!mounted) return <AdminTicketsSkeleton />
  return <AdminTicketsView />
}
