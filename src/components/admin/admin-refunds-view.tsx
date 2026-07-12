"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Clock3,
  Columns3,
  FileImage,
  RefreshCcw,
  Rows3,
  Search,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { StatCard } from "@/components/admin/parts"
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
import { processRefund } from "@/app/actions/admin-refunds"
import { useAdminRefunds, useAdminTeam } from "@/lib/api/queries"
import { cn, formatDate, formatIDR } from "@/lib/utils"
import { useUI } from "@/stores/ui"
import type { RefundCase, RefundDecision, RefundStatus } from "@/types"

const REFUND_STATUS_MAP: Record<string, RefundStatus> = {
  DRAFT: "draft",
  REVIEW: "review",
  REPLACEMENT: "replacement",
  REFUND: "refund",
  REJECTED: "rejected",
  CLOSED: "closed",
}

const DECISION_TO_API: Record<RefundDecision, string> = {
  replacement: "REPLACEMENT",
  refund: "REFUND",
  reject: "REJECTED",
}

function mapRefund(row: Record<string, unknown>): RefundCase {
  return {
    id: row.id as string,
    orderInvoice: row.orderInvoice as string,
    ticketId: (row.ticketId as string) ?? null,
    productId: (row.productId as string) ?? "",
    productName: row.productName as string,
    reason: (row.reason as string) ?? "",
    amount: (row.amount as number) ?? 0,
    status: REFUND_STATUS_MAP[row.status as string] ?? "draft",
    owner: (row.owner as string) ?? "CS geraiakun",
    evidence: (row.evidence as string[]) ?? [],
    updatedAt: (row.updatedAt as string) ?? "",
    timeline: (row.timeline as { label: string; done: boolean }[]) ?? [],
  }
}

const STATUS_META: Record<
  RefundStatus,
  { label: string; variant: "neutral" | "warning" | "cyan" | "danger" | "success" }
> = {
  draft: { label: "Draft", variant: "neutral" },
  review: { label: "Review", variant: "warning" },
  replacement: { label: "Replacement", variant: "cyan" },
  refund: { label: "Refund", variant: "danger" },
  rejected: { label: "Ditolak", variant: "danger" },
  closed: { label: "Selesai", variant: "success" },
}

const REFUND_COLUMNS = Object.entries(STATUS_META).map(([status, meta]) => ({
  id: status as RefundStatus,
  title: meta.label,
  accent:
    status === "draft"
      ? "bg-secondary-background"
      : status === "review"
        ? "bg-warning"
        : status === "replacement"
          ? "bg-accent-cyan"
          : status === "refund"
            ? "bg-accent-pink"
            : status === "rejected"
              ? "bg-danger"
              : "bg-accent-lime",
}))

