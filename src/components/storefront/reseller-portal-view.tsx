"use client"

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  CreditCard,
  PackageCheck,
  Users,
  Wallet,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useResellerPortal } from "@/lib/api/queries"
import { cn, formatIDR, formatNumber } from "@/lib/utils"

const RESELLER_PLANS = [
  {
    id: "starter",
    name: "Starter Reseller",
    minTopup: 250000,
    discount: "8%",
    margin: "Rp5rb - Rp12rb / order",
    accent: "bg-accent-cyan",
    perks: ["Katalog reseller", "Harga grosir", "Kode referral reseller"],
  },
  {
    id: "pro",
    name: "Pro Agency",
    minTopup: 1000000,
    discount: "15%",
    margin: "Rp12rb - Rp30rb / order",
    accent: "bg-accent-purple",
    perks: ["Seat tim", "Prioritas stok", "Invoice white-label"],
  },
  {
    id: "enterprise",
    name: "Enterprise Partner",
    minTopup: 5000000,
    discount: "Custom",
    margin: "Margin kontrak",
    accent: "bg-accent-lime",
    perks: ["SLA khusus", "Bulk activation", "Account manager"],
  },
] as const

const ORDER_STATUS_KEY = {
  paid: "statusPaid",
  queued: "statusQueued",
  delivered: "statusDelivered",
} as const
const ORDER_STATUS_VARIANT = {
  paid: "warning",
  queued: "cyan",
  delivered: "success",
} as const

export function ResellerPortalView() {
  const t = useTranslations("resellerPortal")
  const { data: portalData } = useResellerPortal()
  const resellerOrders = (portalData?.orders ?? []) as any[]
  const [topup, setTopup] = useState(1000000)
  const [monthlyOrders, setMonthlyOrders] = useState(80)

  const selectedPlan = useMemo(() => {
    return [...RESELLER_PLANS].reverse().find((plan) => topup >= plan.minTopup) ?? RESELLER_PLANS[0]
  }, [topup])

  const estimatedMargin = Math.round(monthlyOrders * 14500)
  const nextPlan = RESELLER_PLANS.find((plan) => topup < plan.minTopup)
  const nextProgress = nextPlan ? Math.min(100, (topup / nextPlan.minTopup) * 100) : 100

  return (
    <Container className="py-12">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-8 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
        <div className="grid gap-6 border-b-2 border-border bg-main p-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Badge variant="neutral">{t("partnerActive")}</Badge>
            <h2 className="mt-3 font-heading text-3xl font-extrabold">{selectedPlan.name}</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold text-main-foreground/70">
              {t("planDesc")}
            </p>
          </div>
          <div className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
            <p className="text-xs font-bold uppercase text-foreground/50">{t("estMargin")}</p>
            <p className="mt-1 font-heading text-3xl font-extrabold">
              {formatIDR(estimatedMargin)}
            </p>
            <p className="text-xs text-foreground/60">
              {t("estMarginHint", { orders: formatNumber(monthlyOrders) })}
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-3">
            {RESELLER_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-base border-2 border-border bg-background p-4 shadow-shadow-sm",
                  plan.id === selectedPlan.id && "ring-4 ring-main/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                    plan.accent,
                  )}
                >
                  <Building2 className="size-5" />
                </span>
                <h3 className="mt-3 font-heading text-base font-extrabold">{plan.name}</h3>
                <p className="text-xs text-foreground/60">
                  {t("minTopup", { amount: formatIDR(plan.minTopup) })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="cyan">{plan.discount}</Badge>
                  <Badge variant="neutral">{plan.margin}</Badge>
                </div>
                <ul className="mt-4 flex flex-col gap-2 text-sm text-foreground/70">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <BadgeCheck className="size-4 text-success" /> {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <aside className="rounded-base border-2 border-border bg-background p-5 shadow-shadow-sm">
            <h3 className="flex items-center gap-2 font-heading text-lg font-extrabold">
              <Calculator className="size-5" /> {t("calcTitle")}
            </h3>
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="topup">{t("fieldTopup")}</Label>
                <Input
                  id="topup"
                  type="number"
                  min={0}
                  step={50000}
                  value={topup}
                  onChange={(event) => setTopup(Number(event.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="orders">{t("fieldOrders")}</Label>
                <Input
                  id="orders"
                  type="number"
                  min={1}
                  value={monthlyOrders}
                  onChange={(event) => setMonthlyOrders(Number(event.target.value))}
                  className="mt-1.5"
                />
              </div>
              {nextPlan ? (
                <div>
                  <div className="mb-2 flex justify-between gap-2 text-xs font-bold">
                    <span>{t("progressTo", { name: nextPlan.name })}</span>
                    <span>{Math.round(nextProgress)}%</span>
                  </div>
                  <Progress value={nextProgress} />
                  <p className="mt-2 text-xs text-foreground/60">
                    {t("progressHint", { amount: formatIDR(nextPlan.minTopup - topup) })}
                  </p>
                </div>
              ) : (
                <div className="rounded-base border-2 border-border bg-accent-lime p-3 text-sm font-bold">
                  {t("topTier")}
                </div>
              )}
              <Button>
                {t("applyPartner")} <ArrowRight className="size-4" />
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <PartnerStat
          icon={Wallet}
          label={t("statBalance")}
          value={formatIDR(topup)}
          accent="bg-main"
        />
        <PartnerStat icon={Users} label={t("statSeats")} value="40" accent="bg-accent-cyan" />
        <PartnerStat
          icon={PackageCheck}
          label={t("statSla")}
          value="< 30m"
          accent="bg-accent-lime"
        />
        <PartnerStat
          icon={CreditCard}
          label={t("statInvoice")}
          value="White-label"
          accent="bg-accent-pink"
        />
      </div>

      <div className="mt-8 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-extrabold">{t("ordersTitle")}</h2>
            <p className="text-sm text-foreground/60">{t("ordersDesc")}</p>
          </div>
          <Button variant="neutral">{t("downloadCsv")}</Button>
        </div>
        <div className="mt-4 grid gap-3">
          {resellerOrders.map((order) => (
            <div
              key={order.id}
              className="grid gap-3 rounded-base border-2 border-border bg-background p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-center"
            >
              <div>
                <p className="font-heading text-sm font-extrabold">{order.buyer}</p>
                <p className="text-xs text-foreground/60">{order.id}</p>
              </div>
              <p className="text-sm font-bold text-foreground/70">
                {t("orderQty", { qty: order.qty, product: order.product })}
              </p>
              <p className="font-heading text-sm font-extrabold">{formatIDR(order.margin)}</p>
              <Badge variant={ORDER_STATUS_VARIANT[order.status as keyof typeof ORDER_STATUS_VARIANT]}>
                {t(ORDER_STATUS_KEY[order.status as keyof typeof ORDER_STATUS_KEY])}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}

function PartnerStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Wallet
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
          accent,
        )}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-foreground/50">{label}</p>
      <p className="truncate font-heading text-lg font-extrabold">{value}</p>
    </div>
  )
}
