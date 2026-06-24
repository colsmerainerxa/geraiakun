import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-base border-2 border-border font-heading font-bold transition-all outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-main text-main-foreground shadow-shadow brutal-press",
        neutral:
          "bg-secondary-background text-foreground shadow-shadow brutal-press",
        pink: "bg-accent-pink text-foreground shadow-shadow brutal-press",
        cyan: "bg-accent-cyan text-foreground shadow-shadow brutal-press",
        lime: "bg-accent-lime text-foreground shadow-shadow brutal-press",
        purple: "bg-accent-purple text-foreground shadow-shadow brutal-press",
        danger: "bg-danger text-foreground shadow-shadow brutal-press",
        ghost:
          "border-transparent bg-transparent hover:bg-foreground/5 active:bg-foreground/10",
        link: "border-transparent bg-transparent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        default: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
        xl: "h-15 px-9 text-lg",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
