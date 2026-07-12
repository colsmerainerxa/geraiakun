"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  Clock,
  Columns3,
  Inbox,
  Mail,
  MessageSquareReply,
  Phone,
  Rows3,
  Search,
  Send,
  Star,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { FilterPresetsBar } from "@/components/admin/filter-presets-bar"
import { StatCard } from "@/components/admin/parts"
import { PipelineBoard } from "@/components/admin/pipeline-board"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, usePagination } from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { replyTicket, updateTicketStatus } from "@/app/actions/admin-tickets"
import { useFilterState } from "@/lib/hooks/use-filter-state"
import { useAdminTickets } from "@/lib/api/queries"
import { cn, formatDate, formatNumber, initials } from "@/lib/utils"
import { useAdminGamification } from "@/stores/admin-gamification"
import { useUI } from "@/stores/ui"
import type { Ticket, TicketMessage, TicketStatus, TicketType, TicketPriority } from "@/types"

const TICKET_STATUS_MAP: Record<string, TicketStatus> = {
  NEW: "baru",
  REVIEWING: "ditinjau",
  PROCESSING: "diproses",
  DONE: "selesai",
  REJECTED: "ditolak",
}

const TICKET_TYPE_MAP: Record<string, TicketType> = {
  WARRANTY: "garansi",
  PAYMENT: "pembayaran",
  ACCOUNT: "akun",
  OTHER: "lainnya",
}

const TICKET_PRIORITY_MAP: Record<string, TicketPriority> = {
  LOW: "rendah",
  NORMAL: "normal",
  HIGH: "tinggi",
}

function mapTicket(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    code: row.code as string,
    type: TICKET_TYPE_MAP[row.type as string] ?? "lainnya",
    subject: row.subject as string,
    description: (row.description as string) ?? "",
    invoice: (row.invoice as string) ?? null,
    productId: (row.productId as string) ?? null,
    productName: (row.productName as string) ?? null,
    priority: TICKET_PRIORITY_MAP[row.priority as string] ?? "normal",
    status: TICKET_STATUS_MAP[row.status as string] ?? "baru",
    customerName: row.customerName as string,
    customerEmail: row.customerEmail as string,
    whatsapp: (row.whatsapp as string) ?? "",
    messages: (row.messages as TicketMessage[]) ?? [],
    createdAt: (row.createdAt as string) ?? "",
    updatedAt: (row.updatedAt as string) ?? "",
  }
}

const STATUS_META: Record<
  TicketStatus,
  { label: string; variant: "warning" | "cyan" | "success" | "danger" | "neutral" }
> = {
  baru: { label: "Baru", variant: "warning" },
  ditinjau: { label: "Ditinjau", variant: "cyan" },
  diproses: { label: "Diproses", variant: "neutral" },
  selesai: { label: "Selesai", variant: "success" },
  ditolak: { label: "Ditolak", variant: "danger" },
}

const STATUS_OPTIONS: TicketStatus[] = ["baru", "ditinjau", "diproses", "selesai", "ditolak"]

const TICKET_COLUMNS = STATUS_OPTIONS.map((status) => ({
  id: status,
  title: STATUS_META[status].label,
  accent:
    status === "baru"
      ? "bg-warning"
      : status === "ditinjau"
        ? "bg-accent-cyan"
        : status === "diproses"
          ? "bg-accent-purple"
          : status === "selesai"
            ? "bg-accent-lime"
            : "bg-danger",
}))

const TYPE_LABEL: Record<TicketType, string> = {
  garansi: "Garansi",
  pembayaran: "Pembayaran",
  akun: "Akun",
  lainnya: "Lainnya",
}

const PRIORITY_VARIANT: Record<TicketPriority, "neutral" | "warning" | "danger"> = {
  rendah: "neutral",
  normal: "warning",
  tinggi: "danger",
}

