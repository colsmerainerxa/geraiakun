import type * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-base border-2 border-border bg-secondary-background px-3.5 py-2 text-sm font-base text-foreground transition-all",
        "placeholder:text-foreground/50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:shadow-shadow",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-danger/30",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
