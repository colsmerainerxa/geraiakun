"use client"

import { SlidersHorizontal, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Container } from "@/components/shared/container"
import { ProductCard, ProductCardSkeleton } from "@/components/storefront/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCategories, useProducts } from "@/lib/api/queries"
import type { DurationBucket, ProductQuery, SortKey } from "@/lib/mock/fake-api"
import { cn } from "@/lib/utils"
import type { AccountType, CategorySlug } from "@/types"

const BADGE_OPTIONS = [
  { value: "terlaris", label: "Terlaris", labelEn: "Best Seller" },
  { value: "baru", label: "Baru", labelEn: "New" },
  { value: "promo", label: "Promo", labelEn: "Promo" },
  { value: "langka", label: "Langka", labelEn: "Rare" },
]

const ACCOUNT_OPTIONS: { value: AccountType; label: string; labelEn: string }[] = [
  { value: "sharing", label: "Sharing", labelEn: "Sharing" },
  { value: "private", label: "Private", labelEn: "Private" },
  { value: "invite", label: "Invite", labelEn: "Invite" },
  { value: "lifetime", label: "Lifetime", labelEn: "Lifetime" },
]

const DURATION_OPTIONS: { value: DurationBucket; label: string; labelEn: string }[] = [
  { value: "1m", label: "≤ 1 Bulan", labelEn: "≤ 1 Month" },
  { value: "3m", label: "≤ 3 Bulan", labelEn: "≤ 3 Months" },
  { value: "1y", label: "≤ 1 Tahun", labelEn: "≤ 1 Year" },
  { value: "lifetime", label: "Lifetime", labelEn: "Lifetime" },
]

function badgeLabel(value: string, isEn: boolean) {
  const o = BADGE_OPTIONS.find((x) => x.value === value)
  return o ? (isEn ? o.labelEn : o.label) : value
}

const PRICE_RANGES = [
  { label: "< Rp50rb", min: 0, max: 50000 },
  { label: "Rp50rb–100rb", min: 50000, max: 100000 },
  { label: "Rp100rb–300rb", min: 100000, max: 300000 },
  { label: "> Rp300rb", min: 300000, max: Number.POSITIVE_INFINITY },
]

