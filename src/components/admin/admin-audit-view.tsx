"use client"

import { CheckCircle2, Download, Search, ShieldCheck, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DateRangeFilter,
  type DateRangePreset,
  inRange,
  useDateRange,
} from "@/components/ui/date-range-filter"
import { Input } from "@/components/ui/input"
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
import { downloadCsv } from "@/lib/csv"
import { useAdminAudit } from "@/lib/api/queries"
import { cn, formatDate } from "@/lib/utils"

import type { AuditEvent } from "@/types"

export function AdminAuditView() {
  const { data: auditResult, isLoading } = useAdminAudit({ limit: 100 })
  const audits: AuditEvent[] = auditResult?.data ?? []
  const [query, setQuery] = useState("")
  const [module, setModule] = useState("all")
  const [rangePreset, setRangePreset] = useState<DateRangePreset>("30d")
  const range = useDateRange(rangePreset)
  const [selectedId, setSelectedId] = useState("")
  const modules = useMemo(() => [...new Set(audits.map((item) => item.module))].sort(), [audits])
  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    return audits.filter((item) => {
      if (!inRange(item.createdAt, range)) return false
      if (module !== "all" && item.module !== module) return false
      if (!needle) return true
      return [item.actorName, item.action, item.module, item.targetLabel, item.detail]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [audits, module, query, range])
  const selected = audits.find((item) => item.id === selectedId) ?? filtered[0]

  if (isLoading) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        <p className="text-sm text-foreground/60">Memuat audit log...</p>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold">Audit Log</h2>
          <p className="text-sm text-foreground/60">
            Jejak perubahan admin dengan actor, target, hasil, IP, dan waktu.
          </p>
        </div>
        <Button
          variant="neutral"
          onClick={() =>
            downloadCsv(
              "audit-log.csv",
              filtered.map((event) => ({
                waktu: event.createdAt,
                actor: event.actorName,
                aksi: event.action,
                modul: event.module,
                target: event.targetLabel,
                hasil: event.outcome,
                ip: event.ipAddress,
                detail: event.detail,
              })),
            )
          }
        >
          <Download className="size-4" /> Export
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari actor, aksi, target..."
            className="pl-9"
          />
        </div>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Modul</SelectItem>
            {modules.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeFilter value={rangePreset} onChange={setRangePreset} className="shrink-0" />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <section className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Hasil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((event) => (
                <TableRow
                  key={event.id}
                  onClick={() => setSelectedId(event.id)}
                  className={cn("cursor-pointer", selected?.id === event.id && "bg-main/15")}
                >
                  <TableCell className="whitespace-nowrap text-xs text-foreground/60">
                    {formatDate(event.createdAt)}
                  </TableCell>
                  <TableCell>
                    <p className="font-bold">{event.actorName}</p>
                    <p className="text-xs text-foreground/45">{event.ipAddress}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{event.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold">{event.targetLabel}</p>
                    <p className="text-xs text-foreground/45">{event.module}</p>
                  </TableCell>
                  <TableCell>
                    {event.outcome === "success" ? (
                      <CheckCircle2 className="size-5 text-success" aria-label="Success" />
                    ) : (
                      <XCircle className="size-5 text-danger" aria-label="Failed" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center font-bold text-foreground/50">
                    Tidak ada event yang cocok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>

        <aside className="min-w-0 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-base border-2 border-border bg-accent-lime shadow-shadow-sm">
                  <ShieldCheck className="size-5" />
                </span>
                <Badge variant={selected.outcome === "success" ? "success" : "danger"}>
                  {selected.outcome}
                </Badge>
              </div>
              <h2 className="mt-4 font-heading text-lg font-extrabold">
                {selected.action} {selected.module}
              </h2>
              <p className="mt-1 text-sm text-foreground/60">{selected.detail}</p>
              <dl className="mt-5 grid gap-3 text-sm">
                {[
                  ["Actor", selected.actorName],
                  ["Target", selected.targetLabel],
                  ["Target ID", selected.targetId],
                  ["IP Address", selected.ipAddress],
                  ["Waktu", formatDate(selected.createdAt)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-base border-2 border-border bg-background p-3"
                  >
                    <dt className="text-xs font-bold text-foreground/45">{label}</dt>
                    <dd className="mt-1 break-words font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="text-sm text-foreground/50">Pilih event untuk melihat detail.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
