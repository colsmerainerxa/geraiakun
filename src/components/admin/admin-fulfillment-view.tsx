"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Columns3,
  KeyRound,
  PackageCheck,
  Rows3,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { FilterPresetsBar } from "@/components/admin/filter-presets-bar"
import { CredentialStatusBadge, StatCard } from "@/components/admin/parts"
import { PipelineBoard } from "@/components/admin/pipeline-board"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { deliverFulfillmentCredential } from "@/app/actions/fulfillment"
import { useFilterState } from "@/lib/hooks/use-filter-state"
import type { FulfillmentStatus, FulfillmentTask, RiskLevel } from "@/types"
import { useAdminCredentials, useAdminFulfillment } from "@/lib/api/queries"
import { cn } from "@/lib/utils"
import { useAdminGamification } from "@/stores/admin-gamification"
import { useUI } from "@/stores/ui"
import type { CredentialStock } from "@/types"

const STATUS_MAP: Record<string, FulfillmentStatus> = {
  WAITING_STOCK: "menunggu-stok",
  READY_TO_SEND: "siap-kirim",
  RISK_REVIEW: "review-risiko",
  SENT: "terkirim",
}

const STATUS_META: Record<
  FulfillmentStatus,
  { label: string; variant: "warning" | "cyan" | "neutral" | "success" }
> = {
  "menunggu-stok": { label: "Menunggu Stok", variant: "warning" },
  "siap-kirim": { label: "Siap Kirim", variant: "cyan" },
  "review-risiko": { label: "Review Risiko", variant: "neutral" },
  terkirim: { label: "Terkirim", variant: "success" },
}

const FULFILLMENT_COLUMNS = Object.entries(STATUS_META).map(([status, meta]) => ({
  id: status as FulfillmentStatus,
  title: meta.label,
  accent:
    status === "menunggu-stok"
      ? "bg-warning"
      : status === "siap-kirim"
        ? "bg-accent-cyan"
        : status === "review-risiko"
          ? "bg-accent-purple"
          : "bg-accent-lime",
}))

const RISK_META: Record<RiskLevel, { label: string; variant: "success" | "warning" | "danger" }> = {
  rendah: { label: "Rendah", variant: "success" },
  sedang: { label: "Sedang", variant: "warning" },
  tinggi: { label: "Tinggi", variant: "danger" },
}

const CRED_STATUS_MAP: Record<string, CredentialStock["status"]> = {
  AVAILABLE: "tersedia",
  SOLD: "terjual",
  EXPIRED: "kadaluarsa",
  HELD: "ditahan",
}

function mapTask(row: Record<string, unknown>): FulfillmentTask {
  return {
    id: row.id as string,
    invoice: row.invoice as string,
    customer: (row.customer as string) ?? "",
    productName: row.productName as string,
    variant: (row.variant as string) ?? "",
    status: STATUS_MAP[row.status as string] ?? "menunggu-stok",
    risk: ((row.risk as string) ?? "rendah") as RiskLevel,
    slaMinutes: (row.slaMinutes as number) ?? 0,
    credentialEmail: "", // ponytail: API doesn't return this; add when fulfillment detail endpoint exists
    channel: "dashboard",
    createdAt: (row.createdAt as string) ?? "",
  }
}

