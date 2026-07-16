"use client"

import {
  ClipboardList,
  Clock,
  DollarSign,
  Package,
  Send,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react"
import { StatCard } from "@/components/admin/parts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from "@/i18n/navigation"
import { useDashboardStats } from "@/lib/api/queries"
import { cn, formatIDR, formatNumber } from "@/lib/utils"

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboardStats()

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  const maxTrend = Math.max(1, ...data.revenueByDay.map((d) => d.value))

  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pendapatan"
          value={formatIDR(data.revenue, { compact: true })}
          hint={`${formatIDR(data.revenue)}`}
          icon={DollarSign}
          accent="bg-accent-lime"
        />
        <StatCard
          label="Total Pesanan"
          value={formatNumber(data.orders)}
          hint="30 hari terakhir"
          icon={ShoppingBag}
          accent="bg-accent-cyan"
        />
        <StatCard
          label="Pelanggan"
          value={formatNumber(data.customers)}
          icon={Users}
          accent="bg-accent-pink"
        />
        <StatCard
          label="Tiket Aktif"
          value={formatNumber(data.tickets)}
          icon={Package}
          accent="bg-accent-purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Revenue trend */}
        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold">Pendapatan 30 Hari</h2>
              <p className="text-sm text-foreground/60">Berdasarkan pesanan selesai</p>
            </div>
            <span className="flex items-center gap-1 rounded-base border-2 border-border bg-accent-lime px-2.5 py-1 text-xs font-bold shadow-shadow-sm">
              <TrendingUp className="size-3.5" /> {data.revenueByDay.length} hari
            </span>
          </div>
          <div className="mt-6 flex h-52 items-end justify-between gap-1 sm:gap-2">
            {data.revenueByDay.slice(-14).map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-foreground/60">
                  {formatIDR(d.value, { compact: true })}
                </span>
                <div
                  className="w-full rounded-base border-2 border-border bg-main transition-all hover:bg-accent-cyan"
                  style={{ height: `${(d.value / maxTrend) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-[9px] font-bold text-foreground/60">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment performance + payment distribution */}
        <div className="flex flex-col gap-6">
          <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <div className="flex items-center gap-2">
              <Clock className="size-5" />
              <h2 className="font-heading text-lg font-bold">Performa Fulfillment</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-base border-2 border-border bg-accent-lime/20 p-3">
                <p className="font-heading text-2xl font-extrabold">
                  {formatNumber(data.fulfillmentPerformance.totalTasks)}
                </p>
                <p className="text-xs font-bold text-foreground/60">Total Terkirim</p>
              </div>
              <div className="rounded-base border-2 border-border bg-accent-cyan/20 p-3">
                <p className="font-heading text-2xl font-extrabold">
                  {data.fulfillmentPerformance.avgSla}m
                </p>
                <p className="text-xs font-bold text-foreground/60">Rata-rata SLA</p>
              </div>
            </div>
          </div>

          <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <h2 className="font-heading text-lg font-bold">Distribusi Pembayaran</h2>
            <div className="mt-4 flex flex-col gap-2">
              {data.paymentDistribution.length === 0 && (
                <p className="text-sm text-foreground/60">Belum ada data pembayaran.</p>
              )}
              {data.paymentDistribution.map((p) => {
                const total = data.paymentDistribution.reduce((s, x) => s + x.count, 0) || 1
                return (
                  <div key={p.method} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-bold text-foreground/70">
                      {p.method}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-border bg-background">
                      <div
                        className="h-full bg-main"
                        style={{ width: `${(p.count / total) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-heading text-sm font-bold">
                      {p.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <h2 className="font-heading text-lg font-bold">Produk Terlaris</h2>
        <div className="mt-4 flex flex-col gap-2">
          {data.salesByProduct.length === 0 && (
            <p className="text-sm text-foreground/60">Belum ada penjualan.</p>
          )}
          {data.salesByProduct.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center gap-3 rounded-base border-2 border-border bg-background p-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading text-xs font-extrabold">
                {i + 1}
              </span>
              <span className="flex-1 font-heading text-sm font-bold">{p.name}</span>
              <span className="text-sm font-bold text-foreground/60">
                {formatNumber(p.qty)} terjual
              </span>
              <span className="text-sm font-bold text-foreground/80">
                {formatIDR(p.revenue, { compact: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
