"use client"

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { Container } from "@/components/shared/container"
import { PromoInput } from "@/components/storefront/promo-input"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { useProducts } from "@/lib/api/queries"
import { computeDiscount } from "@/lib/promo"
import { cn, formatIDR, formatPrice } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import { usePromo } from "@/stores/promo"

const FEE = 1000

export function CartView() {
  const t = useTranslations("cart")
  const tc = useTranslations("common")
  const isEn = useLocale() === "en"
  const items = useCart((s) => s.items)
  const updateQty = useCart((s) => s.updateQty)
  const removeItem = useCart((s) => s.removeItem)
  const { data: allProducts } = useProducts()
  const addItem = useCart((s) => s.addItem)
  const promo = usePromo((s) => s.promo)

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = computeDiscount(promo, subtotal)
  const total = subtotal - discount + FEE
  const cross = (allProducts ?? []).filter((p) => !items.some((i) => i.productSlug === p.slug)).slice(0, 2)

  if (items.length === 0) {
    return (
      <Container className="flex flex-col items-center py-20 text-center">
        <div className="flex size-24 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow">
          <ShoppingBag className="size-11" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-extrabold">{t("empty")}</h1>
        <p className="mt-2 max-w-sm text-foreground/60">{t("emptyDesc")}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/katalog">{t("startShopping")}</Link>
        </Button>
      </Container>
    )
  }

  return (
    <Container className="py-10">
      <h1 className="mb-8 font-heading text-3xl font-extrabold sm:text-4xl">
        {t("title")}{" "}
        <span className="text-foreground/40">
          ({items.length} {t("item")})
        </span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.variantId}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="flex gap-4 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm"
              >
                <Link
                  href={`/produk/${item.productSlug}`}
                  className={cn(
                    "flex size-20 shrink-0 items-center justify-center rounded-base border-2 border-border text-3xl",
                    bgFor(item.accent),
                  )}
                >
                  {item.productLogo}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/produk/${item.productSlug}`}
                        className="font-heading text-base font-bold leading-tight hover:underline"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-0.5 text-sm text-foreground/60">{item.variantLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="text-foreground/40 hover:text-danger"
                      aria-label={tc("remove")}
                    >
                      <Trash2 className="size-4.5" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQty(item.variantId, item.qty - 1)}
                        className="flex size-7 items-center justify-center rounded-base border-2 border-border bg-secondary-background hover:bg-main"
                        aria-label={tc("decrease")}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center font-heading text-sm font-bold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.variantId, item.qty + 1)}
                        className="flex size-7 items-center justify-center rounded-base border-2 border-border bg-secondary-background hover:bg-main"
                        aria-label={tc("increase")}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="font-heading text-lg font-extrabold">
                      {formatIDR(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>

          <Button variant="ghost" asChild className="mt-1 w-fit text-foreground/60">
            <Link href="/katalog">← {t("continueShopping")}</Link>
          </Button>
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex flex-col gap-4 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <h2 className="font-heading text-lg font-bold">{t("summary")}</h2>

            <PromoInput subtotal={subtotal} />

            <div className="flex flex-col gap-2 border-t-2 border-dashed border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/70">{tc("subtotal")}</span>
                <span className="font-bold">{formatIDR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>{tc("discount")}</span>
                  <span className="font-bold">- {formatIDR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-foreground/70">{tc("fee")}</span>
                <span className="font-bold">{formatIDR(FEE)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-heading font-bold">{tc("total")}</span>
                <span className="font-heading text-2xl font-extrabold">{formatIDR(total)}</span>
              </div>
            </div>

            <Button asChild size="lg" className="w-full">
              <Link href="/checkout">
                {t("checkout")} <ArrowRight className="size-5" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>

      {cross.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading text-xl font-extrabold">{tc("frequentlyBought")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {cross.map((p) => {
              const pMin = Math.min(...p.variants.map((cv) => cv.price))
              const pv = p.variants.find((cv: any) => cv.price === pMin) ?? p.variants[0]
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
                    onClick={() =>
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
                    }
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Container>
  )
}
