"use client"

import { Flame, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ACHIEVEMENTS,
  levelForXp,
  levelProgress,
  useAdminGamification,
} from "@/stores/admin-gamification"

// Dashboard gamification card: level, XP progress, daily streak, and the
// milestone-badge grid (locked vs unlocked). Pure motivational UI — never
// gates real admin permissions.
export function AchievementsPanel() {
  const xp = useAdminGamification((s) => s.xp)
  const streak = useAdminGamification((s) => s.streak)
  const unlocked = useAdminGamification((s) => s.unlocked)
  const actions = useAdminGamification((s) => s.actions)
  const reset = useAdminGamification((s) => s.reset)

  const level = levelForXp(xp)
  const { current, next, pct } = levelProgress(xp)

  const actionLabels: Record<keyof typeof actions, string> = {
    "fulfillment.kirim": "Fulfillment dikirim",
    "ticket.resolved": "Tiket diselesaikan",
    "risk.approved": "Risk review diputuskan",
    "refund.decided": "Refund diputuskan",
  }

  return (
    <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-5" />
          <h2 className="font-heading text-lg font-bold">Performa Kamu</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-base border-2 border-border bg-main px-2.5 py-1 text-xs font-extrabold text-main-foreground shadow-shadow-sm">
          Level {level}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <p className="font-heading text-3xl font-extrabold">{xp} XP</p>
          <p className="text-xs font-bold text-foreground/55">
            {current} / {next} XP ke level {level + 1}
          </p>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-border bg-background">
          <div className="h-full bg-main transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(actionLabels) as (keyof typeof actions)[]).map((key) => (
          <div
            key={key}
            className="rounded-base border-2 border-border bg-background p-2.5 text-center"
          >
            <p className="font-heading text-xl font-extrabold">{actions[key]}</p>
            <p className="text-[10px] font-bold uppercase text-foreground/55">
              {actionLabels[key]}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-base border-2 border-dashed border-border bg-background p-3">
        <Flame className="size-5 text-accent-pink" />
        <p className="text-sm font-bold">
          Streak <span className="font-heading">{streak}</span> hari beruntung
        </p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[10px] font-extrabold uppercase text-foreground/60">Lencana</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ACHIEVEMENTS.map((a) => {
            const have = unlocked.includes(a.id)
            return (
              <div
                key={a.id}
                className={cn(
                  "rounded-base border-2 border-border p-2.5 text-center transition-all",
                  have
                    ? `${a.accent} text-main-foreground shadow-shadow-sm`
                    : "bg-background opacity-60",
                )}
              >
                <p className="font-heading text-sm font-extrabold">{a.label}</p>
                <p
                  className={cn(
                    "text-[10px] font-bold",
                    have ? "text-main-foreground/70" : "text-foreground/60",
                  )}
                >
                  {have ? "Terbuka" : `${a.threshold} XP`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-4 text-xs font-bold text-foreground/60 underline-offset-2 hover:text-foreground/70 hover:underline"
      >
        Reset progres (demo)
      </button>
    </div>
  )
}
