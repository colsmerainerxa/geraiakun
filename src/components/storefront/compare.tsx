"use client"

import { GitCompare, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { getProduct } from "@/lib/mock/products"
import { cn, formatPrice } from "@/lib/utils"
import { COMPARE_MAX, useCompare } from "@/stores/compare"
import { useMounted } from "@/hooks/use-mounted"
import { Star } from "lucide-react"

/* ----------------------------- Compare button ----------------------------- */

export function CompareButton({
  slug,
  className,
  size = "icon-sm",
  withLabel = false,
}: {
  slug: string
  className?: string
  size?: "icon-sm" | "sm"
  withLabel?: boolean
}) {
  const t = useTranslations("compare")
  const mounted = useMounted()
  const active = useCompare((s) => s.slugs.includes(slug))
  const toggle = useCompare((s) => s.toggle)

  if (size === "sm") {
    return (
      <Button
        type="button"
        variant={active ? "default" : "neutral"}
        size="sm"
        className={cn("gap-1.5", className)}
        onClick={() => {
          const res = toggle(slug)
          if (res.full) toast.error(t("limit", { max: COMPARE_MAX }))
          else toast.success(active ? t("removed") : t("added"))
        }}
      >
        <GitCompare className="size-4" /> {withLabel ? t("compare") : null}
        {active ? <X className="size-3" /> : null}
      </Button>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      title={t("compare")}
      onClick={() => {
        const res = toggle(slug)
        if (res.full) toast.error(t("limit", { max: COMPARE_MAX }))
        else if (mounted) toast.success(active ? t("removed") : t("added"))
      }}
      className={cn(
        "flex size-9 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm transition-all",
        active
          ? "bg-accent-purple text-foreground"
          : "bg-secondary-background/90 backdrop-blur hover:bg-main",
        className,
      )}
    >
      <GitCompare className={cn("size-4", active && "fill-foreground")} />
    </button>
  )
}

/* ----------------------------- Compare bar -------------------------------- */

export function CompareBar() {
  const t = useTranslations("compare")
  const mounted = useMounted()
  const slugs = useCompare((s) => s.slugs)
  const remove = useCompare((s) => s.remove)
  const clear = useCompare((s) => s.clear)
  const setOpen = useCompare((s) => s.setOpen)

  if (!mounted || slugs.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-background/95 px-4 py-3 backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 font-heading text-sm font-extrabold">
            <GitCompare className="size-5 text-accent-purple" />
            {t("barTitle", { count: slugs.length, max: COMPARE_MAX })}
          </span>
          <div className="flex flex-1 items-center gap-2 overflow-x-auto">
            {slugs.map((slug) => {
              const p = getProduct(slug)
              if (!p) return null
              return (
                <div
                  key={slug}
                  className="flex shrink-0 items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background py-1 pl-1 pr-2"
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-base border-2 border-border text-base",
                      bgFor(p.accent),
                    )}
                  >
                    {p.logo}
                  </span>
                  <span className="max-w-24 truncate text-xs font-bold">
                    {p.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(slug)}
                    aria-label="Hapus"
                    className="text-foreground/40 hover:text-danger"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clear}>
              {t("clear")}
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <GitCompare className="size-4" /> {t("compareNow")}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ----------------------------- Compare drawer ----------------------------- */

export function CompareDrawer() {
  const t = useTranslations("compare")
  const tc = useTranslations("common")
  const isEn = useLocale() === "en"
  const slugs = useCompare((s) => s.slugs)
  const open = useCompare((s) => s.open)
  const setOpen = useCompare((s) => s.setOpen)
  const remove = useCompare((s) => s.remove)

  const items = slugs
    .map((s) => getProduct(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  // Baris atribut yang dibandingkan.
  const rows: { label: string; render: (p: (typeof items)[number]) => React.ReactNode }[] = [
    {
      label: tc("price"),
      render: (p) => {
        const min = Math.min(...p.variants.map((v) => v.price))
        return <span className="font-heading font-extrabold">{formatPrice(min, isEn)}</span>
      },
    },
    {
      label: t("rowRating"),
      render: (p) => (
        <span className="inline-flex items-center gap-1 font-bold">
          <Star className="size-3.5 fill-warning text-warning" /> {p.rating}
          <span className="text-foreground/50">
            ({p.reviewCount.toLocaleString(isEn ? "en-US" : "id-ID")})
          </span>
        </span>
      ),
    },
    {
      label: t("rowSold"),
      render: (p) => <span>{p.soldCount.toLocaleString(isEn ? "en-US" : "id-ID")}</span>,
    },
    {
      label: t("rowBrand"),
      render: (p) => <span>{p.brand}</span>,
    },
    {
      label: t("rowVariants"),
      render: (p) => <span>{p.variants.length}</span>,
    },
    {
      label: t("rowTopFeatures"),
      render: (p) => (
        <ul className="flex flex-col gap-1 text-left">
          {(isEn ? p.featuresEn : p.features).slice(0, 3).map((f) => (
            <li key={f} className="text-xs leading-snug">
              • {f}
            </li>
          ))}
        </ul>
      ),
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="sr-only">{t("compareNow")}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl lg:max-w-3xl"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitCompare className="size-5 text-accent-purple" /> {t("drawerTitle")}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <p className="mt-8 text-center text-sm text-foreground/60">
            {t("empty")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 w-32 bg-background" />
                  {items.map((p) => (
                    <th key={p.id} className="min-w-36 p-2 align-top">
                      <Link
                        href={`/produk/${p.slug}`}
                        className="group flex flex-col items-center gap-1.5 text-center"
                      >
                        <span
                          className={cn(
                            "flex size-14 items-center justify-center rounded-base border-2 border-border text-3xl shadow-shadow-sm",
                            bgFor(p.accent),
                          )}
                        >
                          {p.logo}
                        </span>
                        <span className="font-heading text-sm font-bold leading-snug group-hover:underline">
                          {p.name}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(p.slug)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-foreground/40 hover:text-danger"
                      >
                        <X className="size-3" /> {t("remove")}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.label}>
                    <td
                      className={cn(
                        "sticky left-0 w-32 bg-background p-3 align-top text-xs font-extrabold uppercase tracking-wide text-foreground/50",
                        ri > 0 && "border-t-2 border-border",
                      )}
                    >
                      {row.label}
                    </td>
                    {items.map((p) => (
                      <td
                        key={p.id}
                        className={cn(
                          "p-3 text-center align-top text-sm",
                          ri > 0 && "border-t-2 border-l-2 border-border",
                          ri === 0 && "border-l-2 border-border",
                        )}
                      >
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="sticky left-0 w-32 bg-background p-3" />
                  {items.map((p) => {
                    const min = Math.min(...p.variants.map((v) => v.price))
                    const minV =
                      p.variants.find((v) => v.price === min) ?? p.variants[0]
                    return (
                      <td key={p.id} className="border-l-2 border-border p-3">
                        <Button size="sm" asChild className="w-full">
                          <Link href={`/produk/${p.slug}`}>{tc("viewDetail")}</Link>
                        </Button>
                        <span className="mt-1 block text-[10px] text-foreground/40">
                          {isEn ? minV.labelEn : minV.label}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
