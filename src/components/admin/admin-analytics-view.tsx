"use client"

import {
  BarChart3,
  Download,
  LineChart,
  Megaphone,
  PieChart,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DateRangeFilter, type DateRangePreset } from "@/components/ui/date-range-filter"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { analyticsMetrics, customerSegments, revenueSeries } from "@/lib/mock/enterprise"
import { cn, formatIDR, formatNumber } from "@/lib/utils"

const METRIC_TONE = {
  lime: "bg-accent-lime",
  cyan: "bg-accent-cyan",
  pink: "bg-accent-pink",
  purple: "bg-accent-purple",
}

const segmentActions = ["Semua", "Beli lagi", "Reseller", "Retention", "First purchase"] as const

export function AdminAnalyticsView() {
  const [focus, setFocus] = useState<(typeof segmentActions)[number]>("Semua")
  const [rangePreset, setRangePreset] = useState<DateRangePreset>("30d")
  const series = rangePreset === "7d" ? revenueSeries.slice(-7) : revenueSeries
  const maxRevenue = Math.max(...series.map((item) => item.value))

  const filteredSegments = useMemo(() => {
    if (focus === "Semua") return customerSegments
    const q = focus.toLowerCase()
    return customerSegments.filter(
      (segment) =>
        segment.action.toLowerCase().includes(q) ||
        segment.name.toLowerCase().includes(q) ||
        segment.signal.toLowerCase().includes(q),
    )
  }, [focus])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-extrabold">Analytics & Segmentasi</h2>
          <p className="text-sm text-foreground/60">
            Dashboard mock untuk GMV, cohort, customer segment, dan aksi CRM.
          </p>
        </div>
        <Button variant="neutral">
          <Download className="size-4" /> Export Report
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analyticsMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">
                  {metric.label}
                </p>
                <p className="mt-1 font-heading text-2xl font-extrabold">{metric.value}</p>
              </div>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                  METRIC_TONE[metric.tone],
                )}
              >
                <TrendingUp className="size-5" />
              </span>
            </div>
            <Badge variant="neutral" className="mt-4">
              {metric.delta}
            </Badge>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
        <section className="min-w-0 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
                <LineChart className="size-5" /> Tren Pendapatan
              </h2>
              <p className="text-sm text-foreground/60">Visualisasi ringan tanpa library chart.</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeFilter value={rangePreset} onChange={setRangePreset} />
              <Badge variant="lime">+18% WoW</Badge>
            </div>
          </div>
          <div className="mt-6 flex h-64 items-end justify-between gap-3">
            {series.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-foreground/50">
                  {formatIDR(item.value, { compact: true })}
                </span>
                <div
                  className="w-full rounded-base border-2 border-border bg-main transition-all hover:bg-accent-cyan"
                  style={{ height: `${(item.value / maxRevenue) * 100}%` }}
                />
                <span className="text-xs font-heading font-bold">{item.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
            <PieChart className="size-5" /> Funnel Checkout
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {[
              { label: "Product view", value: 100, count: "18.420" },
              { label: "Add to cart", value: 42, count: "7.736" },
              { label: "Checkout", value: 19, count: "3.500" },
              { label: "Paid", value: 8, count: "1.474" },
            ].map((step) => (
              <div key={step.label}>
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span>{step.label}</span>
                  <span>{step.count}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full border-2 border-border bg-background">
                  <div className="h-full bg-accent-lime" style={{ width: `${step.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-base border-2 border-dashed border-border bg-background p-3 text-sm">
            <p className="font-heading font-bold">Insight UI</p>
            <p className="text-foreground/60">
              Drop terbesar ada di checkout. Rekomendasi: tampilkan status pembayaran, trust badge,
              dan metode bayar favorit lebih awal.
            </p>
          </div>
        </section>
      </div>

      <section className="min-w-0 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
              <Users className="size-5" /> Segmentasi Pelanggan
            </h2>
            <p className="text-sm text-foreground/60">
              Segment berbasis sinyal belanja untuk campaign dan prioritas CS.
            </p>
          </div>
          <Select value={focus} onValueChange={(value) => setFocus(value as typeof focus)}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {segmentActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Rekomendasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSegments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-accent-cyan shadow-shadow-sm">
                        <UserCheck className="size-4" />
                      </span>
                      <div>
                        <p className="font-heading text-sm font-extrabold">{segment.name}</p>
                        <p className="max-w-sm text-xs text-foreground/60">{segment.signal}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{formatNumber(segment.customers)}</TableCell>
                  <TableCell className="font-bold">
                    {formatIDR(segment.revenue, { compact: true })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={segment.conversion >= 15 ? "lime" : "warning"}>
                      {segment.conversion}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-sm items-start gap-2 text-sm text-foreground/70">
                      <Megaphone className="mt-0.5 size-4 shrink-0" />
                      {segment.action}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: BarChart3,
            title: "Cohort retention",
            body: "UI siap untuk cohort 7/14/30 hari saat backend event tracking tersedia.",
            accent: "bg-accent-purple",
          },
          {
            icon: Users,
            title: "CRM action list",
            body: "Segment bisa berubah menjadi task campaign WhatsApp, email, atau voucher.",
            accent: "bg-accent-pink",
          },
          {
            icon: TrendingUp,
            title: "Commerce health",
            body: "Gabungkan conversion, refund ratio, dan fulfillment SLA dalam satu cockpit.",
            accent: "bg-accent-lime",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow-sm"
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                item.accent,
              )}
            >
              <item.icon className="size-5" />
            </span>
            <h3 className="mt-3 font-heading text-base font-extrabold">{item.title}</h3>
            <p className="mt-1 text-sm text-foreground/60">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