function Filters({
  category,
  setCategory,
  badges,
  toggleBadge,
  priceIdx,
  setPriceIdx,
  accountType,
  setAccountType,
  duration,
  setDuration,
  onReset,
}: {
  category: string
  setCategory: (c: string) => void
  badges: string[]
  toggleBadge: (b: string) => void
  priceIdx: number | null
  setPriceIdx: (i: number | null) => void
  accountType: AccountType | "semua"
  setAccountType: (a: AccountType | "semua") => void
  duration: DurationBucket | "semua"
  setDuration: (d: DurationBucket | "semua") => void
  onReset: () => void
}) {
  const t = useTranslations("catalog")
  const isEn = useLocale() === "en"
  const { data: categories } = useCategories()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 font-heading text-sm font-extrabold uppercase">{t("category")}</h3>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setCategory("semua")}
            className={cn(
              "rounded-base border-2 px-3 py-2 text-left text-sm font-bold transition-all",
              category === "semua"
                ? "border-border bg-main text-main-foreground shadow-shadow-sm"
                : "border-transparent hover:border-border",
            )}
          >
            {isEn ? "All" : "Semua"}
          </button>
          {categories?.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.slug)}
              className={cn(
                "flex items-center justify-between rounded-base border-2 px-3 py-2 text-left text-sm font-bold transition-all",
                category === c.slug
                  ? "border-border bg-main text-main-foreground shadow-shadow-sm"
                  : "border-transparent hover:border-border",
              )}
            >
              {c.name}
              <span className="text-xs opacity-60">{c.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-heading text-sm font-extrabold uppercase">{t("priceRange")}</h3>
        <div className="flex flex-col gap-1">
          {PRICE_RANGES.map((r, i) => (
            <button
              type="button"
              key={r.label}
              onClick={() => setPriceIdx(priceIdx === i ? null : i)}
              className={cn(
                "rounded-base border-2 px-3 py-2 text-left text-sm font-bold transition-all",
                priceIdx === i
                  ? "border-border bg-accent-cyan shadow-shadow-sm"
                  : "border-transparent hover:border-border",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-heading text-sm font-extrabold uppercase">{t("badges")}</h3>
        <div className="flex flex-col gap-2">
          {BADGE_OPTIONS.map((b) => (
            <label
              key={b.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm font-bold"
            >
              <Checkbox
                checked={badges.includes(b.value)}
                onCheckedChange={() => toggleBadge(b.value)}
              />
              {isEn ? b.labelEn : b.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-heading text-sm font-extrabold uppercase">Tipe Akun</h3>
        <div className="flex flex-col gap-1">
          <FilterToggle active={accountType === "semua"} onClick={() => setAccountType("semua")}>
            {isEn ? "All" : "Semua"}
          </FilterToggle>
          {ACCOUNT_OPTIONS.map((o) => (
            <FilterToggle
              key={o.value}
              active={accountType === o.value}
              onClick={() => setAccountType(accountType === o.value ? "semua" : o.value)}
            >
              {isEn ? o.labelEn : o.label}
            </FilterToggle>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-heading text-sm font-extrabold uppercase">Durasi</h3>
        <div className="flex flex-col gap-1">
          <FilterToggle active={duration === "semua"} onClick={() => setDuration("semua")}>
            {isEn ? "All" : "Semua"}
          </FilterToggle>
          {DURATION_OPTIONS.map((o) => (
            <FilterToggle
              key={o.value}
              active={duration === o.value}
              onClick={() => setDuration(duration === o.value ? "semua" : o.value)}
            >
              {isEn ? o.labelEn : o.label}
            </FilterToggle>
          ))}
        </div>
      </div>

      <Button variant="neutral" onClick={onReset} className="w-full">
        <X className="size-4" /> {t("reset")}
      </Button>
    </div>
  )
}

function FilterToggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-base border-2 px-3 py-2 text-left text-sm font-bold transition-all",
        active
          ? "border-border bg-accent-cyan shadow-shadow-sm"
          : "border-transparent hover:border-border",
      )}
    >
      {children}
    </button>
  )
}

export function CatalogView() {
  const t = useTranslations("catalog")
  const params = useSearchParams()
  const isEn = useLocale() === "en"
  const initialSearch = params.get("q") ?? ""
  const initialCategory = params.get("kategori") ?? "semua"

  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState<SortKey>("populer")
  const [badges, setBadges] = useState<string[]>([])
  const [priceIdx, setPriceIdx] = useState<number | null>(null)
  const [accountType, setAccountType] = useState<AccountType | "semua">("semua")
  const [duration, setDuration] = useState<DurationBucket | "semua">("semua")
  const [visible, setVisible] = useState(9)

  const query = useMemo<ProductQuery>(() => {
    const range = priceIdx !== null ? PRICE_RANGES[priceIdx] : null
    return {
      category: category as CategorySlug | "semua",
      search: initialSearch,
      sort,
      badges: badges.length ? badges : undefined,
      minPrice: range?.min,
      maxPrice: range && range.max !== Number.POSITIVE_INFINITY ? range.max : undefined,
      accountType: accountType === "semua" ? undefined : accountType,
      duration: duration === "semua" ? undefined : duration,
    }
  }, [category, initialSearch, sort, badges, priceIdx, accountType, duration])

  const { data: products, isLoading } = useProducts(query)

  // Reset "load more" window whenever the filter/sort query changes.
  useEffect(() => {
    setVisible(9)
  }, [query])

  function toggleBadge(b: string) {
    setBadges((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]))
  }
  function reset() {
    setCategory("semua")
    setBadges([])
    setPriceIdx(null)
    setSort("populer")
    setAccountType("semua")
    setDuration("semua")
  }

  const filterProps = {
    category,
    setCategory,
    badges,
    toggleBadge,
    priceIdx,
    setPriceIdx,
    accountType,
    setAccountType,
    duration,
    setDuration,
    onReset: reset,
  }

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
          {initialSearch ? `${t("searchResultsFor")} “${initialSearch}”` : t("title")}
        </h1>
        <p className="mt-1 text-foreground/60">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
            <Filters {...filterProps} />
          </div>
        </aside>

        <div>
          {/* Toolbar */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Mobile filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="neutral" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="size-4" /> {t("filters")}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t("filters")}</SheetTitle>
                  </SheetHeader>
                  <Filters {...filterProps} />
                </SheetContent>
              </Sheet>
              <span className="text-sm text-foreground/60">
                {products?.length ?? 0} {t("resultsFound")}
              </span>
            </div>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="populer">{t("sortPopuler")}</SelectItem>
                <SelectItem value="termurah">{t("sortTermurah")}</SelectItem>
                <SelectItem value="termahal">{t("sortTermahal")}</SelectItem>
                <SelectItem value="rating">{t("sortRating")}</SelectItem>
                <SelectItem value="terbaru">{t("sortTerbaru")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active badges */}
          {badges.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {badges.map((b) => (
                <button key={b} type="button" onClick={() => toggleBadge(b)}>
                  <Badge variant="neutral" className="gap-1">
                    {badgeLabel(b, isEn)} <X className="size-3" />
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.slice(0, visible).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {products.length > visible && (
                <div className="mt-8 flex justify-center">
                  <Button variant="neutral" onClick={() => setVisible((v) => v + 9)}>
                    {t("loadMore")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-base border-2 border-dashed border-border py-20 text-center">
              <span className="text-5xl">🔍</span>
              <h3 className="font-heading text-lg font-bold">{t("noResults")}</h3>
              <p className="text-sm text-foreground/60">{t("noResultsDesc")}</p>
              <Button variant="neutral" onClick={reset} className="mt-2">
                {t("reset")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
