"use client"

import { Star } from "lucide-react"
import { motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { productMinPrice } from "@/lib/mock/products"
import { cn, discountPercent, formatIDR, formatNumber } from "@/lib/utils"
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
  const min = productMinPrice(product)
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
            <span className="text-6xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]">
              {product.logo}
            </span>
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
              {product.badges.slice(0, 2).map((b) => (
                <Badge key={b} variant={badgeMap[b].variant}>
                  {t(badgeMap[b].key)}
                </Badge>
              ))}
            </div>
            {off > 0 && (
              <span className="absolute right-2.5 top-2.5 rotate-3 rounded-base border-2 border-border bg-danger px-2 py-0.5 font-heading text-xs font-extrabold text-foreground shadow-shadow-sm">
                -{off}%
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/60">
              <span>{product.brand}</span>
            </div>
            <h3 className="font-heading text-base font-bold leading-snug">
              {product.name}
            </h3>
            <p className="line-clamp-2 text-xs text-foreground/70">{tagline}</p>

            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-0.5 font-bold">
                <Star className="size-3.5 fill-warning text-warning" />
                {product.rating}
              </span>
              <span className="text-foreground/50">
                {formatNumber(product.soldCount)} {t("sold")}
              </span>
            </div>

            <div className="mt-auto flex items-end justify-between pt-2">
              <div className="flex flex-col">
                {original && (
                  <span className="text-xs text-foreground/50 line-through">
                    {formatIDR(original)}
                  </span>
                )}
                <span className="font-heading text-lg font-extrabold text-foreground">
                  {formatIDR(min)}
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <Button
              className="w-full"
              size="sm"
              tabIndex={-1}
              aria-hidden
            >
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
