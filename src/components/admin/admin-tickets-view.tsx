"use client"

import {
  ArrowRight,
  Clock,
  Inbox,
  Mail,
  MessageSquareReply,
  Phone,
  Search,
  Send,
  Star,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatDate, formatNumber, initials } from "@/lib/utils"
import { useTickets } from "@/stores/tickets"
import type { Ticket, TicketStatus } from "@/types"

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

const TYPE_LABEL: Record<Ticket["type"], string> = {
  garansi: "Garansi",
  pembayaran: "Pembayaran",
  akun: "Akun",
  lainnya: "Lainnya",
}

const PRIORITY_VARIANT: Record<Ticket["priority"], "neutral" | "warning" | "danger"> = {
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

export function AdminTicketsView() {
  const tickets = useTickets((s) => s.tickets)
  const setStatus = useTickets((s) => s.setStatus)
  const adminReply = useTickets((s) => s.adminReply)
  const [search, setSearch] = useState("")
  const [status, setStatusFilter] = useState<TicketStatus | "semua">("semua")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reply, setReply] = useState("")

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

  function sendReply() {
    if (!active) return
    const text = reply.trim()
    if (!text) return
    adminReply(active.id, { author: "CS beliakun", message: text })
    setReply("")
    toast.success(`Balasan terkirim ke ${active.code}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={Inbox} label="Total Tiket" value={stats.total} accent="bg-accent-cyan" />
        <MiniStat icon={Clock} label="Perlu Tindakan" value={stats.open} accent="bg-warning" />
        <MiniStat
          icon={ArrowRight}
          label="Diproses"
          value={stats.processing}
          accent="bg-accent-purple"
        />
        <MiniStat icon={Star} label="Selesai" value={stats.done} accent="bg-accent-lime" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
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

          <div className="flex flex-col gap-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {filtered.length === 0 ? (
              <div className="rounded-base border-2 border-dashed border-border py-12 text-center text-sm text-foreground/50">
                Tidak ada tiket.
              </div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveId(t.id)
                    setReply("")
                  }}
                  className={cn(
                    "rounded-base border-2 border-border bg-secondary-background p-4 text-left shadow-shadow-sm transition-all hover:-translate-y-0.5",
                    activeId === t.id && "ring-4 ring-main/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-xs font-extrabold text-foreground/50">
                      {t.code}
                    </span>
                    <Badge variant={STATUS_META[t.status].variant}>
                      {STATUS_META[t.status].label}
                    </Badge>
                  </div>
                  <p className="mt-1.5 line-clamp-1 font-heading text-sm font-bold">{t.subject}</p>
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
              ))
            )}
          </div>
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
                    <span className="font-heading text-xs font-extrabold text-foreground/50">
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
                        setStatus(active.id, v as TicketStatus)
                        toast.success(`Status diubah: ${STATUS_META[v as TicketStatus].label}`)
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
                <h3 className="font-heading text-sm font-extrabold uppercase tracking-wide text-foreground/50">
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
                        {m.role === "agen" ? "CS beliakun" : m.author}
                        <Badge
                          variant={m.role === "agen" ? "neutral" : "lime"}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {m.role === "agen" ? "Agen" : "Pelanggan"}
                        </Badge>
                      </div>
                      <p className="leading-relaxed">{m.message}</p>
                      <span className="mt-1 block text-[10px] text-foreground/50">
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
                    <span className="text-xs text-foreground/50">
                      Membalas akan mengubah status tiket jadi "Ditinjau".
                    </span>
                    <Button onClick={sendReply} disabled={!reply.trim()}>
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

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Inbox
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
          accent,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">{label}</p>
        <p className="font-heading text-xl font-extrabold">{value}</p>
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
