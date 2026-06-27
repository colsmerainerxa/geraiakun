import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, paymentLabel } from "@/lib/utils"
import type { CredentialStock, OrderStatus, Transaction } from "@/types"

export { paymentLabel }

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "bg-main",
  hint,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: string
  hint?: string
}) {
  return (
    <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground/60">{label}</p>
          <p className="mt-1 truncate font-heading text-2xl font-extrabold">{value}</p>
          {hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>}
        </div>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
            accent,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  )
}

const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; variant: "warning" | "cyan" | "success" | "danger" }
> = {
  "menunggu-pembayaran": { label: "Menunggu", variant: "warning" },
  diproses: { label: "Diproses", variant: "cyan" },
  selesai: { label: "Selesai", variant: "success" },
  dibatalkan: { label: "Dibatalkan", variant: "danger" },
  refund: { label: "Refund", variant: "danger" },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const m = ORDER_STATUS[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

const TRX_STATUS: Record<
  Transaction["status"],
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  berhasil: { label: "Berhasil", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  gagal: { label: "Gagal", variant: "danger" },
}

export function TransactionStatusBadge({ status }: { status: Transaction["status"] }) {
  const m = TRX_STATUS[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

const CRED_STATUS: Record<
  CredentialStock["status"],
  { label: string; variant: "success" | "neutral" | "danger" }
> = {
  tersedia: { label: "Tersedia", variant: "success" },
  terjual: { label: "Terjual", variant: "neutral" },
  kadaluarsa: { label: "Kadaluarsa", variant: "danger" },
}

export function CredentialStatusBadge({ status }: { status: CredentialStock["status"] }) {
  const m = CRED_STATUS[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}
