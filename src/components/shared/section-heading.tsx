import type * as React from "react"
import { cn } from "@/lib/utils"

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: string
  align?: "left" | "center"
  className?: string
  action?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-2",
          align === "center" && "items-center",
        )}
      >
        {eyebrow && (
          <span className="inline-flex w-fit rounded-base border-2 border-border bg-main px-3 py-1 font-heading text-xs font-bold uppercase tracking-wide text-main-foreground shadow-shadow-sm">
            {eyebrow}
          </span>
        )}
        <h2 className="font-heading text-3xl font-extrabold leading-tight text-balance sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-2xl text-base text-foreground/70">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
