"use client"

import { Columns3, Download, Rows3, Search } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { FilterPresetsBar } from "@/components/admin/filter-presets-bar"
import { OrderDetailDrawer } from "@/components/admin/order-detail-drawer"
import { paymentLabel, TableSkeleton } from "@/components/admin/parts"
import { PipelineBoard } from "@/components/admin/pipeline-board"
import { Badge } from "@/components/ui/badge"
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
import { downloadCsv } from "@/lib/csv"
import { useFilterState } from "@/lib/hooks/use-filter-state"
import { formatDate, formatIDR } from "@/lib/utils"
import { useAdminOverlay } from "@/stores/admin-overlay"
import { useUI } from "@/stores/ui"
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
const STATUS_ACCENT: Record<OrderStatus, string> = {
  "menunggu-pembayaran": "bg-warning",
  diproses: "bg-accent-cyan",
  selesai: "bg-accent-lime",
  dibatalkan: "bg-danger",
  refund: "bg-accent-pink",
}
const ORDER_COLUMNS = STATUS_OPTIONS.map((filter) => ({
  id: filter.value as OrderStatus,
  title: filter.label,
  accent: STATUS_ACCENT[filter.value as OrderStatus],
}))
const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_FILTERS.map((f) => [f.value, f.label]),
)
// Transitions that are financially impactful / hard to undo — guard with a
// confirmation so a misclick can't silently flip an order to refund/cancelled.
const DESTRUCTIVE: ReadonlySet<OrderStatus> = new Set(["refund", "dibatalkan"])

export default function AdminOrdersPage() {
  const { data: ordersResult, isLoading } = useOrders()
  const orders = (ordersResult?.data ?? []) as any[]
  const overlay = useAdminOverlay((s) => s.orderStatus)
  const setOrderStatus = useAdminOverlay((s) => s.setOrderStatus)
  const viewMode = useUI((s) => s.pipelineViews.orders)
  const setPipelineView = useUI((s) => s.setPipelineView)
  const [search, setSearch] = useFilterState<string>("orders", "search", "")
  const [status, setStatus] = useFilterState<OrderStatus | "semua">("orders", "status", "semua")

  const eff = useCallback(
    (invoice: string, fallback: OrderStatus): OrderStatus => overlay[invoice] ?? fallback,
    [overlay],
  )

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
    const q = search.toLowerCase().trim()
    return orders.filter((o: any) => {
      if (status !== "semua" && eff(o.invoice, o.status) !== status) return false
      if (!q) return true
      return o.invoice?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q)
    })
  }, [orders, search, status, eff])

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
  const [activeOrder, setActiveOrder] = useState<any | null>(null)
  const { page, setPage, pageCount, paged, total, pageSize } = usePagination(filtered, 10)

  function toggleRow(invoice: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(invoice)
      else next.delete(invoice)
      return next
    })
  }

  const pageIds = paged.map((o: any) => o.invoice)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const someOnPageSelected = pageIds.some((id) => selected.has(id))

  function toggleAllOnPage(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) {
        pageIds.forEach((id) => {
          next.add(id)
        })
      } else {
        pageIds.forEach((id) => {
          next.delete(id)
        })
      }
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
    selected.forEach((invoice) => {
      setOrderStatus(invoice, next)
    })
    toast.success(`${selected.size} pesanan diubah ke "${STATUS_LABEL[next]}"`)
    setSelected(new Set())
  }

  function exportSelectedCsv() {
    const rows = filtered.filter((o: any) => selected.has(o.invoice))
    if (rows.length === 0) return
    downloadCsv(
      "pesanan-terpilih.csv",
      rows.map((o: any) => ({
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
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
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
              <Button
                key={f.value}
                size="sm"
                variant="neutral"
                onClick={() => bulkSetStatus(f.value as OrderStatus)}
              >
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground/60">{filtered.length} pesanan</p>
            <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background p-1 shadow-shadow-sm">
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setPipelineView("orders", "table")}
              >
                <Rows3 className="size-4" /> Table
              </Button>
              <Button
                size="sm"
                variant={viewMode === "kanban" ? "default" : "ghost"}
                onClick={() => setPipelineView("orders", "kanban")}
              >
                <Columns3 className="size-4" /> Kanban
              </Button>
            </div>
          </div>

          {viewMode === "kanban" ? (
            <PipelineBoard
              columns={ORDER_COLUMNS}
              items={filtered}
              getStatus={(order) => eff(order.invoice, order.status)}
              emptyLabel="Kosong"
              renderCard={(order) => (
                <article className="rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => setActiveOrder(order)}
                    >
                      <p className="font-heading text-sm font-extrabold underline-offset-2 hover:underline">
                        {order.invoice}
                      </p>
                      <p className="truncate text-xs font-bold text-foreground/60">
                        {order.customerName}
                      </p>
                    </button>
                    <Badge variant="neutral" className="shrink-0">
                      {paymentLabel(order.paymentMethod)}
                    </Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs text-foreground/60">
                    {order.items.map((item: any) => item.productName).join(", ")}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-dashed border-border pt-3">
                    <span className="font-heading text-sm font-extrabold">
                      {formatIDR(order.total)}
                    </span>
                    <Select
                      value={eff(order.invoice, order.status)}
                      onValueChange={(value) =>
                        changeStatus(
                          order.invoice,
                          value as OrderStatus,
                          eff(order.invoice, order.status),
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-32 bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </article>
              )}
            />
          ) : (
            <>
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
                  {paged.map((o: any) => (
                    <TableRow
                      key={o.id}
                      className={selected.has(o.invoice) ? "bg-main/20" : undefined}
                    >
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
                          <span className="text-xs text-foreground/60">{o.customerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <span className="line-clamp-1 text-foreground/70">
                          {o.items.map((it: any) => it.productName).join(", ")}
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
                      <TableCell colSpan={8} className="py-12 text-center text-foreground/60">
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
