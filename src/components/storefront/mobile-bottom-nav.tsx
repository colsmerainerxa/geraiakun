"use client"

import { GitCompare, Heart, Home, Search, ShoppingCart, Wand2 } from "lucide-react"
import { motion } from "motion/react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import { useCompare } from "@/stores/compare"
import { useUI } from "@/stores/ui"
import { useWishlist } from "@/stores/wishlist"

function stripLocale(pathname: string) {
  const stripped = pathname.replace(/^\/(id|en)(?=\/|$)/, "")
  return stripped || "/"
}

export function MobileBottomNav() {
  const t = useTranslations("nav")
  const mounted = useMounted()
  const pathname = usePathname()
  const path = stripLocale(pathname)
  const count = useCart((state) => state.items.reduce((sum, item) => sum + item.qty, 0))
  const wishCount = useWishlist((state) => state.slugs.length)
  const compareCount = useCompare((state) => state.slugs.length)
  const cartOpen = useUI((state) => state.cartOpen)
  const setCartOpen = useUI((state) => state.setCartOpen)

  const hidden =
    path.startsWith("/checkout") ||
    path.startsWith("/pembayaran") ||
    /^\/produk\/[^/]+\/?$/.test(path) ||
    compareCount > 0 ||
    cartOpen

  if (!mounted || hidden) return null

  const links = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/katalog", label: t("catalog"), icon: Search },
    { href: "/rekomendasi", label: t("recommendation"), icon: Wand2 },
    { href: "/wishlist", label: t("wishlist"), icon: Heart, count: wishCount },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-background/95 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md items-center gap-1.5">
        {links.map((item) => {
          const active = item.href === "/" ? path === "/" : path.startsWith(item.href)
          return (
            <Button
              key={item.href}
              asChild
              variant={active ? "default" : "ghost"}
              size="sm"
              className="relative h-12 flex-1 flex-col gap-0.5 px-1 text-[10px]"
            >
              <Link href={item.href}>
                <item.icon
                  className={cn("size-4", active && item.href === "/wishlist" && "fill-foreground")}
                />
                <span className="max-w-full truncate leading-none">{item.label}</span>
                {item.count ? (
                  <motion.span
                    key={item.count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-border bg-accent-pink text-[10px] font-extrabold text-foreground"
                  >
                    {item.count}
                  </motion.span>
                ) : null}
              </Link>
            </Button>
          )
        })}

        <Button
          type="button"
          variant="neutral"
          size="sm"
          className="relative h-12 flex-1 flex-col gap-0.5 px-1 text-[10px]"
          onClick={() => setCartOpen(true)}
        >
          {compareCount > 0 ? (
            <GitCompare className="size-4" />
          ) : (
            <ShoppingCart className="size-4" />
          )}
          <span className="max-w-full truncate leading-none">{t("cart")}</span>
          {count > 0 ? (
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-border bg-accent-pink text-[10px] font-extrabold text-foreground"
            >
              {count}
            </motion.span>
          ) : null}
        </Button>
      </div>
    </nav>
  )
}
