"use client"

import { ArrowDownLeft, CheckCircle2, Clock, Download, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import {
  paymentLabel,
  StatCard,
  TableSkeleton,
  TransactionStatusBadge,
} from "@/components/admin/parts"
import { Button } from "@/components/ui/button"
import {
  DateRangeFilter,
  type DateRangePreset,
  inRange,
  useDateRange,
} from "@/components/ui/date-range-filter"
import { Pagination, usePagination } from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTransactions } from "@/lib/api/queries"
import { downloadCsv } from "@/lib/csv"
import { formatDate, formatIDR } from "@/lib/utils"

export default function AdminTransactionsPage() {
  const { data: transactions, isLoading } = useTransactions()
  const [rangePreset, setRangePreset] = useState<DateRangePreset>("30d")
  const range = useDateRange(rangePreset)

  const list = useMemo(
    () => (transactions ?? []).filter((t) => inRange(t.createdAt, range)),
    [transactions, range],
  )
  const { page, setPage, pageCount, paged, total, pageSize } = usePagination(list, 10)

  const stats = useMemo(() => {
    const list = transactions ?? []
    return {
      success: list.filter((t) => t.status === "berhasil"),
      pending: list.filter((t) => t.status === "pending").length,
      failed: list.filter((t) => t.status === "gagal").length,
      revenue: list.filter((t) => t.status === "berhasil").reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Masuk"
          value={formatIDR(stats.revenue, { compact: true })}
          hint={formatIDR(stats.revenue)}
          icon={ArrowDownLeft}
          accent="bg-accent-lime"
        />
        <StatCard
          label="Berhasil"
          value={stats.success.length}
          icon={CheckCircle2}
          accent="bg-success"
        />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="bg-warning" />
        <StatCard label="Gagal" value={stats.failed} icon={XCircle} accent="bg-danger" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <DateRangeFilter value={rangePreset} onChange={setRangePreset} />
        <Button
          variant="neutral"
          onClick={() =>
            downloadCsv(
              "transaksi.csv",
              list.map((tr) => ({
                id: tr.id,
                invoice: tr.invoice,
                pelanggan: tr.customerName,
                metode: paymentLabel(tr.method),
                jumlah: tr.amount,
                tanggal: tr.createdAt,
                status: tr.status,
              })),
            )
          }
        >
          <Download className="size-4" /> Export
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} rows={6} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transaksi</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs text-foreground/60">
                    {t.id.toUpperCase()}
                  </TableCell>
                  <TableCell className="font-heading font-bold">{t.invoice}</TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell className="text-foreground/70">{paymentLabel(t.method)}</TableCell>
                  <TableCell className="font-heading font-bold">{formatIDR(t.amount)}</TableCell>
                  <TableCell className="whitespace-nowrap text-foreground/70">
                    {formatDate(t.createdAt)}
                  </TableCell>
                  <TableCell>
                    <TransactionStatusBadge status={t.status} />
                  </TableCell>
                </TableRow>
              ))}
              {total === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-foreground/50">
                    Belum ada transaksi.
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
    </div>
  )
}
