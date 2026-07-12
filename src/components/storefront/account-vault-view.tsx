"use client"

import {
  Activity,
  CalendarClock,
  Copy,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { useVault } from "@/lib/api/queries"
import { cn, formatDate, formatIDR, formatNumber } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import { useUI } from "@/stores/ui"
import type { VaultAccountStatus } from "@/types"

const VAULT_ACTIVITIES = [
  {
    id: "act-1",
    title: "Credential rotated",
    body: "Password ChatGPT Plus diperbarui oleh tim fulfillment.",
    date: "2026-06-27T09:15:00",
    tone: "lime",
  },
  {
    id: "act-2",
    title: "Pengingat masa aktif",
    body: "Gemini Pro berakhir dalam 5 hari dan siap dibeli kembali.",
    date: "2026-06-26T16:20:00",
    tone: "warning",
  },
  {
    id: "act-3",
    title: "Warranty check",
    body: "Health check API Key selesai tanpa error login.",
    date: "2026-06-25T10:00:00",
    tone: "cyan",
  },
] as const

const STATUS_KEY: Record<VaultAccountStatus, string> = {
  aktif: "statusActive",
  "akan-habis": "statusExpiring",
  ditahan: "statusHeld",
  bermasalah: "statusIssue",
}
const STATUS_VARIANT: Record<VaultAccountStatus, "success" | "warning" | "neutral" | "danger"> = {
  aktif: "success",
  "akan-habis": "warning",
  ditahan: "neutral",
  bermasalah: "danger",
}
const STATUS_TONE: Record<VaultAccountStatus, string> = {
  aktif: "bg-accent-lime",
  "akan-habis": "bg-warning",
  ditahan: "bg-accent-purple",
  bermasalah: "bg-danger",
}

const ACTIVITY_TONE = {
  lime: "bg-accent-lime",
  cyan: "bg-accent-cyan",
  pink: "bg-accent-pink",
  warning: "bg-warning",
}

export function AccountVaultView() {
  const t = useTranslations("vault")
  const addItem = useCart((state) => state.addItem)
  const setCartOpen = useUI((state) => state.setCartOpen)
  const { data: vaultAccounts = [] } = useVault()
  const vaultAccountsTyped = vaultAccounts as any[]
  const [selectedId, setSelectedId] = useState(vaultAccountsTyped[0]?.id ?? "")
  const selected = vaultAccountsTyped.find((account) => account.id === selectedId) ?? vaultAccountsTyped[0]
  const expiring = vaultAccountsTyped.filter((account) => account.status === "akan-habis").length
  const reorderEstimate = vaultAccountsTyped
    .filter((account) => account.status === "akan-habis")
    .reduce((sum, account) => sum + account.reorderPrice, 0)
  const averageHealth = vaultAccountsTyped.length
    ? Math.round(
        vaultAccountsTyped.reduce((sum, account) => sum + account.healthScore, 0) / vaultAccountsTyped.length,
      )
    : 0

  function statusMeta(status: VaultAccountStatus) {
    return {
      label: t(STATUS_KEY[status]),
      variant: STATUS_VARIANT[status],
      tone: STATUS_TONE[status],
    }
  }

  function copyLogin(email: string) {
    navigator.clipboard?.writeText(email)
    toast.success(t("toastLoginCopied"))
  }

  function reorder() {
    if (!selected) return
    // Fetch product data from API via React Query hook is not possible inside callback.
    // Use direct fetch to catalog API.
    fetch(`/api/catalog/products/${selected.productSlug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((product) => {
        if (!product) {
          toast.error(t("toastReorderError"))
          return
        }
        const variant = product.variants?.find((item: { id: string }) => item.id === selected.variantId)
        if (!variant) {
          toast.error(t("toastReorderError"))
          return
        }
        addItem({
          productId: product.id,
          productName: product.name,
          productLogo: product.logo,
          productSlug: product.slug,
          variantId: variant.id,
          variantLabel: variant.label,
          price: variant.price,
          qty: 1,
          accent: product.accent,
        })
        toast.success(t("toastReorderAdded", { name: product.name }))
        setCartOpen(true)
      })
      .catch(() => toast.error(t("toastReorderError")))
  }

  return (
    <Container className="py-12">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button asChild variant="neutral">
            <Link href="/akun">{t("backToAccount")}</Link>
          </Button>
        }
      />

      {expiring > 0 && (
        <div className="mt-6 flex flex-col gap-2 rounded-base border-2 border-warning bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-warning shadow-shadow-sm">
              <CalendarClock className="size-5" />
            </span>
            <div>
              <p className="font-heading text-sm font-extrabold">
                {t("expiryAlertTitle", { count: expiring })}
              </p>
              <p className="text-xs text-foreground/70">{t("expiryAlertDesc")}</p>
            </div>
          </div>
          <Button variant="neutral" size="sm" asChild className="shrink-0">
            <Link href="/katalog">{t("expiryAlertCta")}</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <VaultStat
          icon={KeyRound}
          label={t("statActive")}
          value={formatNumber(vaultAccountsTyped.length)}
          accent="bg-accent-cyan"
        />
        <VaultStat
          icon={CalendarClock}
          label={t("statExpiring")}
          value={formatNumber(expiring)}
          accent="bg-warning"
        />
        <VaultStat
          icon={ShieldCheck}
          label={t("statHealth")}
          value={`${averageHealth}%`}
          accent="bg-accent-lime"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="flex flex-col gap-3">
          <div className="rounded-base border-2 border-border bg-main p-4 shadow-shadow">
            <p className="text-xs font-heading font-extrabold uppercase text-main-foreground/70">
              {t("reorderEstimate")}
            </p>
            <p className="mt-1 font-heading text-2xl font-extrabold">
              {formatIDR(reorderEstimate)}
            </p>
            <p className="text-xs font-bold text-main-foreground/70">{t("reorderEstimateHint")}</p>
          </div>

          {vaultAccountsTyped.map((account) => {
            const meta = statusMeta(account.status)
            const active = selected?.id === account.id
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedId(account.id)}
                className={cn(
                  "rounded-base border-2 border-border bg-secondary-background p-4 text-left shadow-shadow-sm transition-all hover:-translate-y-0.5",
                  active && "ring-4 ring-main/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-extrabold">
                      {account.productName}
                    </p>
                    <p className="truncate text-xs font-bold text-foreground/60">{account.plan}</p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-foreground/60">
                  <CalendarClock className="size-3.5" />
                  {t("expiresOn", { date: formatDate(account.expiresAt) })}
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-border bg-background">
                  <div
                    className={cn("h-full", meta.tone)}
                    style={{ width: `${account.healthScore}%` }}
                  />
                </div>
              </button>
            )
          })}
        </section>

        {selected && (
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-border bg-accent-cyan p-6">
                <div>
                  <Badge variant={statusMeta(selected.status).variant}>
                    {statusMeta(selected.status).label}
                  </Badge>
                  <h2 className="mt-2 font-heading text-2xl font-extrabold">
                    {selected.productName}
                  </h2>
                  <p className="text-sm font-bold text-foreground/70">{selected.plan}</p>
                </div>
                <Button variant="neutral" onClick={() => copyLogin(selected.loginEmail)}>
                  <Copy className="size-4" /> {t("copyLogin")}
                </Button>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <InfoTile
                  icon={LockKeyhole}
                  label={t("infoLoginEmail")}
                  value={selected.loginEmail}
                  mono
                />
                <InfoTile
                  icon={ShoppingCart}
                  label={t("infoReorderPrice")}
                  value={formatIDR(selected.reorderPrice)}
                />
                <InfoTile
                  icon={ShieldCheck}
                  label={t("infoWarrantyUntil")}
                  value={formatDate(selected.warrantyUntil)}
                />
                <InfoTile
                  icon={Smartphone}
                  label={t("infoSeats")}
                  value={t("seatsValue", { seats: selected.seats, devices: selected.devices })}
                />
              </div>

              <div className="border-t-2 border-dashed border-border p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-sm font-extrabold">{t("healthScore")}</p>
                    <p className="text-xs text-foreground/60">{selected.note}</p>
                  </div>
                  <span className="font-heading text-2xl font-extrabold">
                    {selected.healthScore}%
                  </span>
                </div>
                <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-border bg-background">
                  <div
                    className="h-full bg-accent-lime"
                    style={{ width: `${selected.healthScore}%` }}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={reorder}>
                    <ShoppingCart className="size-4" /> {t("reorder")}
                  </Button>
                  <Button asChild variant="neutral">
                    <Link href={`/refund?invoice=${selected.orderInvoice}`}>{t("raiseIssue")}</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
              <h3 className="flex items-center gap-2 font-heading text-lg font-extrabold">
                <Activity className="size-5" /> {t("activityTitle")}
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                {VAULT_ACTIVITIES.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                        ACTIVITY_TONE[activity.tone],
                      )}
                    >
                      <Activity className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-bold">{activity.title}</p>
                      <p className="text-sm text-foreground/70">{activity.body}</p>
                      <p className="mt-1 text-xs text-foreground/60">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </Container>
  )
}

function VaultStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof KeyRound
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
          accent,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">{label}</p>
        <p className="font-heading text-xl font-extrabold">{value}</p>
      </div>
    </div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof KeyRound
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-base border-2 border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground/60">
        <Icon className="size-4" /> {label}
      </div>
      <p className={cn("mt-2 truncate font-heading text-sm font-extrabold", mono && "font-mono")}>
        {value}
      </p>
    </div>
  )
}
