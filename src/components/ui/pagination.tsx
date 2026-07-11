"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Client-side pagination over a memoized list. Resets to page 1 whenever the
 * input list reference changes (e.g. filter/search change upstream).
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount)

  useEffect(() => {
    void items
    setPage(1)
  }, [items])

  const paged = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  )

  return { page: current, setPage, pageCount, paged, total: items.length, pageSize }
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number
  pageCount: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const canPrev = page > 1
  const canNext = page < pageCount

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs font-bold text-foreground/60">
        Menampilkan {from}—{to} dari {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="neutral"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <span className="min-w-16 rounded-base border-2 border-border bg-secondary-background px-3 py-1 text-center font-heading text-sm font-extrabold">
          {page} / {pageCount}
        </span>
        <Button
          variant="neutral"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Halaman berikutnya"
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
