"use client"

import {
  Heart,
  LayoutDashboard,
  Menu,
  ShoppingCart,
  Sparkles,
  User,
} from "lucide-react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Container } from "@/components/shared/container"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { NotificationCenter } from "@/components/storefront/notification-center"
import { SearchBar as SearchBarAutocomplete } from "@/components/storefront/search-bar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useMounted } from "@/hooks/use-mounted"
import { Link } from "@/i18n/navigation"
import { useCart } from "@/stores/cart"
import { useUI } from "@/stores/ui"
import { useWishlist } from "@/stores/wishlist"

function useNavLinks() {
  const t = useTranslations("nav")
  return [
    { href: "/", label: t("home") },
    { href: "/katalog", label: t("catalog") },
    { href: "/artikel", label: t("blog") },
    { href: "/lacak", label: t("track") },
    { href: "/bantuan", label: t("help") },
  ] as const
}

function SearchBar({ onSubmit }: { onSubmit?: () => void }) {
  return <SearchBarAutocomplete onSubmit={onSubmit} />
}

export function Navbar() {
  const t = useTranslations("nav")
  const links = useNavLinks()
  const { setCartOpen } = useUI()
  const mounted = useMounted()
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0))
  const wishCount = useWishlist((s) => s.slugs.length)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <span className="font-heading text-xl font-extrabold tracking-tight">
            beli<span className="text-accent-pink">akun</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Button key={l.href} variant="ghost" size="sm" asChild>
              <Link href={l.href}>{l.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Search (desktop) */}
        <div className="mx-2 hidden max-w-sm flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <ThemeToggle />
          <NotificationCenter />

          <Button
            variant="neutral"
            size="icon-sm"
            className="relative hidden sm:inline-flex"
            asChild
            aria-label={t("wishlist")}
          >
            <Link href="/wishlist">
              <Heart className="size-4" />
              {mounted && wishCount > 0 && (
                <motion.span
                  key={wishCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border-2 border-border bg-accent-pink text-[10px] font-extrabold text-foreground"
                >
                  {wishCount}
                </motion.span>
              )}
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link href="/masuk">{t("login")}</Link>
          </Button>

          <Button
            variant="neutral"
            size="icon-sm"
            className="hidden sm:inline-flex"
            asChild
            aria-label={t("account")}
          >
            <Link href="/akun">
              <User className="size-4" />
            </Link>
          </Button>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5"
            aria-label={t("cart")}
          >
            <ShoppingCart className="size-4" />
            {mounted && count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border-2 border-border bg-accent-pink text-[10px] font-extrabold text-foreground"
              >
                {count}
              </motion.span>
            )}
          </button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="neutral"
                size="icon-sm"
                className="lg:hidden"
                aria-label="Menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="size-5" /> beliakun
                </SheetTitle>
              </SheetHeader>
              <div className="md:hidden">
                <SearchBar onSubmit={() => setMobileOpen(false)} />
              </div>
              <nav className="flex flex-col gap-1">
                {links.map((l) => (
                  <Button
                    key={l.href}
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href={l.href}>{l.label}</Link>
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="justify-start"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/akun">
                    <User className="size-4" /> {t("account")}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/wishlist">
                    <Heart className="size-4" /> {t("wishlist")}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/admin">
                    <LayoutDashboard className="size-4" /> {t("admin")}
                  </Link>
                </Button>
                <div className="my-1 h-0.5 bg-border" />
                <Button
                  variant="default"
                  className="justify-start"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/masuk">{t("login")}</Link>
                </Button>
                <Button
                  variant="neutral"
                  className="justify-start"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/daftar">{t("register")}</Link>
                </Button>
              </nav>
              <div className="mt-auto flex items-center justify-between">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  )
}
