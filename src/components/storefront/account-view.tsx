"use client"

import {
  ArrowRight,
  KeyRound,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Wallet,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Reveal } from "@/components/shared/motion"
import { AccountSettingsView } from "@/components/storefront/account-settings-view"
import { ProductCard } from "@/components/storefront/product-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMounted } from "@/hooks/use-mounted"
import { Link } from "@/i18n/navigation"
import { useAccountProfile, useCurrentUserOrders, useProducts } from "@/lib/api/queries"
import { cn, formatDate, formatIDR, initials } from "@/lib/utils"
import { usePurchasedOrders } from "@/stores/orders"
import { useWishlist } from "@/stores/wishlist"
import type { OrderStatus } from "@/types"

const statusVariant: Record<OrderStatus, "warning" | "cyan" | "success" | "danger"> = {
  "menunggu-pembayaran": "warning",
  diproses: "cyan",
  selesai: "success",
  dibatalkan: "danger",
  refund: "danger",
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@")
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`
}

type AccountIdentity = {
  name: string
  email: string
  image: string | null
}

export function AccountView({ initialUser }: { initialUser: AccountIdentity }) {
  const t = useTranslations("account")
  const ts = useTranslations("orderStatus")
  const tw = useTranslations("wishlist")
  const mounted = useMounted()
  const wishedSlugs = useWishlist((s) => s.slugs)
  const { data: allProducts } = useProducts()
  const wished = mounted
    ? wishedSlugs
        .map((s) => (allProducts ?? []).find((p) => p.slug === s))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    : []
  const locale = useLocale()
  const dateLocale = locale === "en" ? "en-US" : "id-ID"
  const localOrders = usePurchasedOrders((s) => s.orders)
  const { data: orders, isLoading } = useCurrentUserOrders()
  const { data: accountProfile } = useAccountProfile()

  const list = orders?.length ? orders : mounted ? localOrders : []
  const totalOrders = list.length
  const activeCount = list.filter((o) => o.status === "selesai").length
  const totalSpent = list.filter((o) => o.paidAt).reduce((s, o) => s + o.total, 0)

  const delivered = list.filter((o) => o.credentials.length > 0)
  const displayName =
    accountProfile?.name?.trim() ||
    initialUser.name.trim() ||
    accountProfile?.email?.split("@")[0] ||
    initialUser.email.split("@")[0] ||
    "Pelanggan"
  const displayImage = accountProfile ? accountProfile.image || null : initialUser.image

  const stats = [
    {
      icon: Package,
      label: t("stats.orders"),
      value: String(totalOrders),
      accent: "bg-accent-cyan",
    },
    {
      icon: Sparkles,
      label: t("stats.active"),
      value: String(activeCount),
      accent: "bg-accent-lime",
    },
    {
      icon: Wallet,
      label: t("stats.spent"),
      value: formatIDR(totalSpent),
      accent: "bg-accent-pink",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <Reveal>
        <div className="flex items-center gap-4 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <Avatar className="size-16">
            {displayImage && <AvatarImage src={displayImage} alt={displayName} />}
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-foreground/60">{t("greeting")},</p>
            <h1 className="font-heading text-2xl font-extrabold sm:text-3xl">
              {displayName}
            </h1>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
          >
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                s.accent,
              )}
            >
              <s.icon className="size-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">
                {s.label}
              </p>
              <p className="font-heading text-xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orders">{t("myOrders")}</TabsTrigger>
          <TabsTrigger value="accounts">{t("myAccounts")}</TabsTrigger>
          <TabsTrigger value="favorites">{tw("title")}</TabsTrigger>
          <TabsTrigger value="settings">{t("settings")}</TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="orders">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-base border-2 border-border/40 bg-secondary-background"
                />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState label={t("noOrders")} />
          ) : (
            <div className="overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              {/* Header (desktop) */}
              <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 border-b-2 border-border bg-main px-5 py-3 font-heading text-xs font-extrabold uppercase tracking-wide text-main-foreground sm:grid">
                <span>{t("invoice")}</span>
                <span>{t("orderDate")}</span>
                <span>{t("orderStatus")}</span>
                <span className="text-right">{t("orderTotal")}</span>
              </div>
              <ul className="divide-y-2 divide-border">
                {list.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/lacak?inv=${o.invoice}`}
                      className="grid grid-cols-2 gap-3 px-5 py-4 transition-colors hover:bg-main/10 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:items-center sm:gap-4"
                    >
                      <span className="font-heading font-bold">{o.invoice}</span>
                      <span className="text-sm text-foreground/70">
                        {formatDate(o.createdAt, dateLocale)}
                      </span>
                      <span>
                        <Badge variant={statusVariant[o.status]}>{ts(o.status)}</Badge>
                      </span>
                      <span className="text-right font-heading font-extrabold">
                        {formatIDR(o.total)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* Digital accounts */}
        <TabsContent value="accounts">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-base border-2 border-border/40 bg-secondary-background"
                />
              ))}
            </div>
          ) : delivered.length === 0 ? (
            <EmptyState label={t("noOrders")} />
          ) : (
            <>
              <Link
                href="/akun/vault"
                className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-base border-2 border-border bg-main p-5 shadow-shadow transition-all hover:-translate-y-0.5 hover:shadow-shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm">
                    <KeyRound className="size-5" />
                  </span>
                  <div>
                    <p className="font-heading text-sm font-extrabold">Account Vault & Beli Lagi</p>
                    <p className="text-xs text-main-foreground/70">
                      Lihat health check, garansi, masa aktif, dan beli kembali akun digital.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-3 py-1.5 font-heading text-xs font-bold shadow-shadow-sm">
                  <ShieldCheck className="size-4" /> Buka Vault
                </span>
              </Link>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
                  <ShoppingCart className="size-5 text-accent-purple" />
                  <div>
                    <p className="font-heading text-sm font-bold">
                      Pembelian ulang tanpa langganan
                    </p>
                    <p className="text-xs text-foreground/60">
                      Setiap pembelian membuat order baru tanpa tagihan otomatis.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
                  <ShieldCheck className="size-5 text-success" />
                  <div>
                    <p className="font-heading text-sm font-bold">Garansi terlihat jelas</p>
                    <p className="text-xs text-foreground/60">
                      Status warranty dan klaim kendala mudah ditemukan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {delivered.flatMap((o) =>
                  o.items.map((item, idx) => {
                    const cred = o.credentials[idx] ?? o.credentials[0]
                    return (
                      <div
                        key={`${o.id}-${item.variantId}-${idx}`}
                        className="flex items-center gap-4 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow"
                      >
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-base border-2 border-border bg-secondary-background text-2xl">
                          {item.productLogo}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-heading font-bold">{item.productName}</p>
                          <p className="truncate text-xs text-foreground/60">{item.variantLabel}</p>
                          <p className="mt-1 truncate font-mono text-xs text-foreground/70">
                            {maskEmail(cred.email)}
                          </p>
                        </div>
                      </div>
                    )
                  }),
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites">
          {wished.length === 0 ? (
            <EmptyState label={tw("empty")} />
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/wishlist">
                    {tw("viewAll")} <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {wished.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          {mounted ? (
            <AccountSettingsView />
          ) : (
            <div className="h-96 animate-pulse rounded-base border-2 border-border/40 bg-secondary-background" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-base border-2 border-dashed border-border py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow">
        <Package className="size-7" />
      </span>
      <h3 className="font-heading text-lg font-bold">{label}</h3>
    </div>
  )
}
