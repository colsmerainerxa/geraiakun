"use client"

import { Star } from "lucide-react"
import { motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { CompareButton } from "@/components/storefront/compare"
import { WishlistButton } from "@/components/storefront/wishlist-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { cn, discountPercent, formatIDR, formatNumber, formatPrice } from "@/lib/utils"
import type { Product, ProductBadge } from "@/types"

const badgeMap: Record<
  ProductBadge,
  { key: string; variant: "default" | "lime" | "cyan" | "danger" }
> = {
  terlaris: { key: "bestSeller", variant: "default" },
  baru: { key: "new", variant: "lime" },
  promo: { key: "promo", variant: "danger" },
  langka: { key: "rare", variant: "cyan" },
}

export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("common")
  const locale = useLocale()
  const isEn = locale === "en"
  const min = Math.min(...product.variants.map((v) => v.price))
  const minVariant = product.variants.find((v) => v.price === min)
  const original = minVariant?.originalPrice ?? null
  const off = original ? discountPercent(original, min) : 0
  const tagline = isEn ? product.taglineEn : product.tagline

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-shadow-lg">
        <Link
          href={`/produk/${product.slug}`}
          className="flex h-full flex-col focus-visible:outline-none"
        >
          {/* Header / logo zone */}
          <div
            className={cn(
              "relative flex aspect-[5/3] items-center justify-center border-b-2 border-border",
              bgFor(product.accent),
            )}
          >
            <span className="text-6xl drop-shadow-[2px_2px_0_var(--border)]">
              {product.logo}
            </span>
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
              {product.badges.slice(0, 2).map((b) => (
                <Badge key={b} variant={badgeMap[b].variant}>
                  {t(badgeMap[b].key)}
                </Badge>
              ))}
              {min === 0 && <Badge variant="lime">{isEn ? "Free" : "Gratis"}</Badge>}
              {off > 0 && <Badge variant="danger">-{off}%</Badge>}
            </div>
            <WishlistButton slug={product.slug} className="absolute right-2.5 top-2.5" />
            <CompareButton slug={product.slug} className="absolute bottom-2.5 right-2.5" />
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/60">
              <span>{product.brand}</span>
            </div>
            <h3 className="font-heading text-base font-bold leading-snug">{product.name}</h3>
            <p className="line-clamp-2 text-xs text-foreground/70">{tagline}</p>

            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold">
                <Star className="size-3.5 fill-warning text-warning" />
                {product.rating}
              </span>
              <span className="text-foreground/60">
                {formatNumber(product.soldCount)} {t("sold")}
              </span>
            </div>

            {minVariant && minVariant.stock > 0 && minVariant.stock <= 5 && (
              <div className="mt-1">
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-warning">
                  <span>🔥 {isEn ? "Selling fast" : "Laris"}</span>
                  <span>{isEn ? `Only ${minVariant.stock} left` : `Sisa ${minVariant.stock}`}</span>
                </div>
                <Progress
                  value={Math.min(95, 100 - (minVariant.stock / 10) * 100)}
                  className="h-1.5 border-0 bg-warning/20"
                  indicatorClassName="bg-warning"
                />
              </div>
            )}

            <div className="mt-auto flex items-end justify-between pt-2">
              <div className="flex flex-col">
                {original && (
                  <span className="text-xs text-foreground/60 line-through">
                    {formatIDR(original)}
                  </span>
                )}
                <span className="font-heading text-lg font-extrabold text-foreground">
                  {formatPrice(min, isEn)}
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <Button className="w-full" size="sm" tabIndex={-1} aria-hidden>
              {t("viewDetail")}
            </Button>
          </div>
        </Link>
      </Card>
    </motion.div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="h-full animate-pulse rounded-base border-2 border-border/40 bg-secondary-background">
      <div className="aspect-[5/3] border-b-2 border-border/40 bg-foreground/10" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 rounded bg-foreground/10" />
        <div className="h-4 w-2/3 rounded bg-foreground/10" />
        <div className="h-3 w-full rounded bg-foreground/10" />
        <div className="h-6 w-1/2 rounded bg-foreground/10" />
        <div className="h-9 w-full rounded bg-foreground/10" />
      </div>
    </div>
  )
}
