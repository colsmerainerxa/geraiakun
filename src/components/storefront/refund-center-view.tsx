"use client"

import {
  CheckCircle2,
  Clock,
  FileText,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { refundCases, type RefundCase, type RefundStatus } from "@/lib/mock/enterprise"
import { cn, formatDate, formatIDR } from "@/lib/utils"

const STATUS_META: Record<
  RefundStatus,
  { label: string; variant: "neutral" | "warning" | "cyan" | "success" | "danger" }
> = {
  draft: { label: "Draft", variant: "neutral" },
  review: { label: "Direview", variant: "warning" },
  replacement: { label: "Ganti Akun", variant: "cyan" },
  refund: { label: "Refund", variant: "danger" },
  closed: { label: "Selesai", variant: "success" },
}

export function RefundCenterView() {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(refundCases[0]?.id ?? "")
  const selected = refundCases.find((item) => item.id === selectedId) ?? refundCases[0]
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return refundCases
    return refundCases.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.invoice.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q),
    )
  }, [query])

  function submitDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    toast.success("Draft klaim dibuat", {
      description: "UI demo: data belum dikirim ke backend.",
    })
    event.currentTarget.reset()
  }

  return (
    <Container className="py-12">
      <SectionHeading
        eyebrow="RESOLUTION CENTER"
        title="Refund & Replacement Center"
        subtitle="Alur self-service untuk klaim garansi, ganti akun, refund pembayaran, dan transparansi SLA penanganan."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <ResolutionStat icon={FileText} label="Kasus aktif" value="2" accent="bg-accent-cyan" />
        <ResolutionStat icon={RefreshCcw} label="Ganti akun" value="1" accent="bg-accent-purple" />
        <ResolutionStat
          icon={Wallet}
          label="Nilai refund"
          value={formatIDR(90000)}
          accent="bg-accent-pink"
        />
        <ResolutionStat
          icon={Clock}
          label="SLA rata-rata"
          value="1,4 jam"
          accent="bg-accent-lime"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr]">
        <section className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari invoice atau kode klaim..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map((item) => (
              <CaseButton
                key={item.id}
                item={item}
                active={item.id === selected?.id}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
          </div>

          <form
            onSubmit={submitDraft}
            className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
          >
            <h3 className="font-heading text-lg font-extrabold">Buat klaim baru</h3>
            <p className="mt-1 text-sm text-foreground/60">
              Simulasi UI untuk refund, replacement, atau eskalasi garansi.
            </p>
            <div className="mt-4 grid gap-3">
              <div>
                <Label htmlFor="invoice">Invoice</Label>
                <Input id="invoice" name="invoice" placeholder="INV-20260001" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="reason">Masalah</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  placeholder="Jelaskan kendala akun atau pembayaran..."
                  className="mt-1.5"
                />
              </div>
              <Button type="submit">
                <RotateCcw className="size-4" /> Simpan Draft
              </Button>
            </div>
          </form>
        </section>

        {selected && (
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-border bg-main p-6">
                <div>
                  <Badge variant={STATUS_META[selected.status].variant}>
                    {STATUS_META[selected.status].label}
                  </Badge>
                  <h2 className="mt-2 font-heading text-2xl font-extrabold">{selected.id}</h2>
                  <p className="text-sm font-bold text-main-foreground/70">
                    {selected.invoice} - {selected.productName}
                  </p>
                </div>
                <div className="rounded-base border-2 border-border bg-secondary-background px-4 py-3 text-right shadow-shadow-sm">
                  <p className="text-xs font-bold uppercase text-foreground/50">Estimasi nilai</p>
                  <p className="font-heading text-xl font-extrabold">
                    {formatIDR(selected.amount)}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 p-6 lg:grid-cols-[1fr_260px]">
                <div>
                  <p className="font-heading text-sm font-extrabold">Alasan klaim</p>
                  <p className="mt-1 rounded-base border-2 border-border bg-background p-4 text-sm text-foreground/70">
                    {selected.reason}
                  </p>

                  <div className="mt-5">
                    <p className="font-heading text-sm font-extrabold">Timeline penyelesaian</p>
                    <div className="mt-3 flex flex-col gap-3">
                      {selected.timeline.map((step, index) => (
                        <div key={step.label} className="flex gap-3">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-base border-2 border-border font-heading text-xs font-extrabold shadow-shadow-sm",
                              step.done ? "bg-accent-lime" : "bg-background",
                            )}
                          >
                            {step.done ? <CheckCircle2 className="size-4" /> : index + 1}
                          </span>
                          <div>
                            <p className="font-heading text-sm font-bold">{step.label}</p>
                            <p className="text-xs text-foreground/50">
                              {step.done ? "Selesai" : "Menunggu aksi berikutnya"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="rounded-base border-2 border-dashed border-border bg-background p-4">
                  <p className="font-heading text-sm font-extrabold">Owner & SLA</p>
                  <dl className="mt-3 grid gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-bold uppercase text-foreground/50">Ditangani</dt>
                      <dd className="font-bold">{selected.owner}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase text-foreground/50">Update</dt>
                      <dd className="font-bold">{formatDate(selected.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase text-foreground/50">Kebijakan</dt>
                      <dd className="font-bold">Refund 1-3 hari kerja</dd>
                    </div>
                  </dl>
                </aside>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Replacement dulu",
                  desc: "Untuk produk digital, sistem memprioritaskan akun pengganti sebelum refund.",
                  accent: "bg-accent-lime",
                },
                {
                  icon: Clock,
                  title: "SLA terlihat",
                  desc: "Pelanggan melihat siapa owner kasus dan progres setiap tahap.",
                  accent: "bg-accent-cyan",
                },
                {
                  icon: Wallet,
                  title: "Refund transparan",
                  desc: "Nominal, metode, dan estimasi pencairan tampil sejak awal.",
                  accent: "bg-accent-pink",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm"
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                      item.accent,
                    )}
                  >
                    <item.icon className="size-5" />
                  </span>
                  <p className="mt-3 font-heading text-sm font-extrabold">{item.title}</p>
                  <p className="mt-1 text-xs text-foreground/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Container>
  )
}

function CaseButton({
  item,
  active,
  onClick,
}: {
  item: RefundCase
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-base border-2 border-border bg-secondary-background p-4 text-left shadow-shadow-sm transition-all hover:-translate-y-0.5",
        active && "ring-4 ring-main/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-sm font-extrabold">{item.id}</p>
          <p className="text-xs font-bold text-foreground/60">{item.invoice}</p>
        </div>
        <Badge variant={STATUS_META[item.status].variant}>{STATUS_META[item.status].label}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{item.reason}</p>
      <p className="mt-3 text-xs font-bold text-foreground/50">{item.productName}</p>
    </button>
  )
}

function ResolutionStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof FileText
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
          accent,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold uppercase tracking-wide text-foreground/50">
          {label}
        </p>
        <p className="truncate font-heading text-xl font-extrabold">{value}</p>
      </div>
    </div>
  )
}
