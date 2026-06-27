"use client"

import { Clock, DollarSign, Package, ShoppingBag, TrendingUp, Users } from "lucide-react"
import { StatCard } from "@/components/admin/parts"
import { Skeleton } from "@/components/ui/skeleton"
import { bgFor } from "@/lib/accent"
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

  const maxTrend = Math.max(1, ...data.trend.map((d) => d.value))
  const credTotal = data.credentials.total || 1

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
          value={formatNumber(data.orderCount)}
          hint={`${data.pendingOrders} menunggu bayar`}
          icon={ShoppingBag}
          accent="bg-accent-cyan"
        />
        <StatCard
          label="Pelanggan"
          value={formatNumber(data.customerCount)}
          icon={Users}
          accent="bg-accent-pink"
        />
        <StatCard
          label="Produk Aktif"
          value={formatNumber(data.productCount)}
          icon={Package}
          accent="bg-accent-purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Revenue trend */}
        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold">Pendapatan 7 Hari</h2>
              <p className="text-sm text-foreground/60">Minggu ini</p>
            </div>
            <span className="flex items-center gap-1 rounded-base border-2 border-border bg-accent-lime px-2.5 py-1 text-xs font-bold shadow-shadow-sm">
              <TrendingUp className="size-3.5" /> +18%
            </span>
          </div>
          <div className="mt-6 flex h-52 items-end justify-between gap-2 sm:gap-3">
            {data.trend.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-foreground/50">
                  {formatIDR(d.value, { compact: true })}
                </span>
                <div
                  className="w-full rounded-base border-2 border-border bg-main transition-all hover:bg-accent-cyan"
                  style={{ height: `${(d.value / maxTrend) * 100}%` }}
                />
                <span className="text-xs font-bold text-foreground/60">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Credential stock + order status */}
        <div className="flex flex-col gap-6">
          <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <h2 className="font-heading text-lg font-bold">Stok Akun</h2>
            <div className="mt-4 flex flex-col gap-3">
              {[
                {
                  label: "Tersedia",
                  value: data.credentials.tersedia,
                  accent: "bg-success",
                },
                {
                  label: "Terjual",
                  value: data.credentials.terjual,
                  accent: "bg-main",
                },
                {
                  label: "Kadaluarsa",
                  value: data.credentials.kadaluarsa,
                  accent: "bg-danger",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-bold text-foreground/70">{row.label}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-border bg-background">
                    <div
                      className={cn("h-full", row.accent)}
                      style={{
                        width: `${(row.value / credTotal) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right font-heading text-sm font-bold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <div className="flex items-center gap-2">
              <Clock className="size-5" />
              <h2 className="font-heading text-lg font-bold">Status Pesanan</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-base border-2 border-border bg-warning/20 p-3">
                <p className="font-heading text-2xl font-extrabold">{data.pendingOrders}</p>
                <p className="text-xs font-bold text-foreground/60">Menunggu Bayar</p>
              </div>
              <div className="rounded-base border-2 border-border bg-success/20 p-3">
                <p className="font-heading text-2xl font-extrabold">{data.completedOrders}</p>
                <p className="text-xs font-bold text-foreground/60">Selesai</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <h2 className="font-heading text-lg font-bold">Produk Terlaris</h2>
        <div className="mt-4 flex flex-col gap-2">
          {data.topProducts.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center gap-3 rounded-base border-2 border-border bg-background p-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading text-xs font-extrabold">
                {i + 1}
              </span>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-base border-2 border-border text-xl",
                  bgFor(p.accent),
                )}
              >
                {p.logo}
              </span>
              <span className="flex-1 font-heading text-sm font-bold">{p.name}</span>
              <span className="text-sm font-bold text-foreground/60">
                {formatNumber(p.sold)} terjual
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
