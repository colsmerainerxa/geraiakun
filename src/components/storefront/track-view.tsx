"use client"

import {
  Ban,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  KeyRound,
  PackageSearch,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react"
import { motion } from "motion/react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMounted } from "@/hooks/use-mounted"
import { Link } from "@/i18n/navigation"
import { useOrder } from "@/lib/api/queries"
import { downloadInvoice } from "@/lib/invoice"
import { cn, formatDate, formatIDR } from "@/lib/utils"
import { useAdminOverlay } from "@/stores/admin-overlay"
import { usePurchasedOrders } from "@/stores/orders"
import type { Order, OrderStatus } from "@/types"

const STATUS_META: Record<
  OrderStatus,
  { label: string; variant: "warning" | "cyan" | "success" | "danger"; icon: typeof Clock }
> = {
  "menunggu-pembayaran": { label: "Menunggu Pembayaran", variant: "warning", icon: Clock },
  diproses: { label: "Diproses", variant: "cyan", icon: PackageSearch },
  selesai: { label: "Selesai", variant: "success", icon: CheckCircle2 },
  dibatalkan: { label: "Dibatalkan", variant: "danger", icon: Ban },
  refund: { label: "Refund", variant: "danger", icon: RotateCcw },
}

const TIMELINE: OrderStatus[] = ["menunggu-pembayaran", "diproses", "selesai"]

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("track")
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value)
        toast.success(t("copied"), { description: label })
      }}
      className="flex items-center gap-1 rounded-base border-2 border-border bg-secondary-background px-2 py-1 text-xs font-bold shadow-shadow-sm transition-all hover:bg-main"
    >
      <Copy className="size-3" /> {t("copy")}
    </button>
  )
}

function OrderResult({ order }: { order: Order }) {
  const t = useTranslations("track")
  const tc = useTranslations("common")
  const ts = useTranslations("orderStatus")
  const isEn = useLocale() === "en"
  // Apply the demo admin status override if present.
  const ovStatus = useAdminOverlay((s) => s.orderStatus[order.invoice])
  const status = ovStatus ?? order.status
  const meta = STATUS_META[status]
  const activeIdx = TIMELINE.indexOf(status)
  const isTimeline = activeIdx !== -1

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 flex flex-col gap-6"
    >
      {/* Header */}
      <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs text-foreground/60">{t("status")}</span>
            <p className="font-heading text-2xl font-extrabold">{order.invoice}</p>
            <p className="mt-1 text-sm text-foreground/60">
              {order.customerName} — {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge variant={meta.variant} className="gap-1.5 px-3 py-1.5">
            <meta.icon className="size-3.5" /> {ts(status)}
          </Badge>
        </div>

        {/* Warranty / help CTA */}
        <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-dashed border-border pt-4">
          <Button variant="neutral" size="sm" asChild>
            <Link href={`/bantuan/tiket?inv=${order.invoice}`}>
              <ShieldCheck className="size-4" /> {t("claimWarranty")}
            </Link>
          </Button>
          <Button size="sm" onClick={() => downloadInvoice(order, isEn ? "en" : "id")}>
            <Download className="size-4" /> {t("downloadInvoice")}
          </Button>
        </div>

        {/* Timeline */}
        {isTimeline ? (
          <div className="mt-6 flex items-center">
            {TIMELINE.map((s, i) => {
              const reached = i <= activeIdx
              return (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border-2 border-border shadow-shadow-sm",
                        reached ? "bg-accent-lime" : "bg-secondary-background",
                      )}
                    >
                      {(() => {
                        const Icon = STATUS_META[s].icon
                        return <Icon className="size-4" />
                      })()}
                    </span>
                    <span className="max-w-20 text-center text-[11px] font-bold leading-tight">
                      {ts(s)}
                    </span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div
                      className={cn(
                        "mx-1 h-1 flex-1 rounded-full border-2 border-border",
                        i < activeIdx ? "bg-accent-lime" : "bg-secondary-background",
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-base border-2 border-dashed border-border bg-background p-3 text-sm text-foreground/70">
            {status === "dibatalkan"
              ? "Pesanan ini telah dibatalkan."
              : "Pesanan ini telah direfund."}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <h3 className="font-heading text-base font-bold">{tc("total")}</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.variantId} className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main text-lg">
                {item.productLogo}
              </div>
              <div className="flex-1">
                <p className="font-heading text-sm font-bold leading-tight">{item.productName}</p>
                <p className="text-xs text-foreground/60">
                  {item.variantLabel} — {item.qty}
                </p>
              </div>
              <span className="font-heading text-sm font-bold">
                {formatIDR(item.price * item.qty)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-border pt-3">
          <span className="font-heading font-bold">{tc("total")}</span>
          <span className="font-heading text-xl font-extrabold">{formatIDR(order.total)}</span>
        </div>
      </div>

      {/* Credentials */}
      {order.credentials.length > 0 && (
        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex items-center gap-2">
            <KeyRound className="size-5" />
            <h3 className="font-heading text-base font-bold">{t("credentials")}</h3>
          </div>
          <p className="mt-1 text-xs text-foreground/60">{t("credentialsNote")}</p>
          <div className="mt-4 flex flex-col gap-3">
            {order.credentials.map((c) => (
              <div key={c.email} className="rounded-base border-2 border-border bg-background p-4">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs text-foreground/50">Email</span>
                      <p className="truncate font-mono text-sm font-bold">{c.email}</p>
                    </div>
                    <CopyButton value={c.email} label="Email" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs text-foreground/50">Password</span>
                      <p className="truncate font-mono text-sm font-bold">{c.password}</p>
                    </div>
                    <CopyButton value={c.password} label="Password" />
                  </div>
                  {c.pin && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs text-foreground/50">PIN</span>
                        <p className="font-mono text-sm font-bold">{c.pin}</p>
                      </div>
                      <CopyButton value={c.pin} label="PIN" />
                    </div>
                  )}
                  <p className="border-t-2 border-dashed border-border pt-2 text-xs text-foreground/70">
                    {c.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function TrackView() {
  const t = useTranslations("track")
  const params = useSearchParams()
  const initial = params.get("inv") ?? ""
  const [input, setInput] = useState(initial)
  const [query, setQuery] = useState(initial)
  const mounted = useMounted()

  // User-created orders (checkout) live in a persisted store; seeded demo
  // orders come from the mock API. Check the local store first.
  const localOrder = usePurchasedOrders((s) =>
    query ? s.orders.find((o) => o.invoice.toLowerCase() === query.toLowerCase()) : undefined,
  )
  const { data: remoteOrder, isLoading, isFetched } = useOrder(query)
  const order = localOrder ?? remoteOrder

  return (
    <Container className="max-w-3xl py-12">
      <div className="text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow">
          <PackageSearch className="size-8" />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-foreground/70">{t("subtitle")}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(input.trim())
        }}
        className="mx-auto mt-8 flex max-w-md gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("placeholder")}
            className="pl-9 uppercase"
            aria-label={t("title")}
          />
        </div>
        <Button type="submit" disabled={!input.trim() || isLoading}>
          {isLoading ? "…" : t("button")}
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-foreground/50">{t("tryExample")}</p>

      {mounted && query && isFetched && !order && (
        <div className="mx-auto mt-8 max-w-md rounded-base border-2 border-dashed border-danger bg-danger/10 p-5 text-center text-sm font-bold text-danger">
          {t("notFound")}
        </div>
      )}

      {order && <OrderResult order={order} />}
    </Container>
  )
}
