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
import { useMemo, useState } from "react"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { resellerOrders, resellerPlans } from "@/lib/mock/enterprise"
import { cn, formatIDR, formatNumber } from "@/lib/utils"

const ORDER_STATUS = {
  paid: { label: "Dibayar", variant: "warning" },
  queued: { label: "Antrian", variant: "cyan" },
  delivered: { label: "Terkirim", variant: "success" },
} as const

export function ResellerPortalView() {
  const [topup, setTopup] = useState(1000000)
  const [monthlyOrders, setMonthlyOrders] = useState(80)

  const selectedPlan = useMemo(() => {
    return [...resellerPlans].reverse().find((plan) => topup >= plan.minTopup) ?? resellerPlans[0]
  }, [topup])

  const estimatedMargin = Math.round(monthlyOrders * 14500)
  const nextPlan = resellerPlans.find((plan) => topup < plan.minTopup)
  const nextProgress = nextPlan ? Math.min(100, (topup / nextPlan.minTopup) * 100) : 100

  return (
    <Container className="py-12">
      <SectionHeading
        eyebrow="B2B / RESELLER"
        title="Portal Reseller & Bulk Order"
        subtitle="UI untuk reseller, agency, dan pembelian banyak seat: harga grosir, topup saldo, margin, invoice, dan SLA pengiriman."
      />

      <div className="mt-8 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
        <div className="grid gap-6 border-b-2 border-border bg-main p-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Badge variant="neutral">Partner aktif</Badge>
            <h2 className="mt-3 font-heading text-3xl font-extrabold">{selectedPlan.name}</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold text-main-foreground/70">
              Saldo dan volume order menentukan tier reseller. Semua angka di sini mock untuk
              eksplorasi UI/UX sebelum backend dibuat.
            </p>
          </div>
          <div className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
            <p className="text-xs font-bold uppercase text-foreground/50">Estimasi margin/bulan</p>
            <p className="mt-1 font-heading text-3xl font-extrabold">
              {formatIDR(estimatedMargin)}
            </p>
            <p className="text-xs text-foreground/60">
              Simulasi {formatNumber(monthlyOrders)} order x margin rata-rata.
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-3">
            {resellerPlans.map((plan) => (
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
                <p className="text-xs text-foreground/60">Min. topup {formatIDR(plan.minTopup)}</p>
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
              <Calculator className="size-5" /> Kalkulator Reseller
            </h3>
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="topup">Saldo topup</Label>
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
                <Label htmlFor="orders">Order per bulan</Label>
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
                    <span>Menuju {nextPlan.name}</span>
                    <span>{Math.round(nextProgress)}%</span>
                  </div>
                  <Progress value={nextProgress} />
                  <p className="mt-2 text-xs text-foreground/60">
                    Tambah {formatIDR(nextPlan.minTopup - topup)} untuk naik tier.
                  </p>
                </div>
              ) : (
                <div className="rounded-base border-2 border-border bg-accent-lime p-3 text-sm font-bold">
                  Kamu sudah di tier tertinggi.
                </div>
              )}
              <Button>
                Ajukan Partnership <ArrowRight className="size-4" />
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <PartnerStat
          icon={Wallet}
          label="Saldo reseller"
          value={formatIDR(topup)}
          accent="bg-main"
        />
        <PartnerStat icon={Users} label="Seat dipesan" value="40" accent="bg-accent-cyan" />
        <PartnerStat icon={PackageCheck} label="SLA bulk" value="< 30m" accent="bg-accent-lime" />
        <PartnerStat
          icon={CreditCard}
          label="Invoice"
          value="White-label"
          accent="bg-accent-pink"
        />
      </div>

      <div className="mt-8 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-extrabold">Order reseller terbaru</h2>
            <p className="text-sm text-foreground/60">
              Mock antrian order besar yang nantinya bisa terhubung ke fulfillment.
            </p>
          </div>
          <Button variant="neutral">Unduh CSV</Button>
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
                {order.qty}x {order.product}
              </p>
              <p className="font-heading text-sm font-extrabold">{formatIDR(order.margin)}</p>
              <Badge variant={ORDER_STATUS[order.status].variant}>
                {ORDER_STATUS[order.status].label}
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
