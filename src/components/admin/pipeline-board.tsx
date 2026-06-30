"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PipelineColumn, PipelineStatus } from "@/types"

export function PipelineBoard<
  TItem extends { id: string },
  TStatus extends PipelineStatus = PipelineStatus,
>({
  columns,
  items,
  getStatus,
  renderCard,
  emptyLabel,
}: {
  columns: PipelineColumn<TStatus>[]
  items: TItem[]
  getStatus: (item: TItem) => TStatus
  renderCard: (item: TItem) => ReactNode
  emptyLabel: string
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((column) => {
        const columnItems = items.filter((item) => getStatus(item) === column.id)

        return (
          <section
            key={column.id}
            className="flex min-h-72 w-72 shrink-0 flex-col rounded-base border-2 border-border bg-background p-3 shadow-shadow-sm md:flex-1"
          >
            <div
              className={cn(
                "rounded-base border-2 border-border bg-secondary-background p-3",
                column.accent,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-extrabold leading-tight">
                    {column.title}
                  </h3>
                  {column.description ? (
                    <p className="mt-1 text-xs font-semibold text-foreground/60">
                      {column.description}
                    </p>
                  ) : null}
                </div>
                <Badge variant="neutral" className="shrink-0">
                  {columnItems.length}
                </Badge>
              </div>
            </div>

            <div className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {columnItems.length > 0 ? (
                columnItems.map((item) => <div key={item.id}>{renderCard(item)}</div>)
              ) : (
                <div className="rounded-base border-2 border-dashed border-border p-4 text-center text-xs font-bold text-foreground/45">
                  {emptyLabel}
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
