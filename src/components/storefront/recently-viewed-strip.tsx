"use client"

import { useTranslations } from "next-intl"
import { Container } from "@/components/shared/container"
import { ProductCard } from "@/components/storefront/product-card"
import { useMounted } from "@/hooks/use-mounted"
import { products } from "@/lib/mock/products"
import { useRecentlyViewed } from "@/stores/recently-viewed"

export function RecentlyViewedStrip({ excludeSlug }: { excludeSlug?: string }) {
  const t = useTranslations("common")
  const mounted = useMounted()
  const slugs = useRecentlyViewed((s) => s.slugs)

  // Persisted store hydrates client-side; render nothing until mounted to avoid
  // a hydration mismatch (and the empty-state flash).
  if (!mounted) return null

  const items = slugs
    .filter((s) => s !== excludeSlug)
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4)

  if (items.length === 0) return null

  return (
    <Container className="py-12">
      <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">{t("recentlyViewed")}</h2>
      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Container>
  )
}
