"use client"

import { Download, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { paymentLabel, TableSkeleton } from "@/components/admin/parts"
import { FilterPresetsBar } from "@/components/admin/filter-presets-bar"
import { OrderDetailDrawer } from "@/components/admin/order-detail-drawer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Pagination, usePagination } from "@/components/ui/pagination"
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
import { useOrders } from "@/lib/api/queries"
import { useFilterState } from "@/lib/hooks/use-filter-state"
import { downloadCsv } from "@/lib/csv"
import { formatDate, formatIDR } from "@/lib/utils"
import { useAdminOverlay } from "@/stores/admin-overlay"
import type { Order, OrderStatus } from "@/types"

const STATUS_FILTERS: { value: OrderStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  { value: "menunggu-pembayaran", label: "Menunggu" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
  { value: "refund", label: "Refund" },
]
const STATUS_OPTIONS = STATUS_FILTERS.filter((f) => f.value !== "semua")
const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_FILTERS.map((f) => [f.value, f.label]),
)
// Transitions that are financially impactful / hard to undo — guard with a
// confirmation so a misclick can't silently flip an order to refund/cancelled.
const DESTRUCTIVE: ReadonlySet<OrderStatus> = new Set(["refund", "dibatalkan"])

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useOrders()
  const overlay = useAdminOverlay((s) => s.orderStatus)
  const setOrderStatus = useAdminOverlay((s) => s.setOrderStatus)
  const [search, setSearch] = useFilterState<string>("orders", "search", "")
  const [status, setStatus] = useFilterState<OrderStatus | "semua">("orders", "status", "semua")

  const eff = (invoice: string, fallback: OrderStatus): OrderStatus => overlay[invoice] ?? fallback

  function changeStatus(invoice: string, next: OrderStatus, current: OrderStatus) {
    if (DESTRUCTIVE.has(next)) {
      const ok = window.confirm(
        `Ubah pesanan ${invoice} menjadi "${STATUS_LABEL[next]}"? Tindakan ini tercatat di audit log.`,
      )
      if (!ok) return
    }
    setOrderStatus(invoice, next)
    toast.success(`Status ${invoice}: ${STATUS_LABEL[current]} → ${STATUS_LABEL[next]}`)
  }

  const filtered = useMemo(() => {
    if (!orders) return []
    const q = search.toLowerCase().trim()
    return orders.filter((o) => {
      if (status !== "semua" && eff(o.invoice, o.status) !== status) return false
      if (!q) return true
      return o.invoice.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, search, status, overlay])

  function exportCsv() {
    downloadCsv(
      "pesanan.csv",
      filtered.map((o) => ({
        invoice: o.invoice,
        pelanggan: o.customerName,
        email: o.customerEmail,
        total: o.total,
        pembayaran: paymentLabel(o.paymentMethod),
        tanggal: o.createdAt,
        status: eff(o.invoice, o.status),
      })),
    )
  }

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const { page, setPage, pageCount, paged, total, pageSize } = usePagination(filtered, 10)

  function toggleRow(invoice: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(invoice)
      else next.delete(invoice)
      return next
    })
  }

  const pageIds = paged.map((o) => o.invoice)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const someOnPageSelected = pageIds.some((id) => selected.has(id))

  function toggleAllOnPage(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) pageIds.forEach((id) => next.add(id))
      else pageIds.forEach((id) => next.delete(id))
      return next
    })
  }

  function bulkSetStatus(next: OrderStatus) {
    if (selected.size === 0) return
    if (DESTRUCTIVE.has(next)) {
      const ok = window.confirm(
        `Ubah ${selected.size} pesanan terpilih menjadi "${STATUS_LABEL[next]}"? Tindakan ini tercatat di audit log.`,
      )
      if (!ok) return
    }
    selected.forEach((invoice) => setOrderStatus(invoice, next))
    toast.success(`${selected.size} pesanan diubah ke "${STATUS_LABEL[next]}"`)
    setSelected(new Set())
  }

  function exportSelectedCsv() {
    const rows = filtered.filter((o) => selected.has(o.invoice))
    if (rows.length === 0) return
    downloadCsv(
      "pesanan-terpilih.csv",
      rows.map((o) => ({
        invoice: o.invoice,
        pelanggan: o.customerName,
        email: o.customerEmail,
        total: o.total,
        pembayaran: paymentLabel(o.paymentMethod),
        tanggal: o.createdAt,
        status: eff(o.invoice, o.status),
      })),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice atau nama pelanggan..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus | "semua")}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="neutral" onClick={exportCsv} className="shrink-0">
          <Download className="size-4" /> Export
        </Button>
      </div>

      <FilterPresetsBar
        module="orders"
        current={{ search, status }}
        onApply={(snap) => {
          setSearch(snap.search ?? "")
          setStatus((snap.status as OrderStatus | "semua") ?? "semua")
        }}
      />

      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-base border-2 border-border bg-main p-3 shadow-shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-heading text-sm font-extrabold text-main-foreground">
            {selected.size} pesanan terpilih
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((f) => (
              <Button key={f.value} size="sm" variant="neutral" onClick={() => bulkSetStatus(f.value as OrderStatus)}>
                {f.label}
              </Button>
            ))}
            <Button size="sm" variant="neutral" onClick={exportSelectedCsv}>
              <Download className="size-4" /> Export
            </Button>
            <Button size="sm" variant="neutral" onClick={() => setSelected(new Set())}>
              Batal
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton columns={8} rows={6} />
      ) : (
        <>
          <p className="text-sm text-foreground/60">{filtered.length} pesanan</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false
                    }
                    onCheckedChange={(v) => toggleAllOnPage(!!v)}
                    aria-label="Pilih semua di halaman ini"
                  />
                </TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((o) => (
                <TableRow key={o.id} className={selected.has(o.invoice) ? "bg-main/20" : undefined}>
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selected.has(o.invoice)}
                      onCheckedChange={(v) => toggleRow(o.invoice, !!v)}
                      aria-label={`Pilih ${o.invoice}`}
                    />
                  </TableCell>
                  <TableCell className="font-heading font-bold">
                    <button
                      type="button"
                      className="text-left underline-offset-2 hover:underline"
                      onClick={() => setActiveOrder(o)}
                    >
                      {o.invoice}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{o.customerName}</span>
                      <span className="text-xs text-foreground/50">{o.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <span className="line-clamp-1 text-foreground/70">
                      {o.items.map((it) => it.productName).join(", ")}
                    </span>
                  </TableCell>
                  <TableCell className="font-heading font-bold">{formatIDR(o.total)}</TableCell>
                  <TableCell className="text-foreground/70">
                    {paymentLabel(o.paymentMethod)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-foreground/70">
                    {formatDate(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    {/* Inline status editor — audited via enterprise audit log */}
                    <Select
                      value={eff(o.invoice, o.status)}
                      onValueChange={(v) =>
                        changeStatus(o.invoice, v as OrderStatus, eff(o.invoice, o.status))
                      }
                    >
                      <SelectTrigger className="h-9 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {total === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-foreground/50">
                    Tidak ada pesanan yang cocok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <OrderDetailDrawer
        order={activeOrder}
        open={activeOrder !== null}
        onOpenChange={(o) => !o && setActiveOrder(null)}
      />
    </div>
  )
}
