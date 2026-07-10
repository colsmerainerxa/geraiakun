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
import { useDashboardStats } from "@/lib/api/queries"
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
  const { data: stats, isLoading } = useDashboardStats()

  // Map server stats to the metric cards
  const metrics = useMemo(() => {
    if (!stats) return []
    return [
      { label: "Revenue", value: formatIDR(stats.revenue, { compact: true }), delta: "Total", tone: "lime" as const },
      { label: "Orders (30d)", value: formatNumber(stats.orders), delta: "Last 30 days", tone: "cyan" as const },
      { label: "Customers", value: formatNumber(stats.customers), delta: "Total", tone: "pink" as const },
      { label: "Open Tickets", value: formatNumber(stats.tickets), delta: "Active", tone: "purple" as const },
    ]
  }, [stats])

  // Map revenueByDay to chart series
  const series = useMemo(() => {
    if (!stats?.revenueByDay) return []
    const data = rangePreset === "7d" ? stats.revenueByDay.slice(-7) : stats.revenueByDay
    return data.map((item) => ({
      day: item.date.slice(5), // MM-DD
      value: item.value,
    }))
  }, [stats, rangePreset])
  const maxRevenue = Math.max(...series.map((item) => item.value), 1)

  // Map salesByProduct to segment table
  const filteredSegments = useMemo(() => {
    if (!stats?.salesByProduct) return []
    const segments = stats.salesByProduct.map((item, i) => ({
      id: `product-${i}`,
      name: item.name,
      customers: item.qty,
      revenue: item.revenue,
      conversion: 0,
      signal: `${item.qty} unit terjual`,
      action: item.revenue > 0 ? "Tawarkan bundle" : "Evaluasi",
    }))
    if (focus === "Semua") return segments
    const q = focus.toLowerCase()
    return segments.filter(
      (segment) =>
        segment.action.toLowerCase().includes(q) ||
        segment.name.toLowerCase().includes(q) ||
        segment.signal.toLowerCase().includes(q),
    )
  }, [stats, focus])

  // Payment distribution for funnel visualization
  const paymentFunnel = useMemo(() => {
    if (!stats?.paymentDistribution?.length) {
      return [
        { label: "Product view", value: 100, count: "—" },
        { label: "Add to cart", value: 42, count: "—" },
        { label: "Checkout", value: 19, count: "—" },
        { label: "Paid", value: 8, count: "—" },
      ]
    }
    const total = stats.paymentDistribution.reduce((sum, p) => sum + p.count, 0) || 1
    return stats.paymentDistribution.map((p, i) => ({
      label: p.method,
      value: Math.round((p.count / total) * 100),
      count: formatNumber(p.count),
    }))
  }, [stats])

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <p className="text-sm text-foreground/60">Memuat analytics...</p>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-extrabold">Analytics & Segmentasi</h2>
          <p className="text-sm text-foreground/60">
            Dashboard real-time untuk GMV, product sales, dan payment distribution.
          </p>
        </div>
        <Button variant="neutral">
          <Download className="size-4" /> Export Report
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
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
              <p className="text-sm text-foreground/60">Revenue 30 hari terakhir.</p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeFilter value={rangePreset} onChange={setRangePreset} />
            </div>
          </div>
          <div className="mt-6 flex h-64 items-end justify-between gap-1">
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
            <PieChart className="size-5" /> Distribusi Pembayaran
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {paymentFunnel.map((step) => (
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
            <p className="font-heading font-bold">Fulfillment Performance</p>
            <p className="text-foreground/60">
              Avg SLA: {stats?.fulfillmentPerformance?.avgSla ?? 0} menit ·{" "}
              {stats?.fulfillmentPerformance?.totalTasks ?? 0} task selesai
            </p>
          </div>
        </section>
      </div>

      <section className="min-w-0 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
              <Users className="size-5" /> Sales by Product
            </h2>
            <p className="text-sm text-foreground/60">
              Top 10 produk berdasarkan revenue.
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
                <TableHead>Produk</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Revenue</TableHead>
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
