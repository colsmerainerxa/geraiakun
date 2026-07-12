import type * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-base border-2 border-border bg-secondary-background px-3.5 py-2.5 text-sm font-base text-foreground transition-all",
        "placeholder:text-foreground/60",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:shadow-shadow",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
