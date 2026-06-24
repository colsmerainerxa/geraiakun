import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-base border-2 border-border px-2.5 py-0.5 font-heading text-xs font-bold leading-none [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-main text-main-foreground",
        neutral: "bg-secondary-background text-foreground",
        pink: "bg-accent-pink text-foreground",
        cyan: "bg-accent-cyan text-foreground",
        lime: "bg-accent-lime text-foreground",
        purple: "bg-accent-purple text-foreground",
        blue: "bg-accent-blue text-foreground",
        success: "bg-success text-white",
        warning: "bg-warning text-foreground",
        danger: "bg-danger text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
