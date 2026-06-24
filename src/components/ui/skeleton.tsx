import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-base border-2 border-border/30 bg-foreground/10",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
