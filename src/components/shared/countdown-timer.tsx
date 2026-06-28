"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function diff(target: number, now: number): TimeLeft {
  const total = Math.max(0, target - now)
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}

/**
 * Hitung mundur ke target. Mengembalikan null di server (mencegah hydration
 * mismatch) lalu TimeLeft setelah mount.
 */
export function useCountdown(targetISO: string): TimeLeft | null {
  const [left, setLeft] = useState<TimeLeft | null>(null)
  useEffect(() => {
    const target = new Date(targetISO).getTime()
    setLeft(diff(target, Date.now()))
    const id = setInterval(() => setLeft(diff(target, Date.now())), 1000)
    return () => clearInterval(id)
  }, [targetISO])
  return left
}

const UNITS = [
  { key: "days", pad: 2 },
  { key: "hours", pad: 2 },
  { key: "minutes", pad: 2 },
  { key: "seconds", pad: 2 },
] as const

/** Tampilan kotak hitung mundur gaya neobrutalism. */
export function CountdownTimer({
  targetISO,
  variant = "default",
  className,
}: {
  targetISO: string
  variant?: "default" | "compact"
  className?: string
}) {
  const t = useTranslations("common.countdown")
  const left = useCountdown(targetISO)
  if (!left)
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        {UNITS.map((u) => (
          <div
            key={u.key}
            className={cn(
              "flex flex-col items-center rounded-base border-2 border-border bg-secondary-background px-2 py-1 shadow-shadow-sm",
              variant === "compact" && "px-1.5",
            )}
          >
            <span className="font-heading text-lg font-extrabold tabular-nums">--</span>
          </div>
        ))}
      </div>
    )

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {UNITS.map((u, i) => (
        <div key={u.key} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center rounded-base border-2 border-border bg-main px-2.5 py-1 shadow-shadow-sm">
            <span
              className={cn(
                "font-heading font-extrabold tabular-nums text-main-foreground",
                variant === "compact" ? "text-base" : "text-xl",
              )}
            >
              {String(left[u.key]).padStart(u.pad, "0")}
            </span>
            <span className="text-[9px] font-bold uppercase text-main-foreground/70">
              {t(u.key)}
            </span>
          </div>
          {i < UNITS.length - 1 && (
            <span className="font-heading text-lg font-extrabold text-foreground/40">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
