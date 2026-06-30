"use client"

import {
  Copy,
  Gift,
  MessageCircle,
  Send,
  Share2,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
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
import { useMounted } from "@/hooks/use-mounted"
import { SITE_URL } from "@/lib/seo/site"
import { cn, formatDate, formatIDR, formatNumber } from "@/lib/utils"
import { useReferral } from "@/stores/referral"

const PAYOUT_METHODS = ["GoPay", "OVO", "DANA", "BCA", "Mandiri"] as const

export function ReferralView() {
  const t = useTranslations("referral")
  const isEn = useLocale() === "en"
  const dateLocale = isEn ? "en-US" : "id-ID"
  const mounted = useMounted()

  const code = useReferral((s) => s.code)
  const entries = useReferral((s) => s.entries)
  const setPayout = useReferral((s) => s.setPayout)
  const storedMethod = useReferral((s) => s.payoutMethod)
  const storedAccount = useReferral((s) => s.payoutAccount)

  const [payoutMethod, setPayoutMethod] = useState("")
  const [payoutAccount, setPayoutAccount] = useState("")

  const link = `${SITE_URL}/?ref=${code}`
  const totalInvited = entries.length
  const totalConverted = entries.filter((e) => e.status === "bertransaksi").length
  const totalPoints = entries.reduce((s, e) => s + e.reward, 0)
  const totalCommission = entries.reduce((s, e) => s + e.commission, 0)

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text)
    toast.success(t("copied"), { description: label })
  }

  const shareTargets = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(
        `${isEn ? "Get premium accounts with a discount at geraiakun — use my code " : "Dapat akun premium diskon di geraiakun — pakai kode saya "}${code} ${link}`,
      )}`,
      color: "bg-accent-lime",
    },
    {
      label: "X",
      icon: Share2,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `${isEn ? "Best place for premium AI accounts 🔥 use code " : "Tempat beli akun AI premium terhemat 🔥 pakai kode "}${code}`,
      )}&url=${encodeURIComponent(link)}`,
      color: "bg-secondary-background",
    },
    {
      label: "Telegram",
      icon: Send,
      href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`geraiakun · kode ${code}`)}`,
      color: "bg-accent-cyan",
    },
  ]

  if (!mounted) {
    return (
      <Container className="py-12">
        <Skeleton className="h-80" />
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <SectionHeading eyebrow={`🤝 ${t("eyebrow")}`} title={t("title")} subtitle={t("subtitle")} />

      {/* Hero: kode + share */}
      <div className="mt-8 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border bg-main p-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-main-foreground/70">
              {t("yourCode")}
            </p>
            <p className="font-heading text-3xl font-extrabold tracking-wide sm:text-4xl">{code}</p>
          </div>
          <Button variant="neutral" onClick={() => copy(code, t("codeCopiedDesc"))}>
            <Copy className="size-4" /> {t("copyCode")}
          </Button>
        </div>
        <div className="p-6">
          <Label className="text-xs font-bold uppercase tracking-wide text-foreground/50">
            {t("refLink")}
          </Label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <Input
              readOnly
              value={link}
              className="font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              variant="neutral"
              onClick={() => copy(link, t("linkCopiedDesc"))}
              className="shrink-0"
            >
              <Copy className="size-4" /> {t("copyLink")}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {shareTargets.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-base border-2 border-border px-3 py-1.5 font-heading text-xs font-bold shadow-shadow-sm transition-all hover:-translate-y-0.5",
                  s.color,
                )}
              >
                <s.icon className="size-3.5" /> {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Cara kerja + benefit */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
            <TrendingUp className="size-5 text-accent-purple" /> {t("howTitle")}
          </h2>
          <ol className="mt-4 flex flex-col gap-3">
            {[
              { n: "1", text: t("step1") },
              { n: "2", text: t("step2") },
              { n: "3", text: t("step3") },
            ].map((s) => (
              <li key={s.n} className="flex items-start gap-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading text-xs font-extrabold shadow-shadow-sm">
                  {s.n}
                </span>
                <span className="pt-0.5 text-foreground/80">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
            <Gift className="size-5 text-accent-pink" /> {t("benefitTitle")}
          </h2>
          <div className="mt-4 grid gap-3">
            <BenefitRow
              icon={Ticket}
              accent="bg-accent-lime"
              title={t("benefitFriendTitle")}
              desc={t("benefitFriendDesc")}
            />
            <BenefitRow
              icon={TrendingUp}
              accent="bg-accent-cyan"
              title={t("benefitYouPointsTitle")}
              desc={t("benefitYouPointsDesc")}
            />
            <BenefitRow
              icon={Gift}
              accent="bg-accent-purple"
              title={t("benefitYouMoneyTitle")}
              desc={t("benefitYouMoneyDesc")}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Users}
          label={t("statInvited")}
          value={formatNumber(totalInvited)}
          accent="bg-accent-cyan"
        />
        <Stat
          icon={TrendingUp}
          label={t("statConverted")}
          value={formatNumber(totalConverted)}
          accent="bg-accent-lime"
        />
        <Stat
          icon={Gift}
          label={t("statPoints")}
          value={formatNumber(totalPoints)}
          accent="bg-accent-pink"
        />
        <Stat
          icon={Ticket}
          label={t("statCommission")}
          value={formatIDR(totalCommission, { compact: true })}
          accent="bg-main"
        />
      </div>

      {/* Metode pencairan komisi */}
      <div className="mt-8 rounded-base border-2 border-border bg-secondary-background p-5">
        <h3 className="font-heading text-sm font-extrabold">{t("payoutTitle")}</h3>
        <p className="mt-1 text-xs text-foreground/60">{t("payoutDesc")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr_auto]">
          <Select value={payoutMethod} onValueChange={setPayoutMethod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("payoutMethodPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {PAYOUT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={payoutAccount}
            onChange={(e) => setPayoutAccount(e.target.value)}
            placeholder={t("payoutAccountPlaceholder")}
          />
          <Button
            variant="neutral"
            className="shrink-0"
            onClick={() => {
              if (!payoutMethod || !payoutAccount.trim()) {
                toast.error(t("payoutRequired"))
                return
              }
              setPayout(payoutMethod, payoutAccount.trim())
              toast.success(t("payoutSaved"))
            }}
          >
            <Wallet className="size-4" /> {t("payoutSave")}
          </Button>
        </div>
        {storedMethod && storedAccount && (
          <p className="mt-3 rounded-base border-2 border-dashed border-border p-2.5 text-xs text-foreground/60">
            {t("payoutActive", { method: storedMethod, account: storedAccount })}
          </p>
        )}
      </div>

      {/* Riwayat referral */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-extrabold">{t("historyTitle")}</h2>
        <div className="mt-3 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b-2 border-border bg-main px-5 py-3 font-heading text-xs font-extrabold uppercase tracking-wide text-main-foreground sm:grid">
            <span>{t("colName")}</span>
            <span>{t("colDate")}</span>
            <span>{t("colStatus")}</span>
            <span className="text-right">{t("colReward")}</span>
          </div>
          {entries.length === 0 ? (
            <p className="p-6 text-center text-sm text-foreground/60">{t("empty")}</p>
          ) : (
            <ul className="divide-y-2 divide-dashed divide-border">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="grid grid-cols-2 gap-2 px-5 py-4 sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:items-center sm:gap-4"
                >
                  <span className="font-heading text-sm font-bold">{e.name}</span>
                  <span className="text-xs text-foreground/60">
                    {formatDate(e.date, dateLocale)}
                  </span>
                  <span>
                    <Badge variant={e.status === "bertransaksi" ? "success" : "warning"}>
                      {e.status === "bertransaksi" ? t("statusConverted") : t("statusJoined")}
                    </Badge>
                  </span>
                  <span className="text-right text-xs">
                    {e.status === "bertransaksi" ? (
                      <span className="font-bold text-foreground">
                        +{e.reward} {t("pts")} · {formatIDR(e.commission)}
                      </span>
                    ) : (
                      <span className="text-foreground/40">{t("pending")}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Container>
  )
}

function BenefitRow({
  icon: Icon,
  accent,
  title,
  desc,
}: {
  icon: typeof Gift
  accent: string
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-base border-2 border-border bg-background p-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
          accent,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p className="font-heading text-sm font-bold">{title}</p>
        <p className="text-xs text-foreground/60">{desc}</p>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users
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
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">{label}</p>
        <p className="truncate font-heading text-xl font-extrabold">{value}</p>
      </div>
    </div>
  )
}
