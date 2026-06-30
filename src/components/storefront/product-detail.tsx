"use client"

import {
  BookOpen,
  Check,
  Headphones,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Zap,
} from "lucide-react"
import { motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { Reveal } from "@/components/shared/motion"
import { SectionHeading } from "@/components/shared/section-heading"
import { CompareButton } from "@/components/storefront/compare"
import { NotifyMe } from "@/components/storefront/notify-me"
import { ProductCard } from "@/components/storefront/product-card"
import { QaSection } from "@/components/storefront/qa-section"
import { ReviewsSection } from "@/components/storefront/reviews-section"
import { ShareButtons } from "@/components/storefront/share-buttons"
import { ViewersBadge } from "@/components/storefront/social-proof-toast"
import { WishlistButton } from "@/components/storefront/wishlist-button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link, useRouter } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { articles } from "@/lib/mock/articles"
import { products } from "@/lib/mock/products"
import { cn, discountPercent, formatIDR, formatNumber, formatPrice } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import { useRecentlyViewed } from "@/stores/recently-viewed"
import { useUI } from "@/stores/ui"
import type { Product, ProductBadge, Review } from "@/types"

type ProductWithReviews = Product & { reviews: Review[] }

const badgeMap: Record<
  ProductBadge,
  { key: string; variant: "default" | "lime" | "cyan" | "danger" }
> = {
  terlaris: { key: "bestSeller", variant: "default" },
  baru: { key: "new", variant: "lime" },
  promo: { key: "promo", variant: "danger" },
  langka: { key: "rare", variant: "cyan" },
}

export function ProductDetail({
  product,
  related,
}: {
  product: ProductWithReviews
  related: Product[]
}) {
  const t = useTranslations("product")
  const tc = useTranslations("common")
  const tn = useTranslations("nav")
  const locale = useLocale()
  const isEn = locale === "en"
  const router = useRouter()
  const addItem = useCart((s) => s.addItem)
  const setCartOpen = useUI((s) => s.setCartOpen)
  const addRecent = useRecentlyViewed((s) => s.add)

  // Record this product as recently viewed (demo: persisted to localStorage).
  useEffect(() => {
    addRecent(product.slug)
  }, [product.slug, addRecent])

  const crossSell = products.filter((p) => p.slug !== product.slug).slice(0, 2)
  const relatedArticles = articles.filter((a) => a.relatedSlugs.includes(product.slug)).slice(0, 3)

  // Default to the cheapest in-stock variant, else the first.
  const cheapest = [...product.variants].sort((a, b) => a.price - b.price)
  const [variantId, setVariantId] = useState(
    (cheapest.find((v) => v.stock > 0) ?? product.variants[0]).id,
  )
  const [qty, setQty] = useState(1)

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0]
  const off = variant.originalPrice ? discountPercent(variant.originalPrice, variant.price) : 0
  const soldOut = variant.stock <= 0
  const features = isEn ? product.featuresEn : product.features
  const description = isEn ? product.descriptionEn : product.description

  function buildCartItem() {
    return {
      productId: product.id,
      productName: product.name,
      productLogo: product.logo,
      productSlug: product.slug,
      variantId: variant.id,
      variantLabel: isEn ? variant.labelEn : variant.label,
      price: variant.price,
      qty,
      accent: product.accent,
    }
  }

  function handleAddToCart() {
    addItem(buildCartItem())
    toast.success(t("addedToCart"), {
      description: `${product.name} � ${isEn ? variant.labelEn : variant.label}`,
    })
  }

  function handleBuyNow() {
    addItem(buildCartItem())
    router.push("/checkout")
  }

  const trust = [
    { icon: ShieldCheck, label: t("warranty") },
    { icon: Zap, label: t("instant") },
    { icon: Headphones, label: t("support") },
  ]

  return (
    <Container className="py-8 pb-32 lg:py-12 lg:pb-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-foreground/60">
        <Link href="/" className="hover:text-foreground hover:underline">
          {tn("home")}
        </Link>
        <span>/</span>
        <Link href="/katalog" className="hover:text-foreground hover:underline">
          {tn("catalog")}
        </Link>
        <span>/</span>
        <span className="font-bold text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ---- Visual / hero ---- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div
            className={cn(
              "relative flex aspect-square items-center justify-center overflow-hidden rounded-base border-2 border-border shadow-shadow",
              bgFor(product.accent),
            )}
          >
            <div className="bg-dots pointer-events-none absolute inset-0 opacity-10" />
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative text-[8rem] drop-shadow-[4px_4px_0_rgba(0,0,0,0.25)] sm:text-[10rem]"
            >
              {product.logo}
            </motion.span>
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {product.badges.map((b) => (
                <Badge key={b} variant={badgeMap[b].variant}>
                  {tc(badgeMap[b].key)}
                </Badge>
              ))}
            </div>
            {off > 0 && (
              <span className="absolute right-4 top-4 rotate-3 rounded-base border-2 border-border bg-danger px-3 py-1 font-heading text-base font-extrabold text-foreground shadow-shadow-sm">
                -{off}%
              </span>
            )}
          </div>

          {/* Trust strip */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {trust.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background p-3 text-center shadow-shadow-sm"
              >
                <item.icon className="size-5" />
                <span className="text-xs font-bold leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Buy box ---- */}
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/50">
                {product.brand}
              </span>
              <h1 className="mt-1 font-heading text-3xl font-extrabold leading-tight sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-2 text-foreground/70">
                {isEn ? product.taglineEn : product.tagline}
              </p>
            </div>
            <div className="mt-1 flex shrink-0 items-center gap-2">
              <WishlistButton slug={product.slug} className="size-10" />
              <CompareButton slug={product.slug} size="sm" withLabel />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-bold">
              <Star className="size-4 fill-warning text-warning" />
              {product.rating}
            </span>
            <a href="#reviews" className="text-foreground/60 underline-offset-2 hover:underline">
              {formatNumber(product.reviewCount)} {tc("reviews")}
            </a>
            <span className="text-foreground/40">�</span>
            <span className="text-foreground/60">
              {formatNumber(product.soldCount)} {tc("sold")}
            </span>
          </div>

          {/* Live viewers (social proof) */}
          <ViewersBadge />

          {/* Price */}
          <div className="flex items-end gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
            <div>
              {variant.originalPrice && (
                <span className="block text-sm text-foreground/50 line-through">
                  {formatIDR(variant.originalPrice)}
                </span>
              )}
              <span className="font-heading text-4xl font-extrabold">
                {formatPrice(variant.price, isEn)}
              </span>
            </div>
            {off > 0 && (
              <Badge variant="danger" className="mb-1.5">
                {isEn ? `Save ${off}%` : `Hemat ${off}%`}
              </Badge>
            )}
          </div>

          {/* Stock urgency (low stock) */}
          {!soldOut && variant.stock <= 7 && (
            <div className="rounded-base border-2 border-warning bg-warning/10 p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                <span className="text-foreground">🔥 {isEn ? "Selling fast!" : "Laris!"}</span>
                <span className="text-foreground/70">
                  {isEn ? `Only ${variant.stock} left` : `Sisa ${variant.stock} stok`}
                </span>
              </div>
              <Progress
                value={Math.min(95, 100 - (variant.stock / 10) * 100)}
                className="h-2 border-0 bg-warning/20"
                indicatorClassName="bg-warning"
              />
            </div>
          )}

          {/* Variant selector */}
          <div>
            <span className="font-heading text-sm font-extrabold uppercase">
              {t("chooseVariant")}
            </span>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              {product.variants.map((v) => {
                const active = v.id === variantId
                const vOut = v.stock <= 0
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={vOut}
                    onClick={() => {
                      setVariantId(v.id)
                      setQty(1)
                    }}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-base border-2 px-3.5 py-2.5 text-left transition-all",
                      active
                        ? "border-border bg-main text-main-foreground shadow-shadow-sm"
                        : "border-border bg-secondary-background hover:-translate-y-0.5",
                      vOut && "cursor-not-allowed opacity-50 hover:translate-y-0",
                    )}
                  >
                    <span className="font-heading text-sm font-bold">
                      {isEn ? v.labelEn : v.label}
                    </span>
                    <span className="text-xs font-semibold">
                      {formatPrice(v.price, isEn)}
                      {vOut ? (
                        <span className="ml-1 opacity-70">� {tc("outOfStock")}</span>
                      ) : (
                        <span className="ml-1 opacity-70">
                          � {v.stock} {t("stockLeft")}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Qty + actions */}
          <div className="flex flex-col gap-3">
            {soldOut ? (
              <NotifyMe variantLabel={isEn ? variant.labelEn : variant.label} />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-sm font-extrabold uppercase">{tc("qty")}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm transition-all hover:bg-main disabled:opacity-40"
                      aria-label={tc("decrease")}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center font-heading text-lg font-extrabold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(variant.stock, q + 1))}
                      disabled={qty >= variant.stock}
                      className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm transition-all hover:bg-main disabled:opacity-40"
                      aria-label={tc("increase")}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button size="lg" variant="neutral" onClick={handleAddToCart}>
                    <ShoppingCart className="size-5" /> {tc("addToCart")}
                  </Button>
                  <Button size="lg" onClick={handleBuyNow}>
                    {t("buyDirectly")}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="text-center text-sm text-foreground/60 underline-offset-2 hover:text-foreground hover:underline"
                >
                  {tc("checkout")} →
                </button>
              </>
            )}
          </div>

          {/* What you get */}
          <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-base font-bold">{t("features")}</h2>
              <Button variant="neutral" size="sm" asChild className="shrink-0">
                <Link href={`/produk/${product.slug}/aktivasi`}>
                  <BookOpen className="size-4" /> {isEn ? "Activation Guide" : "Panduan Aktivasi"}
                </Link>
              </Button>
            </div>
            <ul className="mt-3 grid gap-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border bg-accent-lime">
                    <Check className="size-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <ShareButtons
            path={isEn ? `/en/produk/${product.slug}` : `/produk/${product.slug}`}
            title={product.name}
          />

          {/* Trademark / non-affiliation disclaimer (nominative use) */}
          <p className="text-xs leading-relaxed text-foreground/50">
            {t("trademark", { brand: product.brand })}
          </p>
        </div>
      </div>

      {/* ---- Cross-sell ---- */}
      {crossSell.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading text-xl font-extrabold">{tc("frequentlyBought")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {crossSell.map((p) => {
              const pMin = Math.min(...p.variants.map((cv) => cv.price))
              const pv = p.variants.find((cv) => cv.price === pMin) ?? p.variants[0]
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow-sm"
                >
                  <Link
                    href={`/produk/${p.slug}`}
                    className={cn(
                      "flex size-14 shrink-0 items-center justify-center rounded-base border-2 border-border text-2xl",
                      bgFor(p.accent),
                    )}
                  >
                    {p.logo}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/produk/${p.slug}`}
                      className="block truncate font-heading text-sm font-bold hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span className="font-heading text-sm font-extrabold">
                      {formatPrice(pMin, isEn)}
                    </span>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="neutral"
                    aria-label={tc("addToCart")}
                    onClick={() => {
                      addItem({
                        productId: p.id,
                        productName: p.name,
                        productLogo: p.logo,
                        productSlug: p.slug,
                        variantId: pv.id,
                        variantLabel: isEn ? pv.labelEn : pv.label,
                        price: pv.price,
                        qty: 1,
                        accent: p.accent,
                      })
                      toast.success(t("addedToCart"), { description: p.name })
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ---- Details tabs ---- */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="flex-wrap">
            <TabsTrigger value="description">{t("description")}</TabsTrigger>
            <TabsTrigger value="faq">{t("faq")}</TabsTrigger>
            <TabsTrigger value="reviews">
              {t("reviews")} ({product.reviews.length})
            </TabsTrigger>
            <TabsTrigger value="qa">{isEn ? "Q&A" : "Tanya Jawab"}</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <div className="max-w-3xl rounded-base border-2 border-border bg-secondary-background p-6 text-foreground/80 shadow-shadow-sm">
              <p className="leading-relaxed">{description}</p>
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <Accordion
              type="single"
              collapsible
              className="flex max-w-3xl flex-col gap-3"
              defaultValue="faq-0"
            >
              {product.faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger>{isEn ? f.qEn : f.q}</AccordionTrigger>
                  <AccordionContent>{isEn ? f.aEn : f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsSection product={product} mockReviews={product.reviews} />
          </TabsContent>

          <TabsContent value="qa">
            <QaSection product={product} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ---- Related ---- */}
      {related.length > 0 && (
        <div className="mt-16">
          <Separator className="mb-10" />
          <SectionHeading title={t("related")} />
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* ---- Related articles (internal linking) ---- */}
      {relatedArticles.length > 0 && (
        <div className="mt-16">
          <SectionHeading title={isEn ? "Related Articles" : "Artikel Terkait"} />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {relatedArticles.map((a) => (
              <Link
                key={a.slug}
                href={`/artikel/${a.slug}`}
                className="group flex flex-col overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow transition-shadow hover:shadow-shadow-lg"
              >
                <div
                  className={cn(
                    "flex aspect-[16/9] items-center justify-center border-b-2 border-border text-5xl",
                    bgFor(a.accent),
                  )}
                >
                  {a.emoji}
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-sm font-bold leading-snug">
                    {isEn ? a.titleEn : a.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-foreground/70">
                    {isEn ? a.excerptEn : a.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky buy bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-background/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-bold text-foreground/50">
              {isEn ? variant.labelEn : variant.label}
            </span>
            <span className="font-heading text-lg font-extrabold">
              {formatPrice(variant.price, isEn)}
            </span>
          </div>
          {!soldOut && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex size-8 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm disabled:opacity-40"
                aria-label={tc("decrease")}
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-7 text-center font-heading text-sm font-extrabold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(variant.stock, q + 1))}
                disabled={qty >= variant.stock}
                className="flex size-8 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm disabled:opacity-40"
                aria-label={tc("increase")}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          )}
          <Button className="shrink-0 px-4" size="lg" onClick={handleBuyNow} disabled={soldOut}>
            {soldOut ? tc("outOfStock") : tc("buyNow")}
          </Button>
          <Button
            variant="neutral"
            size="icon"
            onClick={handleAddToCart}
            disabled={soldOut}
            aria-label={tc("addToCart")}
          >
            <ShoppingCart className="size-5" />
          </Button>
        </div>
      </div>
    </Container>
  )
}
