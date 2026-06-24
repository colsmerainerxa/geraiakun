"use client"

import { Boxes, CheckCircle2, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { CredentialStatusBadge, StatCard } from "@/components/admin/parts"
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
import { useCredentials } from "@/lib/api/queries"
import { formatDate } from "@/lib/utils"
import type { CredentialStock } from "@/types"

const FILTERS: { value: CredentialStock["status"] | "semua"; label: string }[] =
  [
    { value: "semua", label: "Semua" },
    { value: "tersedia", label: "Tersedia" },
    { value: "terjual", label: "Terjual" },
    { value: "kadaluarsa", label: "Kadaluarsa" },
  ]

export default function AdminStockPage() {
  const { data: credentials, isLoading } = useCredentials()
  const [status, setStatus] = useState<CredentialStock["status"] | "semua">(
    "semua",
  )

  const stats = useMemo(() => {
    const list = credentials ?? []
    return {
      total: list.length,
      tersedia: list.filter((c) => c.status === "tersedia").length,
      kadaluarsa: list.filter((c) => c.status === "kadaluarsa").length,
    }
  }, [credentials])

  const filtered = useMemo(() => {
    const list = credentials ?? []
    return status === "semua"
      ? list
      : list.filter((c) => c.status === status)
  }, [credentials, status])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Stok"
          value={stats.total}
          icon={Boxes}
          accent="bg-accent-cyan"
        />
        <StatCard
          label="Tersedia"
          value={stats.tersedia}
          icon={CheckCircle2}
          accent="bg-success"
        />
        <StatCard
          label="Kadaluarsa"
          value={stats.kadaluarsa}
          icon={XCircle}
          accent="bg-danger"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">{filtered.length} akun</p>
        <Select
          value={status}
          onValueChange={(v) =>
            setStatus(v as CredentialStock["status"] | "semua")
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Varian</TableHead>
              <TableHead>Email Akun</TableHead>
              <TableHead>Ditambahkan</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-bold">{c.productName}</TableCell>
                <TableCell className="text-foreground/70">
                  {c.variantLabel}
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground/60">
                  {c.email}
                </TableCell>
                <TableCell className="whitespace-nowrap text-foreground/70">
                  {formatDate(c.addedAt)}
                </TableCell>
                <TableCell>
                  <CredentialStatusBadge status={c.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
