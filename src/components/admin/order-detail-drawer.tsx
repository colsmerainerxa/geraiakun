"use client"

import { Download, Mail, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { OrderStatusBadge, paymentLabel } from "@/components/admin/parts"
import { formatDate, formatIDR } from "@/lib/utils"
import type { Order } from "@/types"

export function OrderDetailDrawer({
  order,
  open,
  onOpenChange,
}: {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!order) return null

  const invoice = order.invoice
  function reDownload(credential: { email: string; password: string; note: string }) {
    const blob = `Login beliakun\nEmail: ${credential.email}\nPassword: ${credential.password}\n${credential.note ? `Catatan: ${credential.note}\n` : ""}Invoice: ${invoice}`
    navigator.clipboard?.writeText(blob).catch(() => {})
    toast.success(`Credential ${credential.email} disalin ke clipboard.`, {
      description: `Invoice ${invoice}`,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="gap-3">
          <SheetTitle className="sr-only">Detail pesanan {order.invoice}</SheetTitle>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-extrabold">{order.invoice}</h2>
              <p className="truncate text-xs text-foreground/60">{order.customerName}</p>
              <p className="truncate text-xs text-foreground/50">{order.customerEmail}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Info label="Pembayaran" value={paymentLabel(order.paymentMethod)} />
          <Info label="Dibuat" value={formatDate(order.createdAt)} />
          <Info label="Dibayar" value={order.paidAt ? formatDate(order.paidAt) : "—"} />
          <Info label="WhatsApp" value={order.whatsapp} />
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="font-heading text-sm font-extrabold uppercase text-foreground/50">
            Line items
          </h3>
          <ul className="flex flex-col gap-2">
            {order.items.map((it) => (
              <li
                key={it.variantId}
                className="flex items-center justify-between gap-3 rounded-base border-2 border-border bg-secondary-background p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-2xl">{it.productLogo}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{it.productName}</p>
                    <p className="truncate text-xs text-foreground/60">{it.variantLabel}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-foreground/50">{it.qty}×</p>
                  <p className="font-heading text-sm font-extrabold">
                    {formatIDR(it.price * it.qty)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-1 rounded-base border-2 border-dashed border-border p-3 text-sm">
            <Row label="Subtotal" value={formatIDR(order.subtotal)} />
            {order.discount > 0 && <Row label="Diskon" value={`- ${formatIDR(order.discount)}`} />}
            <Row label="Biaya layanan" value={formatIDR(order.fee)} />
            <div className="mt-1 flex items-center justify-between border-t-2 border-border pt-1.5">
              <dt className="font-heading font-extrabold">Total</dt>
              <dd className="font-heading text-lg font-extrabold">{formatIDR(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent-lime" />
            <h3 className="font-heading text-sm font-extrabold uppercase text-foreground/50">
              Credential terkirim
            </h3>
          </div>
          {order.credentials.length === 0 ? (
            <p className="rounded-base border-2 border-dashed border-border p-4 text-center text-sm text-foreground/50">
              Belum ada credential terkirim untuk pesanan ini.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {order.credentials.map((c, i) => (
                <li
                  key={`${c.email}-${i}`}
                  className="flex flex-col gap-2 rounded-base border-2 border-border bg-secondary-background p-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-foreground/50" />
                    <span className="font-mono font-bold">{c.email}</span>
                  </div>
                  <p className="font-mono text-xs text-foreground/60">Password: {c.password}</p>
                  {c.note && <p className="text-xs text-foreground/60">{c.note}</p>}
                  <Button size="sm" variant="neutral" className="self-start" onClick={() => reDownload(c)}>
                    <Download className="size-4" /> Unduh ulang
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </SheetContent>
    </Sheet>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-base border-2 border-border bg-background p-2.5">
      <p className="text-[10px] font-extrabold uppercase text-foreground/45">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-foreground/60">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  )
}
