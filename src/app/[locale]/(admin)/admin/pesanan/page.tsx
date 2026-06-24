"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { OrderStatusBadge, paymentLabel } from "@/components/admin/parts"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOrders } from "@/lib/api/queries"
import { formatDate, formatIDR } from "@/lib/utils"
import type { OrderStatus } from "@/types"

const STATUS_FILTERS: { value: OrderStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  { value: "menunggu-pembayaran", label: "Menunggu" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
  { value: "refund", label: "Refund" },
]

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useOrders()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<OrderStatus | "semua">("semua")

  const filtered = useMemo(() => {
    if (!orders) return []
    const q = search.toLowerCase().trim()
    return orders.filter((o) => {
      if (status !== "semua" && o.status !== status) return false
      if (!q) return true
      return (
        o.invoice.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      )
    })
  }, [orders, search, status])

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
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as OrderStatus | "semua")}
        >
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
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <p className="text-sm text-foreground/60">
            {filtered.length} pesanan
          </p>
          <Table>
            <TableHeader>
              <TableRow>
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
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-heading font-bold">
                    {o.invoice}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{o.customerName}</span>
                      <span className="text-xs text-foreground/50">
                        {o.customerEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <span className="line-clamp-1 text-foreground/70">
                      {o.items.map((it) => it.productName).join(", ")}
                    </span>
                  </TableCell>
                  <TableCell className="font-heading font-bold">
                    {formatIDR(o.total)}
                  </TableCell>
                  <TableCell className="text-foreground/70">
                    {paymentLabel(o.paymentMethod)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-foreground/70">
                    {formatDate(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-foreground/50"
                  >
                    Tidak ada pesanan yang cocok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  )
}