export function AdminRefundsView() {
  const queryClient = useQueryClient()
  const { data: refundsData } = useAdminRefunds()
  const refunds: RefundCase[] = useMemo(
    () => (refundsData?.data ?? []).map(mapRefund),
    [refundsData],
  )
  const { data: staffData = [] as any[] } = useAdminTeam()
  const staff = staffData
  async function assignRefund(refundId: string, staffId: string) {
    const r = await fetch("/api/admin/refunds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: refundId, owner: staffId }),
    })
    if (r.ok) {
      queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] })
    }
  }
  const [selectedId, setSelectedId] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<RefundStatus | "all">("all")
  const viewMode = useUI((state) => state.pipelineViews.refunds)
  const setPipelineView = useUI((state) => state.setPipelineView)

  const processMutation = useMutation({
    mutationFn: (input: { refundId: string; status: string; note?: string }) =>
      processRefund(input as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] })
    },
  })

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim()
    return refunds.filter((item) => {
      if (status !== "all" && item.status !== status) return false
      if (!needle) return true
      return [item.id, item.orderInvoice, item.productName, item.reason, item.owner]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [query, refunds, status])
  const selected = refunds.find((item) => item.id === selectedId) ?? filtered[0]

  const [checked, setChecked] = useState<Set<string>>(new Set())
  const { page, setPage, pageCount, paged, total, pageSize } = usePagination(filtered, 8)

  function toggleRow(id: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const pageIds = paged.map((item) => item.id)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => checked.has(id))
  const someOnPageSelected = pageIds.some((id) => checked.has(id))

  function toggleAllOnPage(on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (on) {
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

  function bulkDecide(decision: RefundDecision) {
    if (checked.size === 0) return
    checked.forEach((id) => {
      processMutation.mutate({ refundId: id, status: DECISION_TO_API[decision] })
    })
    toast.success(`${checked.size} kasus refund diputuskan: ${decision}`)
    setChecked(new Set())
  }

  const openCount = refunds.filter((item) => ["draft", "review"].includes(item.status)).length
  const replaceCount = refunds.filter((item) => item.status === "replacement").length
  const refundValue = refunds
    .filter((item) => item.status === "refund")
    .reduce((sum, item) => sum + item.amount, 0)

  function decide(decision: RefundDecision) {
    if (!selected) return
    processMutation.mutate(
      { refundId: selected.id, status: DECISION_TO_API[decision] },
      {
        onSuccess: () => {
          toast.success(`Keputusan ${decision} disimpan untuk ${selected.orderInvoice}`)
        },
      },
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kasus Terbuka" value={openCount} icon={Clock3} accent="bg-warning" />
        <StatCard
          label="Replacement"
          value={replaceCount}
          icon={RefreshCcw}
          accent="bg-accent-cyan"
        />
        <StatCard
          label="Nilai Refund"
          value={formatIDR(refundValue, { compact: true })}
          icon={WalletCards}
          accent="bg-accent-pink"
        />
        <StatCard label="SLA Target" value="< 2 jam" icon={ShieldCheck} accent="bg-accent-lime" />
      </div>

      <div
        className={cn(
          "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6",
          viewMode === "kanban"
            ? "xl:grid-cols-[minmax(0,1fr)_380px]"
            : "xl:grid-cols-[380px_minmax(0,1fr)]",
        )}
      >
        <section className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-2">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari kasus, invoice, produk..."
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as RefundStatus | "all")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground/60">{filtered.length} kasus refund</p>
            <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background p-1 shadow-shadow-sm">
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setPipelineView("refunds", "table")}
              >
                <Rows3 className="size-4" /> List
              </Button>
              <Button
                size="sm"
                variant={viewMode === "kanban" ? "default" : "ghost"}
                onClick={() => setPipelineView("refunds", "kanban")}
              >
                <Columns3 className="size-4" /> Kanban
              </Button>
            </div>
          </div>

          {checked.size > 0 && viewMode === "table" && (
            <div className="flex flex-wrap items-center gap-2 rounded-base border-2 border-border bg-main p-2.5 shadow-shadow-sm">
              <span className="font-heading text-xs font-extrabold text-main-foreground">
                {checked.size} terpilih
              </span>
              <Button size="sm" variant="neutral" onClick={() => bulkDecide("replacement")}>
                Replacement
              </Button>
              <Button size="sm" variant="neutral" onClick={() => bulkDecide("refund")}>
                Refund
              </Button>
              <Button size="sm" variant="neutral" onClick={() => bulkDecide("reject")}>
                Tolak
              </Button>
              <Button size="sm" variant="neutral" onClick={() => setChecked(new Set())}>
                Batal
              </Button>
            </div>
          )}

          {viewMode === "kanban" ? (
            <PipelineBoard
              columns={REFUND_COLUMNS}
              items={filtered}
              getStatus={(item) => item.status}
              emptyLabel="Kosong"
              renderCard={(item) => (
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full rounded-base border-2 border-border bg-secondary-background p-3 text-left shadow-shadow-sm",
                    selected?.id === item.id && "ring-4 ring-main/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-extrabold">{item.id}</p>
                      <p className="truncate text-xs text-foreground/60">{item.orderInvoice}</p>
                    </div>
                    <Badge variant={STATUS_META[item.status].variant}>
                      {STATUS_META[item.status].label}
                    </Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-foreground/70">{item.reason}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-dashed border-border pt-3 text-xs">
                    <span className="font-bold">{item.owner}</span>
                    <span className="font-heading font-extrabold">{formatIDR(item.amount)}</span>
                  </div>
                </button>
              )}
            />
          ) : (
            <>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
                {total > 0 && (
                  <div className="flex items-center gap-2 px-1">
                    <Checkbox
                      checked={
                        allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false
                      }
                      onCheckedChange={(v) => toggleAllOnPage(!!v)}
                      aria-label="Pilih semua di halaman ini"
                    />
                    <span className="text-[10px] font-extrabold uppercase text-foreground/60">
                      Pilih semua
                    </span>
                  </div>
                )}
                {paged.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex gap-2 rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow-sm",
                      selected?.id === item.id && "ring-4 ring-main/40",
                      checked.has(item.id) && "bg-main/20",
                    )}
                  >
                    <Checkbox
                      checked={checked.has(item.id)}
                      onCheckedChange={(v) => toggleRow(item.id, !!v)}
                      aria-label={`Pilih ${item.id}`}
                      className="mt-1"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-heading text-sm font-extrabold">{item.id}</p>
                          <p className="truncate text-xs text-foreground/60">
                            {item.orderInvoice} - {item.productName}
                          </p>
                        </div>
                        <Badge variant={STATUS_META[item.status].variant}>
                          {STATUS_META[item.status].label}
                        </Badge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-foreground/70">{item.reason}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-dashed border-border pt-3 text-xs">
                        <span className="font-bold">{item.owner}</span>
                        <span className="text-foreground/60">{formatDate(item.updatedAt)}</span>
                      </div>
                    </button>
                  </div>
                ))}
                {total === 0 && (
                  <div className="rounded-base border-2 border-dashed border-border p-8 text-center text-sm font-bold text-foreground/60">
                    Tidak ada kasus yang cocok.
                  </div>
                )}
              </div>
              <Pagination
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
              />
            </>
          )}
        </section>

        {selected ? (
          <section className="min-w-0 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-border bg-main p-6">
              <div>
                <Badge variant={STATUS_META[selected.status].variant}>
                  {STATUS_META[selected.status].label}
                </Badge>
                <h2 className="mt-2 font-heading text-xl font-extrabold">
                  {selected.orderInvoice}
                </h2>
                <p className="text-sm font-bold text-main-foreground/65">
                  {selected.productName} - {formatIDR(selected.amount)}
                </p>
              </div>
              <Select
                value={selected.owner}
                onValueChange={(owner) => assignRefund(selected.id, owner)}
              >
                <SelectTrigger className="w-full bg-secondary-background sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staff
                    .filter((member: any) =>
                      ["customer-support", "finance", "owner"].includes(member.role),
                    )
                    .map((member: any) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div>
                <h3 className="font-heading text-sm font-extrabold">Konteks kasus</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div className="rounded-base border-2 border-border bg-background p-3">
                    <dt className="text-xs font-bold text-foreground/60">Alasan</dt>
                    <dd className="mt-1 font-semibold">{selected.reason}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-base border-2 border-border bg-background p-3">
                      <dt className="text-xs font-bold text-foreground/60">Ticket</dt>
                      <dd className="mt-1 font-bold">{selected.ticketId ?? "-"}</dd>
                    </div>
                    <div className="rounded-base border-2 border-border bg-background p-3">
                      <dt className="text-xs font-bold text-foreground/60">Produk</dt>
                      <dd className="mt-1 font-bold">{selected.productName}</dd>
                    </div>
                  </div>
                </dl>
                <h3 className="mt-5 flex items-center gap-2 font-heading text-sm font-extrabold">
                  <FileImage className="size-4" /> Bukti pelanggan
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selected.evidence.map((file) => (
                    <div
                      key={file}
                      className="truncate rounded-base border-2 border-border bg-background p-3 text-xs font-bold"
                    >
                      {file}
                    </div>
                  ))}
                  {selected.evidence.length === 0 && (
                    <p className="text-sm text-foreground/60">Belum ada bukti.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-heading text-sm font-extrabold">SLA dan timeline</h3>
                <ol className="mt-3 flex flex-col gap-3">
                  {selected.timeline.map((step, index) => (
                    <li key={step.label} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border text-xs font-extrabold",
                          step.done ? "bg-accent-lime" : "bg-background",
                        )}
                      >
                        {step.done ? <Check className="size-3.5" /> : index + 1}
                      </span>
                      <p
                        className={cn("pt-1 text-sm font-bold", !step.done && "text-foreground/60")}
                      >
                        {step.label}
                      </p>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 rounded-base border-2 border-dashed border-border p-4">
                  <p className="text-xs font-bold uppercase text-foreground/60">
                    Keputusan operator
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <Button size="sm" onClick={() => decide("replacement")} disabled={processMutation.isPending}>
                      <RefreshCcw className="size-4" /> Replace
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => decide("refund")} disabled={processMutation.isPending}>
                      <WalletCards className="size-4" /> Refund
                    </Button>
                    <Button size="sm" variant="neutral" onClick={() => decide("reject")} disabled={processMutation.isPending}>
                      <XCircle className="size-4" /> Tolak
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="rounded-base border-2 border-dashed border-border p-10 text-center text-foreground/60">
            Pilih kasus untuk melihat detail.
          </div>
        )}
      </div>
    </div>
  )
}
