"use client"

import { Copy, Gift, Sparkles, Star, TrendingUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useMounted } from "@/hooks/use-mounted"
import { formatDate, formatNumber } from "@/lib/utils"
import {
  getTier,
  nextTier,
  REWARDS,
  TIERS,
  useLoyalty,
  type RewardOption,
} from "@/stores/loyalty"

const TIER_BG: Record<string, string> = {
  "accent-pink": "bg-accent-pink",
  "accent-cyan": "bg-accent-cyan",
  main: "bg-main",
  "accent-purple": "bg-accent-purple",
  "accent-lime": "bg-accent-lime",
}

export function LoyaltyView() {
  const t = useTranslations("loyalty")
  const isEn = useLocale() === "en"
  const dateLocale = isEn ? "en-US" : "id-ID"
  const mounted = useMounted()

  const points = useLoyalty((s) => s.points)
  const lifetime = useLoyalty((s) => s.lifetimeEarned)
  const history = useLoyalty((s) => s.history)
  const redeemed = useLoyalty((s) => s.redeemed)
  const redeem = useLoyalty((s) => s.redeem)

  const tier = getTier(lifetime)
  const next = nextTier(lifetime)
  const progress = next
    ? Math.min(100, ((lifetime - tier.min) / (next.min - tier.min)) * 100)
    : 100

  function onRedeem(r: RewardOption) {
    const res = redeem(r)
    if (!res.ok) {
      toast.error(t("notEnough"))
      return
    }
    navigator.clipboard?.writeText(res.code!)
    toast.success(t("redeemed", { code: res.code! }))
  }

  if (!mounted) {
    return (
      <Container className="py-12">
        <Skeleton className="h-72" />
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <SectionHeading
        eyebrow={`🎁 ${t("eyebrow")}`}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Hero: saldo poin + tier */}
      <div className="mt-8 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
        <div className={`flex flex-wrap items-center justify-between gap-4 ${TIER_BG[tier.color]} border-b-2 border-border p-6`}>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-foreground/60">
              {t("balanceLabel")}
            </p>
            <p className="font-heading text-4xl font-extrabold sm:text-5xl">
              {formatNumber(points)} <span className="text-xl">{t("pts")}</span>
            </p>
          </div>
          <div className="text-right">
            <Badge variant="neutral" className="gap-1 text-sm">
              <Sparkles className="size-4" /> {tier.name}
            </Badge>
            <p className="mt-2 max-w-xs text-xs font-semibold text-foreground/70">
              {isEn ? tier.perk : tier.perk}
            </p>
          </div>
        </div>

        {/* Progress ke tier berikutnya */}
        <div className="p-6">
          {next ? (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold">
                  {t("nextTier", { name: next.name, pts: formatNumber(next.min - lifetime) })}
                </span>
                <span className="text-foreground/50">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-base border-2 border-dashed border-border bg-background p-3 text-sm font-bold">
              <Star className="size-4 fill-warning text-warning" /> {t("maxTier")}
            </div>
          )}
        </div>
      </div>

      {/* Cara dapat poin */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: TrendingUp, title: t("earnBuy"), desc: t("earnBuyDesc") },
          { icon: Star, title: t("earnReview"), desc: t("earnReviewDesc") },
          { icon: Gift, title: t("earnRefer"), desc: t("earnReferDesc") },
        ].map((c) => (
          <div
            key={c.title}
            className="flex items-start gap-3 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-base border-2 border-border bg-accent-lime shadow-shadow-sm">
              <c.icon className="size-5" />
            </span>
            <div>
              <p className="font-heading text-sm font-bold">{c.title}</p>
              <p className="text-xs text-foreground/60">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tier ladder */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-extrabold">{t("tiersTitle")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tt) => {
            const reached = lifetime >= tt.min
            const active = tt.key === tier.key
            return (
              <div
                key={tt.key}
                className={`relative rounded-base border-2 border-border p-4 ${
                  active ? "ring-4 ring-main/40" : ""
                } ${reached ? "bg-secondary-background" : "bg-background/50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex size-9 items-center justify-center rounded-base border-2 border-border ${TIER_BG[tt.color]} shadow-shadow-sm`}>
                    <Sparkles className="size-4" />
                  </span>
                  {reached ? (
                    <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                      ✓
                    </Badge>
                  ) : (
                    <span className="text-[10px] font-bold text-foreground/40">
                      🔒
                    </span>
                  )}
                </div>
                <p className="mt-2 font-heading text-sm font-bold">{tt.name}</p>
                <p className="text-xs text-foreground/50">
                  {formatNumber(tt.min)} {t("pts")}
                </p>
                <p className="mt-1.5 text-xs text-foreground/70">{tt.perk}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rewards (tukar poin) */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-extrabold">{t("rewardsTitle")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REWARDS.map((r) => {
            const owned = redeemed.includes(r.id)
            const affordable = points >= r.cost
            return (
              <div
                key={r.id}
                className="flex flex-col rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-base border-2 border-border bg-accent-pink shadow-shadow-sm">
                    <Gift className="size-5" />
                  </span>
                  <Badge variant={affordable ? "lime" : "neutral"}>
                    {formatNumber(r.cost)} {t("pts")}
                  </Badge>
                </div>
                <p className="mt-3 font-heading text-sm font-bold">{r.name}</p>
                <p className="mt-1 flex-1 text-xs text-foreground/60">
                  {r.valueDesc}
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={!affordable || owned}
                  variant={owned ? "neutral" : "default"}
                  onClick={() => onRedeem(r)}
                >
                  {owned ? (
                    <>
                      <Copy className="size-4" /> {r.code}
                    </>
                  ) : affordable ? (
                    t("redeem")
                  ) : (
                    t("needMore", { pts: formatNumber(r.cost - points) })
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Riwayat poin */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-extrabold">{t("historyTitle")}</h2>
        <div className="mt-3 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm">
          {history.map((h, i) => (
            <div
              key={h.id}
              className={`flex items-center justify-between gap-3 p-4 ${
                i > 0 ? "border-t-2 border-dashed border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-9 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm ${
                    h.amount > 0 ? "bg-accent-lime" : "bg-warning/30"
                  }`}
                >
                  {h.amount > 0 ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <Gift className="size-4" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-bold">{h.reason}</p>
                  <p className="text-xs text-foreground/50">
                    {formatDate(h.date, dateLocale)}
                  </p>
                </div>
              </div>
              <span
                className={`font-heading text-sm font-extrabold ${
                  h.amount > 0 ? "text-foreground" : "text-danger"
                }`}
              >
                {h.amount > 0 ? "+" : ""}
                {formatNumber(h.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}