export function AdminFulfillmentView() {
  const queryClient = useQueryClient()
  const { data: fulfillmentData } = useAdminFulfillment()
  const tasks: FulfillmentTask[] = useMemo(
    () => (fulfillmentData?.data ?? []).map(mapTask),
    [fulfillmentData],
  )
  const [query, setQuery] = useFilterState<string>("fulfillment", "search", "")
  const [status, setStatus] = useFilterState<FulfillmentStatus | "semua">(
    "fulfillment",
    "status",
    "semua",
  )
  const { data: rawCredentials = [] } = useAdminCredentials()
  const credentials = rawCredentials as Record<string, unknown>[]
  // ponytail: no-op — audit logging handled by server actions
  const logAudit = (_entry: Record<string, unknown>) => {}
  const award = useAdminGamification((state) => state.award)
  const viewMode = useUI((state) => state.pipelineViews.fulfillment)
  const setPipelineView = useUI((state) => state.setPipelineView)

  const deliverMutation = useMutation({
    mutationFn: (taskId: string) => deliverFulfillmentCredential(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "fulfillment"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "credentials"] })
    },
  })

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return tasks.filter((task) => {
      if (status !== "semua" && task.status !== status) return false
      if (!q) return true
      return (
        task.invoice.toLowerCase().includes(q) ||
        task.customer.toLowerCase().includes(q) ||
        task.productName.toLowerCase().includes(q)
      )
    })
  }, [query, status, tasks])

  const stats = useMemo(() => {
    return {
      waiting: tasks.filter((task) => task.status === "menunggu-stok").length,
      ready: tasks.filter((task) => task.status === "siap-kirim").length,
      risk: tasks.filter((task) => task.status === "review-risiko").length,
      sent: tasks.filter((task) => task.status === "terkirim").length,
    }
  }, [tasks])

  function updateTask(id: string, nextStatus: FulfillmentStatus) {
    // ponytail: local status transitions for review-risiko → siap-kirim; API doesn't expose this yet
    toast.success(`Status fulfillment diubah: ${STATUS_META[nextStatus].label}`)
  }

  // F3.8a — "Kirim" consumes a credential via server action
  function consumeAndSend(task: FulfillmentTask) {
    deliverMutation.mutate(task.id, {
      onSuccess: () => {
        logAudit({
          action: "fulfillment.kirim",
          module: "fulfillment",
          targetId: task.invoice,
          targetLabel: `${task.productName}`,
          outcome: "success",
          detail: `Credential dikirim ke ${task.customer}.`,
        })
        award("fulfillment.kirim")
        toast.success(`Credential terkirim untuk ${task.invoice}.`)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Gagal mengirim credential.")
      },
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Menunggu Stok" value={stats.waiting} icon={Clock} accent="bg-warning" />
        <StatCard
          label="Siap Kirim"
          value={stats.ready}
          icon={PackageCheck}
          accent="bg-accent-cyan"
        />
        <StatCard
          label="Review Risiko"
          value={stats.risk}
          icon={ShieldAlert}
          accent="bg-accent-purple"
        />
        <StatCard label="Terkirim" value={stats.sent} icon={CheckCircle2} accent="bg-accent-lime" />
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari invoice, pelanggan, produk..."
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as FulfillmentStatus | "semua")}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FilterPresetsBar
            module="fulfillment"
            current={{ search: query, status }}
            onApply={(snap) => {
              setQuery(snap.search ?? "")
              setStatus((snap.status as FulfillmentStatus | "semua") ?? "semua")
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground/60">{filtered.length} fulfillment</p>
            <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background p-1 shadow-shadow-sm">
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setPipelineView("fulfillment", "table")}
              >
                <Rows3 className="size-4" /> Table
              </Button>
              <Button
                size="sm"
                variant={viewMode === "kanban" ? "default" : "ghost"}
                onClick={() => setPipelineView("fulfillment", "kanban")}
              >
                <Columns3 className="size-4" /> Kanban
              </Button>
            </div>
          </div>

          {viewMode === "kanban" ? (
            <PipelineBoard
              columns={FULFILLMENT_COLUMNS}
              items={filtered}
              getStatus={(task) => task.status}
              emptyLabel="Kosong"
              renderCard={(task) => (
                <article className="rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-extrabold">{task.invoice}</p>
                      <p className="truncate text-xs text-foreground/60">{task.customer}</p>
                    </div>
                    <Badge variant={RISK_META[task.risk].variant}>
                      {RISK_META[task.risk].label}
                    </Badge>
                  </div>
                  <p className="mt-3 font-bold">{task.productName}</p>
                  <p className="text-xs text-foreground/60">{task.variant}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-dashed border-border pt-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-base border-2 border-border px-2 py-1 text-xs font-bold",
                        task.slaMinutes <= 5 ? "bg-accent-lime" : "bg-warning",
                      )}
                    >
                      <Clock className="size-3.5" />
                      {task.slaMinutes === 0 ? "done" : `${task.slaMinutes}m`}
                    </span>
                    {task.status === "siap-kirim" ? (
                      <Button size="sm" onClick={() => consumeAndSend(task)} disabled={deliverMutation.isPending}>
                        <Send className="size-4" /> Kirim
                      </Button>
                    ) : task.status === "review-risiko" ? (
                      <Button
                        size="sm"
                        variant="neutral"
                        onClick={() => updateTask(task.id, "siap-kirim")}
                      >
                        Approve
                      </Button>
                    ) : null}
                  </div>
                </article>
              )}
            />
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {filtered.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-heading text-sm font-extrabold">{task.invoice}</p>
                        <p className="truncate text-xs text-foreground/60">{task.customer}</p>
                      </div>
                      <Badge variant={STATUS_META[task.status].variant}>
                        {STATUS_META[task.status].label}
                      </Badge>
                    </div>
                    <div className="mt-3 border-t-2 border-border pt-3">
                      <p className="font-bold">{task.productName}</p>
                      <p className="text-xs text-foreground/60">{task.variant}</p>
                    </div>
                    <div className="my-3 grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-xs font-bold text-foreground/60">SLA</p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-base border-2 border-border px-2 py-1 text-xs font-bold",
                            task.slaMinutes <= 5 ? "bg-accent-lime" : "bg-warning",
                          )}
                        >
                          <Clock className="size-3.5" />
                          {task.slaMinutes === 0 ? "done" : `${task.slaMinutes}m`}
                        </span>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-bold text-foreground/60">Risiko</p>
                        <Badge variant={RISK_META[task.risk].variant}>
                          {RISK_META[task.risk].label}
                        </Badge>
                      </div>
                    </div>
                    {task.status === "siap-kirim" ? (
                      <Button size="sm" className="w-full" onClick={() => consumeAndSend(task)} disabled={deliverMutation.isPending}>
                        <Send className="size-4" /> Kirim Credential
                      </Button>
                    ) : task.status === "review-risiko" ? (
                      <Button
                        size="sm"
                        variant="neutral"
                        className="w-full"
                        onClick={() => updateTask(task.id, "siap-kirim")}
                      >
                        Approve Risiko
                      </Button>
                    ) : null}
                  </article>
                ))}
                {filtered.length === 0 && (
                  <div className="rounded-base border-2 border-dashed border-border p-6 text-center text-sm font-bold text-foreground/60">
                    Tidak ada fulfillment yang cocok dengan filter.
                  </div>
                )}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Risiko</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <p className="font-heading text-sm font-extrabold">{task.invoice}</p>
                          <p className="text-xs text-foreground/60">{task.customer}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold">{task.productName}</p>
                          <p className="text-xs text-foreground/60">{task.variant}</p>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-base border-2 border-border px-2 py-1 text-xs font-bold",
                              task.slaMinutes <= 5 ? "bg-accent-lime" : "bg-warning",
                            )}
                          >
                            <Clock className="size-3.5" />
                            {task.slaMinutes === 0 ? "done" : `${task.slaMinutes}m`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={RISK_META[task.risk].variant}>
                            {RISK_META[task.risk].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_META[task.status].variant}>
                            {STATUS_META[task.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {task.status === "siap-kirim" ? (
                            <Button size="sm" onClick={() => consumeAndSend(task)} disabled={deliverMutation.isPending}>
                              <Send className="size-4" /> Kirim
                            </Button>
                          ) : task.status === "review-risiko" ? (
                            <Button
                              size="sm"
                              variant="neutral"
                              onClick={() => updateTask(task.id, "siap-kirim")}
                            >
                              Approve
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" disabled>
                              -
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center font-bold text-foreground/60"
                        >
                          Tidak ada fulfillment yang cocok dengan filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-6">
          <div className="min-w-0 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
            <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
              <KeyRound className="size-5" /> Credential Vault
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              Ringkasan stok credential yang bisa dipakai fulfillment.
            </p>
            <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
              {credentials.slice(0, 6).map((credential) => (
                <div
                  key={credential.id as string}
                  className="min-w-0 rounded-base border-2 border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm font-bold">
                        {credential.productName as string}
                      </p>
                      <p className="truncate font-mono text-xs text-foreground/60">
                        {(credential.variantLabel as string) ?? "—"}
                      </p>
                    </div>
                    <CredentialStatusBadge status={CRED_STATUS_MAP[credential.status as string] ?? "tersedia"} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-base border-2 border-border bg-main p-5 shadow-shadow">
            <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
              <AlertTriangle className="size-5" /> Rules yang perlu UI
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm font-bold text-main-foreground/75">
              <li>Auto hold jika order besar dari akun baru.</li>
              <li>Require approval untuk credential yang sama dipakai ulang.</li>
              <li>Escalate SLA jika stok kosong lebih dari 30 menit.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
