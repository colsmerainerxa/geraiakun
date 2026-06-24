"use client"

import { Package, Sparkles, Wallet } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Reveal } from "@/components/shared/motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Link } from "@/i18n/navigation"
import { useOrders } from "@/lib/api/queries"
import { cn, formatDate, formatIDR, initials } from "@/lib/utils"
import type { OrderStatus } from "@/types"

const DEMO_NAME = "Rafa Pratama"
const DEMO_AVATAR = "https://api.dicebear.com/9.x/notionists/svg?seed=Rafa"

const statusVariant: Record<
  OrderStatus,
  "warning" | "cyan" | "success" | "danger"
> = {
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
  return `${visible}${"•".repeat(Math.max(local.length - 2, 3))}@${domain}`
}

export function AccountView() {
  const t = useTranslations("account")
  const locale = useLocale()
  const dateLocale = locale === "en" ? "en-US" : "id-ID"
  const { data: orders, isLoading } = useOrders()

  const list = orders ?? []
  const totalOrders = list.length
  const activeCount = list.filter((o) => o.status === "selesai").length
  const totalSpent = list
    .filter((o) => o.paidAt)
    .reduce((s, o) => s + o.total, 0)

  const delivered = list.filter((o) => o.credentials.length > 0)

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
            <AvatarImage src={DEMO_AVATAR} alt={DEMO_NAME} />
            <AvatarFallback>{initials(DEMO_NAME)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-foreground/60">{t("greeting")},</p>
            <h1 className="font-heading text-2xl font-extrabold sm:text-3xl">
              {DEMO_NAME}
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
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">
                {s.label}
              </p>
              <p className="font-heading text-xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">{t("myOrders")}</TabsTrigger>
          <TabsTrigger value="accounts">{t("myAccounts")}</TabsTrigger>
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
                <span>Invoice</span>
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
                      <span className="font-heading font-bold">
                        {o.invoice}
                      </span>
                      <span className="text-sm text-foreground/70">
                        {formatDate(o.createdAt, dateLocale)}
                      </span>
                      <span>
                        <Badge variant={statusVariant[o.status]}>
                          {o.status}
                        </Badge>
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
                        <p className="truncate font-heading font-bold">
                          {item.productName}
                        </p>
                        <p className="truncate text-xs text-foreground/60">
                          {item.variantLabel}
                        </p>
                        <p className="mt-1 truncate font-mono text-xs text-foreground/70">
                          {maskEmail(cred.email)}
                        </p>
                      </div>
                    </div>
                  )
                }),
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-base border-2 border-dashed border-border py-20 text-center">
      <span className="text-5xl">📦</span>
      <h3 className="font-heading text-lg font-bold">{label}</h3>
    </div>
  )
}
