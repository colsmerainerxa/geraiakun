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
import { AchievementsPanel } from "@/components/admin/achievements-panel"
import { StatCard } from "@/components/admin/parts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { useDashboardStats } from "@/lib/api/queries"
import { fulfillmentTasks } from "@/lib/mock/enterprise"
import { cn, formatIDR, formatNumber } from "@/lib/utils"
import { useEnterpriseAdmin } from "@/stores/enterprise-admin"

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboardStats()
  // Hooks must run before any early return, or the rules-of-hooks are broken
  // when the loading skeleton resolves to the real dashboard.
  const activeStaffId = useEnterpriseAdmin((s) => s.activeStaffId)
  const staff = useEnterpriseAdmin((s) => s.staff)

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

  // "Your queue" � fulfillment tasks waiting on the active staff member.
  const activeStaff = staff.find((m) => m.id === activeStaffId) ?? staff[0]
  const myQueue = fulfillmentTasks
    .filter((t) => t.status === "siap-kirim" || t.status === "menunggu-stok")
    .slice(0, 5)

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

      {/* Your queue � fulfillment tasks waiting on the active staff */}
      <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            <h2 className="font-heading text-lg font-bold">Antrian Kamu</h2>
          </div>
          <Badge variant="warning">{myQueue.length} perlu tindakan</Badge>
        </div>
        <p className="mt-1 text-sm text-foreground/60">
          {activeStaff ? `Halo, ${activeStaff.name} � ` : ""}tugas fulfillment yang menunggu kamu.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {myQueue.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-base border-2 border-border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold">{task.invoice}</p>
                <p className="truncate text-xs text-foreground/60">
                  {task.productName} � {task.customer}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-base border-2 border-border px-2 py-1 text-xs font-bold",
                    task.slaMinutes <= 5 ? "bg-accent-lime" : "bg-warning",
                  )}
                >
                  <Clock className="size-3.5" />
                  {task.slaMinutes === 0 ? "done" : `${task.slaMinutes}m`}
                </span>
                {task.status === "siap-kirim" ? (
                  <Badge variant="cyan">
                    <Send className="size-3" /> Siap Kirim
                  </Badge>
                ) : (
                  <Badge variant="warning">Menunggu Stok</Badge>
                )}
              </div>
            </li>
          ))}
          {myQueue.length === 0 && (
            <li className="rounded-base border-2 border-dashed border-border p-4 text-center text-sm text-foreground/50">
              Antrian kosong � semua tugas selesai. 🎉
            </li>
          )}
        </ul>
        <Button variant="neutral" size="sm" asChild className="mt-4">
          <Link href="/admin/fulfillment">Buka Fulfillment</Link>
        </Button>
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

      {/* Gamification */}
      <AchievementsPanel />
    </div>
  )
}
