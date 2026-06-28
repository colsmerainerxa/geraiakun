"use client"

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { cn, formatIDR } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import { useUI } from "@/stores/ui"

export function CartDrawer() {
  const t = useTranslations("common")
  const tn = useTranslations("nav")
  const tcart = useTranslations("cart")
  const { cartOpen, setCartOpen } = useUI()
  const items = useCart((s) => s.items)
  const updateQty = useCart((s) => s.updateQty)
  const removeItem = useCart((s) => s.removeItem)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" /> {t("checkout")} ({items.length})
          </SheetTitle>
        </SheetHeader>

        <div className="-mx-2 flex-1 overflow-y-auto px-2">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-20 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow">
                <ShoppingBag className="size-9" />
              </div>
              <p className="font-heading text-lg font-bold">{tcart("empty")}</p>
              <p className="text-sm text-foreground/60">{tcart("emptyDesc")}</p>
              <Button onClick={() => setCartOpen(false)} asChild className="mt-2">
                <Link href="/katalog">{tcart("startShopping")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3 py-2">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.variantId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="flex gap-3 rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow-sm"
                  >
                    <div
                      className={cn(
                        "flex size-14 shrink-0 items-center justify-center rounded-base border-2 border-border text-2xl",
                        bgFor(item.accent),
                      )}
                    >
                      {item.productLogo}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-heading text-sm font-bold leading-tight">
                          {item.productName}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="text-foreground/40 hover:text-danger"
                          aria-label={t("remove")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="text-xs text-foreground/60">{item.variantLabel}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateQty(item.variantId, item.qty - 1)}
                            className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-secondary-background hover:bg-main"
                            aria-label={t("decrease")}
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="w-8 text-center font-heading text-sm font-bold">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.variantId, item.qty + 1)}
                            className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-secondary-background hover:bg-main"
                            aria-label={t("increase")}
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <span className="font-heading text-sm font-extrabold">
                          {formatIDR(item.price * item.qty)}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter>
            <div className="flex items-center justify-between border-t-2 border-dashed border-border pt-3">
              <span className="font-heading font-bold">{t("subtotal")}</span>
              <span className="font-heading text-xl font-extrabold">{formatIDR(subtotal)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={() => setCartOpen(false)} asChild>
              <Link href="/checkout">{t("checkout")}</Link>
            </Button>
            <Button variant="neutral" className="w-full" onClick={() => setCartOpen(false)} asChild>
              <Link href="/keranjang">{tn("cart")}</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
