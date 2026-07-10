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
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { requestRefund } from "@/app/actions/refunds"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type RefundCase, type RefundStatus } from "@/types"
import { useUserRefunds } from "@/lib/api/queries"
import { cn, formatDate, formatIDR } from "@/lib/utils"

const STATUS_KEY: Record<RefundStatus, string> = {
  draft: "statusDraft",
  review: "statusReview",
  replacement: "statusReplacement",
  refund: "statusRefund",
  rejected: "statusRejected",
  closed: "statusClosed",
}
const STATUS_VARIANT: Record<RefundStatus, "neutral" | "warning" | "cyan" | "success" | "danger"> =
  {
    draft: "neutral",
    review: "warning",
    replacement: "cyan",
    refund: "danger",
    rejected: "danger",
    closed: "success",
  }

export function RefundCenterView() {
  const t = useTranslations("refundCenter")
  const [query, setQuery] = useState("")
  const { data: refundCases = [] as RefundCase[] } = useUserRefunds()
  const [selectedId, setSelectedId] = useState("")
  const selected = refundCases.find((item: RefundCase) => item.id === selectedId) ?? refundCases[0]
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return refundCases
    return refundCases.filter(
      (item: RefundCase) =>
        item.id.toLowerCase().includes(q) ||
        item.orderInvoice.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q),
    )
  }, [query, refundCases])

  function statusMeta(status: RefundStatus) {
    return { label: t(STATUS_KEY[status]), variant: STATUS_VARIANT[status] }
  }

  async function submitDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    try {
      const result = await requestRefund({
        invoice: String(formData.get("invoice") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      })
      toast.success(t("toastDraftTitle"), {
        description: `${t("toastDraftDesc")} ${result.id}`,
      })
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refund gagal diajukan.")
    }
  }

  return (
    <Container className="py-12">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <ResolutionStat icon={FileText} label={t("statActive")} value="2" accent="bg-accent-cyan" />
        <ResolutionStat
          icon={RefreshCcw}
          label={t("statReplacement")}
          value="1"
          accent="bg-accent-purple"
        />
        <ResolutionStat
          icon={Wallet}
          label={t("statRefundValue")}
          value={formatIDR(90000)}
          accent="bg-accent-pink"
        />
        <ResolutionStat icon={Clock} label={t("statSla")} value="1,4 jam" accent="bg-accent-lime" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr]">
        <section className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map((item: RefundCase) => (
              <CaseButton
                key={item.id}
                item={item}
                statusLabel={statusMeta(item.status).label}
                statusVariant={statusMeta(item.status).variant}
                active={item.id === selected?.id}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
          </div>

          <form
            onSubmit={submitDraft}
            className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
          >
            <h3 className="font-heading text-lg font-extrabold">{t("formTitle")}</h3>
            <p className="mt-1 text-sm text-foreground/60">{t("formDesc")}</p>
            <div className="mt-4 grid gap-3">
              <div>
                <Label htmlFor="invoice">{t("fieldInvoice")}</Label>
                <Input id="invoice" name="invoice" placeholder="INV-20260001" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="reason">{t("fieldReason")}</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  placeholder={t("reasonPlaceholder")}
                  className="mt-1.5"
                />
              </div>
              <Button type="submit">
                <RotateCcw className="size-4" /> {t("submitDraft")}
              </Button>
            </div>
          </form>
        </section>

        {selected && (
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-border bg-main p-6">
                <div>
                  <Badge variant={statusMeta(selected.status).variant}>
                    {statusMeta(selected.status).label}
                  </Badge>
                  <h2 className="mt-2 font-heading text-2xl font-extrabold">{selected.id}</h2>
                  <p className="text-sm font-bold text-main-foreground/70">
                    {selected.orderInvoice} - {selected.productName}
                  </p>
                </div>
                <div className="rounded-base border-2 border-border bg-secondary-background px-4 py-3 text-right shadow-shadow-sm">
                  <p className="text-xs font-bold uppercase text-foreground/50">{t("estValue")}</p>
                  <p className="font-heading text-xl font-extrabold">
                    {formatIDR(selected.amount)}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 p-6 lg:grid-cols-[1fr_260px]">
                <div>
                  <p className="font-heading text-sm font-extrabold">{t("reasonTitle")}</p>
                  <p className="mt-1 rounded-base border-2 border-border bg-background p-4 text-sm text-foreground/70">
                    {selected.reason}
                  </p>

                  <div className="mt-5">
                    <p className="font-heading text-sm font-extrabold">{t("timelineTitle")}</p>
                    <div className="mt-3 flex flex-col gap-3">
                      {(selected.timeline as Array<{ label: string; done: boolean }>).map((step, index) => (
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
                              {step.done ? t("stepDone") : t("stepPending")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="rounded-base border-2 border-dashed border-border bg-background p-4">
                  <p className="font-heading text-sm font-extrabold">{t("ownerSlaTitle")}</p>
                  <dl className="mt-3 grid gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-bold uppercase text-foreground/50">
                        {t("ownerHandled")}
                      </dt>
                      <dd className="font-bold">{selected.owner}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase text-foreground/50">
                        {t("updatedAt")}
                      </dt>
                      <dd className="font-bold">{formatDate(selected.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase text-foreground/50">
                        {t("policy")}
                      </dt>
                      <dd className="font-bold">{t("policyRefund")}</dd>
                    </div>
                  </dl>
                </aside>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: t("featureReplacementTitle"),
                  desc: t("featureReplacementDesc"),
                  accent: "bg-accent-lime",
                },
                {
                  icon: Clock,
                  title: t("featureSlaTitle"),
                  desc: t("featureSlaDesc"),
                  accent: "bg-accent-cyan",
                },
                {
                  icon: Wallet,
                  title: t("featureRefundTitle"),
                  desc: t("featureRefundDesc"),
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
  statusLabel,
  statusVariant,
  active,
  onClick,
}: {
  item: RefundCase
  statusLabel: string
  statusVariant: "neutral" | "warning" | "cyan" | "success" | "danger"
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
          <p className="text-xs font-bold text-foreground/60">{item.orderInvoice}</p>
        </div>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
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
