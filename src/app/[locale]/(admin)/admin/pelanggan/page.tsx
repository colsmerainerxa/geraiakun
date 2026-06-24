"use client"

import { Download, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { downloadCsv } from "@/lib/csv"
import { useCustomers } from "@/lib/api/queries"
import { formatDate, formatIDR, initials } from "@/lib/utils"
import type { Customer } from "@/types"

const STATUS: Record<
  Customer["status"],
  { label: string; variant: "purple" | "success" | "cyan" }
> = {
  vip: { label: "VIP", variant: "purple" },
  aktif: { label: "Aktif", variant: "success" },
  baru: { label: "Baru", variant: "cyan" },
}

export default function AdminCustomersPage() {
  const { data: customers, isLoading } = useCustomers()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!customers) return []
    const q = search.toLowerCase().trim()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }, [customers, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="pl-9"
          />
        </div>
        <Button
          variant="neutral"
          className="shrink-0"
          onClick={() =>
            downloadCsv(
              "pelanggan.csv",
              filtered.map((c) => ({
                nama: c.name,
                email: c.email,
                whatsapp: c.whatsapp,
                bergabung: c.joinedAt,
                pesanan: c.orderCount,
                total_belanja: c.totalSpent,
                status: c.status,
              })),
            )
          }
        >
          <Download className="size-4" /> Export
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pelanggan</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead>Pesanan</TableHead>
              <TableHead>Total Belanja</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={c.avatar} alt={c.name} />
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold">{c.name}</span>
                      <span className="text-xs text-foreground/50">
                        {c.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-foreground/70">
                  {c.whatsapp}
                </TableCell>
                <TableCell className="whitespace-nowrap text-foreground/70">
                  {formatDate(c.joinedAt)}
                </TableCell>
                <TableCell className="font-heading font-bold">
                  {c.orderCount}
                </TableCell>
                <TableCell className="font-heading font-bold">
                  {formatIDR(c.totalSpent)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS[c.status].variant}>
                    {STATUS[c.status].label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
