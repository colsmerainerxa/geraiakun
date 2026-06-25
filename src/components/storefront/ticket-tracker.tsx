"use client"

import { Send } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Link } from "@/i18n/navigation"
import { useTickets } from "@/stores/tickets"
import type { Ticket, TicketStatus, TicketType } from "@/types"
import { cn, formatDate } from "@/lib/utils"

const STATUS_VARIANT: Record<TicketStatus, "neutral" | "warning" | "cyan" | "success" | "danger"> = {
  baru: "warning",
  ditinjau: "cyan",
  diproses: "cyan",
  selesai: "success",
  ditolak: "danger",
}

const TYPE_LABEL: Record<TicketType, { id: string; en: string }> = {
  garansi: { id: "Garansi / Ganti Akun", en: "Warranty / Replace" },
  pembayaran: { id: "Pembayaran / Refund", en: "Payment / Refund" },
  akun: { id: "Akun Bermasalah", en: "Account Issue" },
  lainnya: { id: "Lainnya", en: "Other" },
}

export function TicketTracker() {
  const t = useTranslations("tickets")
  const tw = useTranslations("warranty")
  const isEn = useLocale() === "en"
  const dateLocale = isEn ? "en-US" : "id-ID"
  const searchParams = useSearchParams()
  const getByCode = useTickets((s) => s.getByCode)
  const reply = useTickets((s) => s.reply)
  const tickets = useTickets((s) => s.tickets)

  const initialCode = searchParams.get("code") ?? ""
  const [code, setCode] = useState(initialCode)
  // null = belum search; string = sudah search (bisa tidak ditemukan)
  const [trackedCode, setTrackedCode] = useState<string | null>(
    initialCode || null,
  )

  // Derived dari store — otomatis resync saat tickets berubah (e.g. setelah reply)
  const searched: Ticket | null | undefined = trackedCode
    ? (getByCode(trackedCode) ?? null)
    : undefined

  function track(value: string) {
    const c = value.trim()
    if (!c) return
    const found = getByCode(c)
    setTrackedCode(c)
    if (!found) toast.error(t("notFound"))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search by code */}
      <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <h2 className="font-heading text-lg font-extrabold">{t("title")}</h2>
        <p className="mt-1 text-sm text-foreground/60">{t("subtitle")}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            track(code)
          }}
          className="mt-4 flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("codePlaceholder")}
            aria-label={t("code")}
          />
          <Button type="submit" className="shrink-0">
            {t("track")}
          </Button>
        </form>
        {searched === null && initialCode === "" && code === "" && null}
        {searched === null && (initialCode || code) && (
          <p className="mt-3 rounded-base border-2 border-dashed border-danger/50 bg-danger/10 p-3 text-sm font-bold text-danger">
            {t("notFound")}
          </p>
        )}
      </div>

      {/* My recent tickets (from localStorage) */}
      {tickets.length > 0 && (
        <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
          <h3 className="font-heading text-sm font-extrabold uppercase">
            {t("myTickets")}
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {tickets.slice(0, 5).map((tk) => (
              <li key={tk.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCode(tk.code)
                    setTrackedCode(tk.code)
                  }}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-base border-2 border-border bg-background px-3 py-2 text-left text-sm transition-all hover:-translate-y-0.5"
                >
                  <span className="font-heading font-bold">{tk.code}</span>
                  <span className="truncate text-foreground/70">{tk.subject}</span>
                  <Badge variant={STATUS_VARIANT[tk.status]}>
                    {t(`status${cap(tk.status)}`)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detail */}
      {searched && (
        <TicketDetail
          ticket={searched}
          dateLocale={dateLocale}
          isEn={isEn}
          reply={reply}
          t={t}
          tw={tw}
        />
      )}
    </div>
  )
}

type TranslateFn = (key: string, values?: Record<string, string | number | Date>) => string

function TicketDetail({
  ticket,
  dateLocale,
  isEn,
  reply,
  t,
  tw,
}: {
  ticket: Ticket
  dateLocale: string
  isEn: boolean
  reply: (id: string, message: { author: string; message: string }) => void
  t: TranslateFn
  tw: TranslateFn
}) {
  const [msg, setMsg] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }

  function send(e: React.FormEvent) {
    e.preventDefault()
    if (!msg.trim()) return
    reply(ticket.id, { author: ticket.customerName, message: msg.trim() })
    setMsg("")
    toast.success(t("replied"))
    // Scroll setelah React apply pesan baru
    requestAnimationFrame(scrollToBottom)
  }

  const meta = [
    { label: t("status"), value: <Badge variant={STATUS_VARIANT[ticket.status]}>{t(`status${cap(ticket.status)}`)}</Badge> },
    { label: t("type"), value: TYPE_LABEL[ticket.type][isEn ? "en" : "id"] },
    { label: t("priority"), value: tw(ticket.priority === "rendah" ? "priorityLow" : ticket.priority === "tinggi" ? "priorityHigh" : "priorityNormal") },
    { label: t("created"), value: formatDate(ticket.createdAt, dateLocale) },
    { label: t("updated"), value: formatDate(ticket.updatedAt, dateLocale) },
  ]

  return (
    <div className="overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-main px-5 py-3 text-main-foreground">
        <div>
          <code className="font-heading text-base font-extrabold">{ticket.code}</code>
          <p className="text-xs text-main-foreground/70">{ticket.subject}</p>
        </div>
        <Badge variant={STATUS_VARIANT[ticket.status]}>{t(`status${cap(ticket.status)}`)}</Badge>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 border-b-2 border-border p-5 sm:grid-cols-3 lg:grid-cols-5">
        {meta.map((m) => (
          <div key={m.label}>
            <p className="text-[10px] font-bold uppercase text-foreground/50">{m.label}</p>
            <div className="mt-1 text-sm font-bold">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Conversation */}
      <div className="p-5">
        <h3 className="mb-3 font-heading text-sm font-extrabold uppercase">
          {t("conversation")}
        </h3>
        <div ref={scrollRef} className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
          {ticket.messages.map((m) => {
            const isAgent = m.role === "agen"
            return (
              <div
                key={m.id}
                className={cn("flex", isAgent ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-base border-2 border-border p-3 shadow-shadow-sm",
                    isAgent ? "bg-background" : "bg-main text-main-foreground",
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold opacity-70">
                    {isAgent ? t("agent") : t("you")} · {formatDate(m.date, dateLocale)}
                  </div>
                  <p className="text-sm">{m.message}</p>
                </div>
              </div>
            )
          })}
        </div>

        {ticket.status !== "selesai" && ticket.status !== "ditolak" && (
          <form onSubmit={send} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={2}
              placeholder={t("replyPlaceholder")}
              className="flex-1"
            />
            <Button type="submit" className="shrink-0 sm:w-auto">
              <Send className="size-4" /> {t("reply")}
            </Button>
          </form>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-foreground/50">
          <span>{ticket.customerEmail} · {ticket.whatsapp}</span>
          <Link href="/bantuan" className="hover:underline">
            {t("openNew")}
          </Link>
        </div>
      </div>
    </div>
  )
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
