"use client"

import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"
import { useWishlist } from "@/stores/wishlist"

export function WishlistButton({
  slug,
  className,
}: {
  slug: string
  className?: string
}) {
  const t = useTranslations("wishlist")
  const mounted = useMounted()
  const wished = useWishlist((s) => s.slugs.includes(slug))
  const toggle = useWishlist((s) => s.toggle)
  // Gate on mount: persisted state hydrates client-side, so render the inactive
  // state on the server + first paint to avoid a hydration mismatch.
  const active = mounted && wished

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(slug)
      }}
      aria-pressed={active}
      aria-label={active ? t("remove") : t("add")}
      className={cn(
        "flex size-8 items-center justify-center rounded-full border-2 border-border bg-secondary-background shadow-shadow-sm transition-transform hover:scale-110",
        className,
      )}
    >
      <Heart
        className={cn("size-4", active && "fill-danger text-danger")}
      />
    </button>
  )
}
