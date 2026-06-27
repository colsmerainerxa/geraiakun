"use client"

import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { ProductCard } from "@/components/storefront/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMounted } from "@/hooks/use-mounted"
import { Link } from "@/i18n/navigation"
import { products } from "@/lib/mock/products"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import { useWishlist } from "@/stores/wishlist"
import type { Product } from "@/types"

type SortKey = "recent" | "priceAsc" | "priceDesc" | "rating"

function minPrice(p: Product) {
  return Math.min(...p.variants.map((v) => v.price))
}
function cheapestVariant(p: Product) {
  const min = minPrice(p)
  return p.variants.find((v) => v.price === min) ?? p.variants[0]
}

export function WishlistView() {
  const t = useTranslations("wishlist")
  const tc = useTranslations("common")
  const isEn = useLocale() === "en"
  const mounted = useMounted()

  const slugs = useWishlist((s) => s.slugs)
  const clear = useWishlist((s) => s.clear)
  const addItem = useCart((s) => s.addItem)

  const [sort, setSort] = useState<SortKey>("recent")

  const wished: Product[] = useMemo(() => {
    if (!mounted) return []
    return slugs
      .map((s) => products.find((p) => p.slug === s))
      .filter((p): p is Product => Boolean(p))
  }, [slugs, mounted])

  const sorted = useMemo(() => {
    const list = [...wished]
    switch (sort) {
      case "priceAsc":
        list.sort((a, b) => minPrice(a) - minPrice(b))
        break
      case "priceDesc":
        list.sort((a, b) => minPrice(b) - minPrice(a))
        break
      case "rating":
        list.sort((a, b) => b.rating - a.rating)
        break
      default:
        // "recent" = pertahankan urutan (store menambah di depan)
        break
    }
    return list
  }, [wished, sort])

  const totalValue = wished.reduce((s, p) => s + minPrice(p), 0)
  const inStockCount = wished.filter((p) => p.variants.some((v) => v.stock > 0)).length

  function addAllToCart() {
    if (wished.length === 0) return
    let n = 0
    for (const p of wished) {
      const v = cheapestVariant(p)
      if (v.stock <= 0) continue
      addItem({
        productId: p.id,
        productName: p.name,
        productLogo: p.logo,
        productSlug: p.slug,
        variantId: v.id,
        variantLabel: isEn ? v.labelEn : v.label,
        price: v.price,
        qty: 1,
        accent: p.accent,
      })
      n += 1
    }
    toast.success(t("addedBatch", { count: n }))
  }

  function shareWishlist() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    navigator.clipboard?.writeText(url)
    toast.success(t("shareCopied"))
  }

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-foreground/60">{t("pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("sortRecent")}</SelectItem>
              <SelectItem value="priceAsc">{t("sortPriceAsc")}</SelectItem>
              <SelectItem value="priceDesc">{t("sortPriceDesc")}</SelectItem>
              <SelectItem value="rating">{t("sortRating")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats / actions bar */}
      {mounted && wished.length > 0 && (
        <div className="mt-6 grid gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-bold">
              <Heart className="size-4 fill-accent-pink text-accent-pink" />
              {wished.length} {t("items")}
            </span>
            <Badge variant="lime">
              {inStockCount} {t("inStock")}
            </Badge>
            <span className="text-foreground/60">
              {t("totalValue")}:{" "}
              <strong className="text-foreground">{formatPrice(totalValue, isEn)}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={shareWishlist}>
              {t("share")}
            </Button>
            <Button variant="neutral" size="sm" onClick={clear}>
              <Trash2 className="size-4" /> {t("clearAll")}
            </Button>
            <Button size="sm" onClick={addAllToCart}>
              <ShoppingCart className="size-4" /> {t("addAll")}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-8">
        {!mounted ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-base border-2 border-border/40 bg-secondary-background"
              />
            ))}
          </div>
        ) : wished.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((p) => (
              <div key={p.id} className="relative">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

function EmptyWishlist() {
  const t = useTranslations("wishlist")
  const tc = useTranslations("common")
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-base border-2 border-dashed border-border py-24 text-center">
      <span className="flex size-20 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow">
        <Heart className="size-9 text-accent-pink" />
      </span>
      <div>
        <h3 className="font-heading text-xl font-extrabold">{t("empty")}</h3>
        <p className="mt-1 max-w-sm text-sm text-foreground/60">{t("emptyDesc")}</p>
      </div>
      <Button asChild size="lg">
        <Link href="/katalog">
          <ShoppingCart className="size-5" /> {tc("continue")}
        </Link>
      </Button>
    </div>
  )
}
