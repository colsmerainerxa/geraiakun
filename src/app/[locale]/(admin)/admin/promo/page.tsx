"use client"

import { Ticket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { usePromos } from "@/lib/api/queries"
import { cn, formatDate, formatIDR } from "@/lib/utils"
import { useAdminOverlay } from "@/stores/admin-overlay"

export default function AdminPromoPage() {
  const { data: promos, isLoading } = usePromos()
  const overlay = useAdminOverlay((s) => s.promoActive)
  const setPromoActive = useAdminOverlay((s) => s.setPromoActive)

  if (isLoading || !promos) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {promos.map((p) => {
        const pct =
          p.quota > 0 ? Math.min(100, Math.round((p.used / p.quota) * 100)) : 0
        const active = overlay[p.id] ?? p.active
        return (
          <div
            key={p.id}
            className={cn(
              "flex flex-col rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow",
              !active && "opacity-70",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-10 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm">
                <Ticket className="size-5" />
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={active ? "success" : "neutral"}>
                  {active ? "Aktif" : "Nonaktif"}
                </Badge>
                <Switch
                  checked={active}
                  onCheckedChange={(v) => setPromoActive(p.id, v)}
                  aria-label={`Toggle ${p.code}`}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <code className="rounded-base border-2 border-dashed border-border bg-background px-2 py-0.5 font-heading text-sm font-extrabold tracking-wide">
                {p.code}
              </code>
              <span className="font-heading text-sm font-bold text-accent-pink">
                {p.type === "persen" ? `${p.value}%` : formatIDR(p.value)}
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground/70">{p.description}</p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/50">
              <span>Min. {formatIDR(p.minSpend)}</span>
              {p.maxDiscount && <span>Maks. {formatIDR(p.maxDiscount)}</span>}
              <span>Exp. {formatDate(p.expiresAt)}</span>
            </div>

            {/* Usage */}
            <div className="mt-auto pt-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-foreground/60">Terpakai</span>
                <span>
                  {p.used} / {p.quota}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border-2 border-border bg-background">
                <div
                  className={cn(
                    "h-full",
                    pct >= 100 ? "bg-danger" : "bg-accent-lime",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
