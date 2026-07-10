"use client"

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { StatCard } from "@/components/admin/parts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAdminRisk } from "@/lib/api/queries"
import { useQueryClient } from "@tanstack/react-query"
import { cn, formatDate, formatIDR } from "@/lib/utils"
import type { RiskReviewStatus } from "@/types"

const STATUS_META: Record<
  RiskReviewStatus,
  { label: string; variant: "warning" | "success" | "neutral" | "danger" }
> = {
  open: { label: "Perlu Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  held: { label: "Ditahan", variant: "neutral" },
  rejected: { label: "Ditolak", variant: "danger" },
}

export function AdminRiskView() {
  const queryClient = useQueryClient()
  const { data: riskData } = useAdminRisk()
  const risks = (riskData ?? []) as any[]
  const decideRisk = async (id: string, decision: RiskReviewStatus, note: string) => {
    await fetch("/api/admin/risk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: decision, note }),
    })
    queryClient.invalidateQueries({ queryKey: ["admin", "risk"] })
  }
  const [selectedId, setSelectedId] = useState(risks[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const selected = risks.find((item) => item.id === selectedId) ?? risks[0]
  const [note, setNote] = useState(selected?.note ?? "")

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    if (!needle) return risks
    return risks.filter((item) =>
      [item.invoice, item.customerName, item.assignedTo, ...item.signals]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
  }, [query, risks])

  const stats = {
    open: risks.filter((item) => item.status === "open").length,
    held: risks.filter((item) => item.status === "held").length,
    high: risks.filter((item) => item.level === "tinggi").length,
    approved: risks.filter((item) => item.status === "approved").length,
  }

  function decide(status: RiskReviewStatus) {
    if (!selected) return
    decideRisk(selected.id, status, note)
    toast.success(`Risk review ${selected.invoice} diubah menjadi ${STATUS_META[status].label}`)
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Perlu Review" value={stats.open} icon={Clock3} accent="bg-warning" />
        <StatCard
          label="Ditahan"
          value={stats.held}
          icon={AlertTriangle}
          accent="bg-accent-purple"
        />
        <StatCard label="Risiko Tinggi" value={stats.high} icon={ShieldAlert} accent="bg-danger" />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={ShieldCheck}
          accent="bg-accent-lime"
        />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="min-w-0">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari invoice, pelanggan, sinyal..."
              className="pl-9"
            />
          </div>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id)
                  setNote(item.note)
                }}
                className={cn(
                  "rounded-base border-2 border-border bg-secondary-background p-4 text-left shadow-shadow-sm brutal-press",
                  selected?.id === item.id && "ring-4 ring-main/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-sm font-extrabold">{item.invoice}</p>
                    <p className="text-xs text-foreground/60">{item.customerName}</p>
                  </div>
                  <Badge variant={STATUS_META[item.status as RiskReviewStatus].variant}>
                    {STATUS_META[item.status as RiskReviewStatus].label}
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-foreground/45">Risk score</p>
                    <p className="font-heading text-2xl font-extrabold">{item.score}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-base border-2 border-border px-2 py-1 text-xs font-bold",
                      item.level === "tinggi"
                        ? "bg-danger"
                        : item.level === "sedang"
                          ? "bg-warning"
                          : "bg-accent-lime",
                    )}
                  >
                    {item.level}
                  </span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="rounded-base border-2 border-dashed border-border p-8 text-center text-sm font-bold text-foreground/50">
                Tidak ada review yang cocok.
              </div>
            )}
          </div>
        </section>

        {selected && (
          <section className="min-w-0 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-border bg-main p-6">
              <div>
                <Badge variant={STATUS_META[selected.status as RiskReviewStatus].variant}>
                  {STATUS_META[selected.status as RiskReviewStatus].label}
                </Badge>
                <h2 className="mt-2 font-heading text-xl font-extrabold">{selected.invoice}</h2>
                <p className="text-sm font-bold text-main-foreground/65">
                  {selected.customerName} - {formatIDR(selected.amount)}
                </p>
              </div>
              <div className="rounded-base border-2 border-border bg-secondary-background px-4 py-2 text-right shadow-shadow-sm">
                <p className="text-xs font-bold text-foreground/45">Risk score</p>
                <p className="font-heading text-2xl font-extrabold">{selected.score}/100</p>
              </div>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <h3 className="font-heading text-sm font-extrabold">Sinyal terdeteksi</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {selected.signals.map((signal: string) => (
                    <li
                      key={signal}
                      className="flex items-start gap-2 rounded-base border-2 border-border bg-background p-3 text-sm font-semibold"
                    >
                      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" /> {signal}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-base border-2 border-border bg-background p-3">
                    <p className="text-xs font-bold text-foreground/45">Assigned to</p>
                    <p className="mt-1 font-bold">{selected.assignedTo}</p>
                  </div>
                  <div className="rounded-base border-2 border-border bg-background p-3">
                    <p className="text-xs font-bold text-foreground/45">Updated</p>
                    <p className="mt-1 font-bold">{formatDate(selected.updatedAt)}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-sm font-extrabold">Catatan keputusan</h3>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-3 min-h-32"
                  placeholder="Tambahkan alasan keputusan, bukti yang diperiksa, atau tindak lanjut..."
                />
                <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <Button onClick={() => decide("approved")}>
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                  <Button variant="neutral" onClick={() => decide("held")}>
                    <Clock3 className="size-4" /> Hold
                  </Button>
                  <Button variant="danger" onClick={() => decide("rejected")}>
                    <XCircle className="size-4" /> Reject
                  </Button>
                </div>
                <p className="mt-4 rounded-base border-2 border-dashed border-border p-3 text-xs font-semibold text-foreground/60">
                  Keputusan akan dicatat ke Audit Log dan menjadi input fulfillment.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
