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
        pink: "bg-accent-pink text-main-foreground",
        cyan: "bg-accent-cyan text-main-foreground",
        lime: "bg-accent-lime text-main-foreground",
        purple: "bg-accent-purple text-main-foreground",
        blue: "bg-accent-blue text-main-foreground",
        success: "bg-success text-main-foreground",
        warning: "bg-warning text-main-foreground",
        danger: "bg-danger text-main-foreground",
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
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
