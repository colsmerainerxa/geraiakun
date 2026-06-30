"use client"

import { MessageCircleQuestion, ShieldCheck, ShoppingBag, Wallet } from "lucide-react"
import { OrderStatusBadge, StatCard } from "@/components/admin/parts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useOrders } from "@/lib/api/queries"
import { cn, formatDate, formatIDR, initials } from "@/lib/utils"
import { useTickets } from "@/stores/tickets"
import type { Customer, TicketStatus } from "@/types"

const TICKET_STATUS: Record<
  TicketStatus,
  { label: string; variant: "warning" | "cyan" | "neutral" | "success" | "danger" }
> = {
  baru: { label: "Baru", variant: "warning" },
  ditinjau: { label: "Ditinjau", variant: "cyan" },
  diproses: { label: "Diproses", variant: "neutral" },
  selesai: { label: "Selesai", variant: "success" },
  ditolak: { label: "Ditolak", variant: "danger" },
}

// Mock risk heuristic � real backend would score fraud/chargeback history.
function riskFor(orderCount: number, ticketCount: number) {
  if (ticketCount >= 3) return { label: "Sedang", variant: "warning" as const }
  if (orderCount === 0) return { label: "Baru", variant: "cyan" as const }
  return { label: "Rendah", variant: "success" as const }
}

export function Customer360Drawer({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: orders } = useOrders()
  const tickets = useTickets((s) => s.tickets)

  if (!customer) return null

  const custOrders = (orders ?? [])
    .filter((o) => o.customerEmail.toLowerCase() === customer.email.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const custTickets = tickets
    .filter((t) => t.customerEmail?.toLowerCase() === customer.email.toLowerCase())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const openTickets = custTickets.filter(
    (t) => t.status === "baru" || t.status === "ditinjau",
  ).length
  const risk = riskFor(customer.orderCount, custTickets.length)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="gap-3">
          <SheetTitle className="sr-only">Detail pelanggan {customer.name}</SheetTitle>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback>{initials(customer.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-extrabold">{customer.name}</h2>
              <p className="truncate text-xs text-foreground/60">{customer.email}</p>
            </div>
            <Badge
              variant={
                customer.status === "vip"
                  ? "purple"
                  : customer.status === "aktif"
                    ? "success"
                    : "cyan"
              }
              className="ml-auto"
            >
              {customer.status.toUpperCase()}
            </Badge>
          </div>
        </SheetHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="LTV (Total Belanja)"
            value={formatIDR(customer.totalSpent, { compact: true })}
            hint={formatIDR(customer.totalSpent)}
            icon={Wallet}
            accent="bg-accent-lime"
          />
          <StatCard
            label="Total Pesanan"
            value={customer.orderCount}
            icon={ShoppingBag}
            accent="bg-accent-cyan"
          />
          <StatCard
            label="Tiket Terbuka"
            value={openTickets}
            icon={MessageCircleQuestion}
            accent="bg-warning"
          />
          <StatCard
            label="Skor Risiko"
            value={risk.label}
            icon={ShieldCheck}
            accent={
              risk.variant === "success"
                ? "bg-success"
                : risk.variant === "warning"
                  ? "bg-warning"
                  : "bg-accent-cyan"
            }
          />
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="font-heading text-sm font-extrabold uppercase text-foreground/50">
            Pesanan terbaru
          </h3>
          {custOrders.length === 0 ? (
            <p className="rounded-base border-2 border-dashed border-border p-4 text-center text-sm text-foreground/50">
              Belum ada pesanan.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {custOrders.slice(0, 6).map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-base border-2 border-border bg-secondary-background p-3"
                >
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold">{o.invoice}</p>
                    <p className="truncate text-xs text-foreground/60">
                      {o.items.map((it) => it.productName).join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-heading text-sm font-extrabold">
                      {formatIDR(o.total)}
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-heading text-sm font-extrabold uppercase text-foreground/50">
            Tiket bantuan
          </h3>
          {custTickets.length === 0 ? (
            <p className="rounded-base border-2 border-dashed border-border p-4 text-center text-sm text-foreground/50">
              Tidak ada tiket.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {custTickets.slice(0, 6).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-base border-2 border-border bg-secondary-background p-3"
                >
                  <div className="min-w-0">
                    <p className="font-heading text-xs font-extrabold text-foreground/50">
                      {t.code}
                    </p>
                    <p className="truncate text-sm font-bold">{t.subject}</p>
                    <p className="text-xs text-foreground/50">{formatDate(t.updatedAt)}</p>
                  </div>
                  <Badge variant={TICKET_STATUS[t.status].variant} className="shrink-0">
                    {TICKET_STATUS[t.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div
          className={cn(
            "rounded-base border-2 border-border bg-background p-3 text-xs text-foreground/60",
          )}
        >
          <p className="font-bold text-foreground">Kontak</p>
          <p>WhatsApp: {customer.whatsapp}</p>
          <p>Bergabung: {formatDate(customer.joinedAt)}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
