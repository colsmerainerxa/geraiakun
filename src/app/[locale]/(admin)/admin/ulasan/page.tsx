"use client"

import { AdminReviewsSkeleton, AdminReviewsView } from "@/components/admin/admin-reviews-view"
import { useMounted } from "@/hooks/use-mounted"

export default function AdminReviewsPage() {
  const mounted = useMounted()
  if (!mounted) return <AdminReviewsSkeleton />
  return <AdminReviewsView />
}
