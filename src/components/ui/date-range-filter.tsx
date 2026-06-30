"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export type DateRangePreset = "7d" | "30d" | "90d" | "all"

export interface DateRange {
  preset: DateRangePreset
  from: Date | null
  to: Date | null
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "90d", label: "90 Hari" },
  { value: "all", label: "Semua" },
]

export function useDateRange(preset: DateRangePreset): DateRange {
  return useMemo(() => {
    if (preset === "all") return { preset, from: null, to: null }
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    from.setDate(from.getDate() - days)
    return { preset, from, to: null }
  }, [preset])
}

export function inRange(iso: string, range: DateRange): boolean {
  if (!range.from) return true
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return true
  if (t < range.from.getTime()) return false
  if (range.to && t > range.to.getTime()) return false
  return true
}

export function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: DateRangePreset
  onChange: (preset: DateRangePreset) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-base border-2 border-border bg-secondary-background p-1",
        className,
      )}
    >
      {PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={cn(
            "rounded-[5px] px-3 py-1.5 text-xs font-bold transition-all",
            value === p.value
              ? "bg-main text-main-foreground shadow-shadow-sm"
              : "text-foreground/60 hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
