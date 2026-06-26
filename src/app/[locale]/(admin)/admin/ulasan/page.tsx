"use client"

import { useMounted } from "@/hooks/use-mounted"
import {
  AdminReviewsSkeleton,
  AdminReviewsView,
} from "@/components/admin/admin-reviews-view"

export default function AdminReviewsPage() {
  const mounted = useMounted()
  if (!mounted) return <AdminReviewsSkeleton />
  return <AdminReviewsView />
}
