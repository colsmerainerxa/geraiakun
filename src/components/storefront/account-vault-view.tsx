"use client"

import {
  Activity,
  CalendarClock,
  Copy,
  KeyRound,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { vaultAccounts, vaultActivities, type VaultAccountStatus } from "@/lib/mock/enterprise"
import { cn, formatDate, formatIDR, formatNumber } from "@/lib/utils"

const STATUS_META: Record<
  VaultAccountStatus,
  { label: string; variant: "success" | "warning" | "neutral" | "danger"; tone: string }
> = {
  aktif: { label: "Aktif", variant: "success", tone: "bg-accent-lime" },
  "akan-habis": { label: "Akan Habis", variant: "warning", tone: "bg-warning" },
  ditahan: { label: "Ditahan", variant: "neutral", tone: "bg-accent-purple" },
  bermasalah: { label: "Bermasalah", variant: "danger", tone: "bg-danger" },
}

const ACTIVITY_TONE = {
  lime: "bg-accent-lime",
  cyan: "bg-accent-cyan",
  pink: "bg-accent-pink",
  warning: "bg-warning",
}

export function AccountVaultView() {
  const [selectedId, setSelectedId] = useState(vaultAccounts[0]?.id ?? "")
  const selected = vaultAccounts.find((account) => account.id === selectedId) ?? vaultAccounts[0]
  const expiring = vaultAccounts.filter((account) => account.status === "akan-habis").length
  const totalRenewal = vaultAccounts.reduce((sum, account) => sum + account.renewalPrice, 0)
  const averageHealth = Math.round(
    vaultAccounts.reduce((sum, account) => sum + account.healthScore, 0) / vaultAccounts.length,
  )

  function copyLogin(email: string) {
    navigator.clipboard?.writeText(email)
    toast.success("Login email disalin")
  }

  return (
    <Container className="py-12">
      <SectionHeading
        eyebrow="ACCOUNT VAULT"
        title="Vault Akun & Renewal"
        subtitle="Satu tempat untuk melihat akun digital yang sudah dibeli, status garansi, jadwal renewal, dan health check akun."
        action={
          <Button asChild variant="neutral">
            <Link href="/akun">Kembali ke Akun</Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <VaultStat
          icon={KeyRound}
          label="Akun aktif"
          value={formatNumber(vaultAccounts.length)}
          accent="bg-accent-cyan"
        />
        <VaultStat
          icon={CalendarClock}
          label="Perlu renewal"
          value={formatNumber(expiring)}
          accent="bg-warning"
        />
        <VaultStat
          icon={ShieldCheck}
          label="Health rata-rata"
          value={`${averageHealth}%`}
          accent="bg-accent-lime"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="flex flex-col gap-3">
          <div className="rounded-base border-2 border-border bg-main p-4 shadow-shadow">
            <p className="text-xs font-heading font-extrabold uppercase text-main-foreground/70">
              Renewal forecast
            </p>
            <p className="mt-1 font-heading text-2xl font-extrabold">{formatIDR(totalRenewal)}</p>
            <p className="text-xs font-bold text-main-foreground/70">
              Estimasi biaya perpanjangan semua akun aktif.
            </p>
          </div>

          {vaultAccounts.map((account) => {
            const meta = STATUS_META[account.status]
            const active = selected?.id === account.id
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedId(account.id)}
                className={cn(
                  "rounded-base border-2 border-border bg-secondary-background p-4 text-left shadow-shadow-sm transition-all hover:-translate-y-0.5",
                  active && "ring-4 ring-main/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-extrabold">
                      {account.productName}
                    </p>
                    <p className="truncate text-xs font-bold text-foreground/60">{account.plan}</p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-foreground/60">
                  <CalendarClock className="size-3.5" />
                  Berakhir {formatDate(account.expiresAt)}
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-border bg-background">
                  <div
                    className={cn("h-full", meta.tone)}
                    style={{ width: `${account.healthScore}%` }}
                  />
                </div>
              </button>
            )
          })}
        </section>

        {selected && (
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-border bg-accent-cyan p-6">
                <div>
                  <Badge variant={STATUS_META[selected.status].variant}>
                    {STATUS_META[selected.status].label}
                  </Badge>
                  <h2 className="mt-2 font-heading text-2xl font-extrabold">
                    {selected.productName}
                  </h2>
                  <p className="text-sm font-bold text-foreground/70">{selected.plan}</p>
                </div>
                <Button variant="neutral" onClick={() => copyLogin(selected.loginEmail)}>
                  <Copy className="size-4" /> Salin Login
                </Button>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <InfoTile icon={LockKeyhole} label="Login email" value={selected.loginEmail} mono />
                <InfoTile
                  icon={RefreshCcw}
                  label="Biaya renewal"
                  value={formatIDR(selected.renewalPrice)}
                />
                <InfoTile
                  icon={ShieldCheck}
                  label="Garansi sampai"
                  value={formatDate(selected.warrantyUntil)}
                />
                <InfoTile
                  icon={Smartphone}
                  label="Seat & perangkat"
                  value={`${selected.seats} seat / ${selected.devices} device`}
                />
              </div>

              <div className="border-t-2 border-dashed border-border p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-sm font-extrabold">Health score akun</p>
                    <p className="text-xs text-foreground/60">{selected.note}</p>
                  </div>
                  <span className="font-heading text-2xl font-extrabold">
                    {selected.healthScore}%
                  </span>
                </div>
                <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-border bg-background">
                  <div
                    className="h-full bg-accent-lime"
                    style={{ width: `${selected.healthScore}%` }}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button>
                    <RefreshCcw className="size-4" /> Perpanjang
                  </Button>
                  <Button asChild variant="neutral">
                    <Link href={`/refund?invoice=${selected.id}`}>Ajukan Kendala</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
              <h3 className="flex items-center gap-2 font-heading text-lg font-extrabold">
                <Activity className="size-5" /> Aktivitas Vault
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                {vaultActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                        ACTIVITY_TONE[activity.tone],
                      )}
                    >
                      <Activity className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-bold">{activity.title}</p>
                      <p className="text-sm text-foreground/70">{activity.body}</p>
                      <p className="mt-1 text-xs text-foreground/45">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </Container>
  )
}

function VaultStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof KeyRound
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
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">{label}</p>
        <p className="font-heading text-xl font-extrabold">{value}</p>
      </div>
    </div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof KeyRound
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-base border-2 border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground/50">
        <Icon className="size-4" /> {label}
      </div>
      <p className={cn("mt-2 truncate font-heading text-sm font-extrabold", mono && "font-mono")}>
        {value}
      </p>
    </div>
  )
}