const FILTERS: { value: TicketStatus | "semua"; label: string }[] = [
  { value: "semua", label: "Semua Status" },
  { value: "baru", label: "Baru" },
  { value: "ditinjau", label: "Ditinjau" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
]

// Reverse map for sending to API
const STATUS_TO_API: Record<TicketStatus, string> = {
  baru: "NEW",
  ditinjau: "REVIEWING",
  diproses: "PROCESSING",
  selesai: "DONE",
  ditolak: "REJECTED",
}

export function AdminTicketsView() {
  const queryClient = useQueryClient()
  const { data: ticketsData } = useAdminTickets()
  const tickets: Ticket[] = useMemo(
    () => (ticketsData?.data ?? []).map(mapTicket),
    [ticketsData],
  )
  const award = useAdminGamification((s) => s.award)
  const [search, setSearch] = useFilterState<string>("tickets", "search", "")
  const [status, setStatusFilter] = useFilterState<TicketStatus | "semua">(
    "tickets",
    "status",
    "semua",
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reply, setReply] = useState("")
  const viewMode = useUI((state) => state.pipelineViews.tickets)
  const setPipelineView = useUI((state) => state.setPipelineView)

  const replyMutation = useMutation({
    mutationFn: (input: { ticketId: string; message: string }) => replyTicket(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] })
    },
  })

  const stats = useMemo(() => {
    const list = tickets
    return {
      total: list.length,
      open: list.filter((t) => t.status === "baru" || t.status === "ditinjau").length,
      processing: list.filter((t) => t.status === "diproses").length,
      done: list.filter((t) => t.status === "selesai").length,
    }
  }, [tickets])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tickets
      .filter((t) => {
        if (status !== "semua" && t.status !== status) return false
        if (!q) return true
        return (
          t.code.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          (t.invoice?.toLowerCase().includes(q) ?? false)
        )
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [tickets, search, status])

  const active = activeId ? tickets.find((t) => t.id === activeId) : null

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { page, setPage, pageCount, paged, total, pageSize } = usePagination(filtered, 8)

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const pageIds = paged.map((t) => t.id)
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

  function bulkSetStatus(next: TicketStatus) {
    if (selected.size === 0) return
    selected.forEach((id) => {
      statusMutation.mutate({ ticketId: id, status: STATUS_TO_API[next] })
    })
    if (next === "selesai") award("ticket.resolved")
    toast.success(`${selected.size} tiket diubah ke "${STATUS_META[next].label}"`)
    setSelected(new Set())
  }

  function sendReply() {
    if (!active) return
    const text = reply.trim()
    if (!text) return
    replyMutation.mutate(
      { ticketId: active.id, message: text },
      {
        onSuccess: () => {
          toast.success(`Balasan terkirim ke ${active.code}`)
        },
      },
    )
    setReply("")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Inbox} label="Total Tiket" value={stats.total} accent="bg-accent-cyan" />
        <StatCard icon={Clock} label="Perlu Tindakan" value={stats.open} accent="bg-warning" />
        <StatCard
          icon={ArrowRight}
          label="Diproses"
          value={stats.processing}
          accent="bg-accent-purple"
        />
        <StatCard icon={Star} label="Selesai" value={stats.done} accent="bg-accent-lime" />
      </div>

      <div
        className={cn(
          "grid gap-6",
          viewMode === "kanban" ? "lg:grid-cols-[minmax(0,1fr)_420px]" : "lg:grid-cols-[380px_1fr]",
        )}
      >
        {/* List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode / subjek / pelanggan..."
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => setStatusFilter(v as TicketStatus | "semua")}
            >
              <SelectTrigger className="w-40">
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

          <FilterPresetsBar
            module="tickets"
            current={{ search, status }}
            onApply={(snap) => {
              setSearch(snap.search ?? "")
              setStatusFilter((snap.status as TicketStatus | "semua") ?? "semua")
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground/60">{filtered.length} tiket</p>
            <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background p-1 shadow-shadow-sm">
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setPipelineView("tickets", "table")}
              >
                <Rows3 className="size-4" /> List
              </Button>
              <Button
                size="sm"
                variant={viewMode === "kanban" ? "default" : "ghost"}
                onClick={() => setPipelineView("tickets", "kanban")}
              >
                <Columns3 className="size-4" /> Kanban
              </Button>
            </div>
          </div>

          {selected.size > 0 && viewMode === "table" && (
            <div className="flex flex-wrap items-center gap-2 rounded-base border-2 border-border bg-main p-2.5 shadow-shadow-sm">
              <span className="font-heading text-xs font-extrabold text-main-foreground">
                {selected.size} terpilih
              </span>
              <Button size="sm" variant="neutral" onClick={() => bulkSetStatus("selesai")}>
                Tutup (Selesai)
              </Button>
              <Button size="sm" variant="neutral" onClick={() => bulkSetStatus("diproses")}>
                Proses
              </Button>
              <Button size="sm" variant="neutral" onClick={() => setSelected(new Set())}>
                Batal
              </Button>
            </div>
          )}

          {viewMode === "kanban" ? (
            <PipelineBoard
              columns={TICKET_COLUMNS}
              items={filtered}
              getStatus={(ticket) => ticket.status}
              emptyLabel="Kosong"
              renderCard={(ticket) => (
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(ticket.id)
                    setReply("")
                  }}
                  className={cn(
                    "w-full rounded-base border-2 border-border bg-secondary-background p-3 text-left shadow-shadow-sm",
                    activeId === ticket.id && "ring-4 ring-main/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-xs font-extrabold text-foreground/60">
                      {ticket.code}
                    </span>
                    <Badge variant={PRIORITY_VARIANT[ticket.priority]}>
                      <Star className="size-3" /> {ticket.priority}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 font-heading text-sm font-bold">
                    {ticket.subject}
                  </p>
                  <div className="mt-3 border-t-2 border-dashed border-border pt-3 text-xs text-foreground/60">
                    <p className="truncate font-bold text-foreground">{ticket.customerName}</p>
                    <p>
                      {TYPE_LABEL[ticket.type]}
                      {ticket.invoice ? ` - ${ticket.invoice}` : ""}
                    </p>
                  </div>
                </button>
              )}
            />
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {filtered.length > 0 && (
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
                {total === 0 ? (
                  <div className="rounded-base border-2 border-dashed border-border py-12 text-center text-sm text-foreground/60">
                    Tidak ada tiket.
                  </div>
                ) : (
                  paged.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "flex gap-2 rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow-sm",
                        activeId === t.id && "ring-4 ring-main/40",
                        selected.has(t.id) && "bg-main/20",
                      )}
                    >
                      <Checkbox
                        checked={selected.has(t.id)}
                        onCheckedChange={(v) => toggleRow(t.id, !!v)}
                        aria-label={`Pilih ${t.code}`}
                        className="mt-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(t.id)
                          setReply("")
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-heading text-xs font-extrabold text-foreground/60">
                            {t.code}
                          </span>
                          <Badge variant={STATUS_META[t.status].variant}>
                            {STATUS_META[t.status].label}
                          </Badge>
                        </div>
                        <p className="mt-1.5 line-clamp-1 font-heading text-sm font-bold">
                          {t.subject}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-foreground/60">
                          <span className="truncate">{t.customerName}</span>
                          <span>·</span>
                          <span>{TYPE_LABEL[t.type]}</span>
                          {t.priority === "tinggi" && (
                            <Badge variant="danger" className="ml-auto px-1.5 py-0 text-[10px]">
                              Prioritas
                            </Badge>
                          )}
                        </div>
                      </button>
                    </div>
                  ))
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
        </div>

        {/* Detail */}
        <div className="lg:max-h-[70vh] lg:overflow-y-auto">
          {!active ? (
            <EmptyDetail />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="font-heading text-xs font-extrabold text-foreground/60">
                      {active.code}
                    </span>
                    <h2 className="font-heading text-xl font-extrabold">{active.subject}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_META[active.status].variant}>
                        {STATUS_META[active.status].label}
                      </Badge>
                      <Badge variant="neutral">{TYPE_LABEL[active.type]}</Badge>
                      <Badge variant={PRIORITY_VARIANT[active.priority]}>
                        <Star className="size-3" /> {active.priority}
                      </Badge>
                      {active.invoice && (
                        <span className="text-xs text-foreground/60">
                          Invoice: <strong>{active.invoice}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="status-sel" className="sr-only">
                      Ubah status
                    </Label>
                    <Select
                      value={active.status}
                      onValueChange={(v) => {
                        const nextStatus = v as TicketStatus
                        statusMutation.mutate(
                          { ticketId: active.id, status: STATUS_TO_API[nextStatus] },
                          {
                            onSuccess: () => {
                              if (nextStatus === "selesai") award("ticket.resolved")
                              toast.success(`Status diubah: ${STATUS_META[nextStatus].label}`)
                            },
                          },
                        )
                      }}
                    >
                      <SelectTrigger id="status-sel" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_META[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Customer */}
                <div className="mt-4 flex flex-wrap gap-4 border-t-2 border-dashed border-border pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarFallback>{initials(active.customerName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold leading-tight">{active.customerName}</p>
                      <p className="text-xs text-foreground/60">
                        Diperbarui {formatDate(active.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-foreground/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {active.customerEmail}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {active.whatsapp}
                    </span>
                  </div>
                  {active.productName && (
                    <span className="ml-auto self-center rounded-base border-2 border-border bg-background px-2.5 py-1 text-xs font-bold">
                      {active.productName}
                    </span>
                  )}
                </div>
              </div>

              {/* Conversation */}
              <div className="flex flex-col gap-3">
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-wide text-foreground/60">
                  Percakapan ({formatNumber(active.messages.length)})
                </h3>
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex gap-3", m.role === "agen" && "flex-row-reverse")}
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback>
                        {m.role === "agen" ? "CS" : initials(m.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-base border-2 border-border p-3 text-sm shadow-shadow-sm",
                        m.role === "agen" ? "bg-main" : "bg-secondary-background",
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs font-bold">
                        {m.role === "agen" ? "CS geraiakun" : m.author}
                        <Badge
                          variant={m.role === "agen" ? "neutral" : "lime"}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {m.role === "agen" ? "Agen" : "Pelanggan"}
                        </Badge>
                      </div>
                      <p className="leading-relaxed">{m.message}</p>
                      <span className="mt-1 block text-[10px] text-foreground/60">
                        {formatDate(m.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              {active.status !== "selesai" && active.status !== "ditolak" ? (
                <div className="sticky bottom-0 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
                  <Label htmlFor="admin-reply" className="flex items-center gap-1.5">
                    <MessageSquareReply className="size-4" /> Balas sebagai CS
                  </Label>
                  <Textarea
                    id="admin-reply"
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Tulis balasan untuk pelanggan..."
                    className="mt-2"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground/60">
                      Membalas akan mengubah status tiket jadi "Ditinjau".
                    </span>
                    <Button onClick={sendReply} disabled={!reply.trim() || replyMutation.isPending}>
                      <Send className="size-4" /> Kirim
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-base border-2 border-dashed border-border bg-background p-4 text-center text-sm text-foreground/60">
                  Tiket ini sudah <strong>{STATUS_META[active.status].label}</strong>. Ubah status
                  di atas untuk membuka kembali percakapan.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyDetail() {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-base border-2 border-dashed border-border py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow">
        <Inbox className="size-7" />
      </span>
      <h3 className="font-heading text-lg font-bold">Pilih tiket</h3>
      <p className="max-w-xs text-sm text-foreground/60">
        Pilih tiket dari daftar di kiri untuk membaca percakapan dan membalas pelanggan.
      </p>
    </div>
  )
}

// Re-export so the page can show a skeleton while the persisted store hydrates.
export function AdminTicketsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}
