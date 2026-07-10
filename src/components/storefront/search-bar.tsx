"use client"

import { CornerDownLeft, Search, TrendingUp, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Link, useRouter } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { useCategories, useProducts } from "@/lib/api/queries"
import type { Product, Category } from "@/types"
import { cn, formatPrice } from "@/lib/utils"

const TRENDING_SLUGS = ["chatgpt-plus", "claude-pro", "gemini-advanced", "canva-pro"]

interface Match {
  type: "product" | "brand" | "category"
  key: string
  label: string
  sub?: string
  logo?: string
  slug?: string
  accent?: string
  price?: number
}

function buildMatches(q: string, isEn: boolean, products: Product[], categories: Category[]): Match[] {
  const query = q.toLowerCase().trim()
  if (!query) return []
  const out: Match[] = []
  const seenBrand = new Set<string>()

  // Products
  for (const p of products) {
    const hay = `${p.name} ${p.brand} ${isEn ? p.taglineEn : p.tagline}`.toLowerCase()
    if (hay.includes(query)) {
      out.push({
        type: "product",
        key: p.id,
        label: p.name,
        sub: p.brand,
        logo: p.logo,
        slug: p.slug,
        accent: p.accent,
        price: Math.min(...p.variants.map((v: any) => v.price)),
      })
    }
  }
  // Brands (dedupe)
  for (const p of products) {
    if (
      p.brand.toLowerCase().includes(query) &&
      !seenBrand.has(p.brand) &&
      !out.some((m) => m.type === "product" && m.sub === p.brand)
    ) {
      seenBrand.add(p.brand)
      out.push({ type: "brand", key: `brand-${p.brand}`, label: p.brand })
    }
  }
  // Categories
  for (const c of categories) {
    const hay = `${c.name} ${c.nameEn}`.toLowerCase()
    if (hay.includes(query)) {
      out.push({
        type: "category",
        key: c.id,
        label: isEn ? c.nameEn : c.name,
        slug: c.slug,
      })
    }
  }
  return out.slice(0, 8)
}

export function SearchBar({ onSubmit }: { onSubmit?: () => void }) {
  const t = useTranslations("nav")
  const ts = useTranslations("search")
  const isEn = useLocale() === "en"
  const router = useRouter()
  const { data: products = [] } = useProducts()
  const { data: categories = [] } = useCategories()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => buildMatches(q, isEn, products, categories), [q, isEn, products, categories])
  const showDropdown = open && q.trim().length > 0

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const trending = TRENDING_SLUGS.map((s) => products.find((p) => p.slug === s)).filter(Boolean) as Product[]

  function go(value: string) {
    router.push(`/katalog${value ? `?q=${encodeURIComponent(value)}` : ""}`)
    onSubmit?.()
    setOpen(false)
  }

  function onKey(e: React.KeyboardEvent) {
    if (!showDropdown) {
      if (e.key === "Enter") go(q)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, matches.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const m = matches[active]
      if (m) {
        navigateMatch(m)
      } else {
        go(q)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  function navigateMatch(m: Match) {
    onSubmit?.()
    setOpen(false)
    if (m.type === "category" && m.slug) {
      router.push(`/kategori/${m.slug}`)
    } else if (m.slug) {
      router.push(`/produk/${m.slug}`)
    } else if (m.type === "brand") {
      go(m.label)
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          go(q)
        }}
        className="relative w-full"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={t("search")}
          className="pl-9"
          aria-label={t("search")}
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          role="combobox"
          autoComplete="off"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("")
              inputRef.current?.focus()
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
            aria-label="Clear"
          >
            <X className="size-4" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-base border-2 border-border bg-background shadow-shadow-lg"
        >
          {matches.length === 0 ? (
            <div className="p-4 text-center text-sm text-foreground/60">
              {ts("noResults")} <span className="font-bold">�{q}�</span>
            </div>
          ) : (
            <ul className="flex flex-col p-1.5">
              {matches.map((m, i) => (
                <li key={`${m.type}-${m.key}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => navigateMatch(m)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-base px-2.5 py-2 text-left transition-colors",
                      active === i ? "bg-main/10" : "",
                    )}
                  >
                    {m.logo ? (
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border text-lg",
                          bgFor(m.accent ?? "accent-pink"),
                        )}
                      >
                        {m.logo}
                      </span>
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-secondary-background text-xs font-extrabold uppercase">
                        {m.type === "brand" ? "🏷️" : "📂"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{m.label}</p>
                      {m.sub && (
                        <p className="truncate text-xs text-foreground/50">
                          {m.sub}
                          {m.price !== undefined && m.price > 0
                            ? ` � ${formatPrice(m.price, isEn)}`
                            : m.price === 0
                              ? ` � ${isEn ? "Free" : "Gratis"}`
                              : ""}
                        </p>
                      )}
                    </div>
                    <Badge variant="neutral" className="shrink-0 text-[10px]">
                      {m.type === "product"
                        ? ts("products")
                        : m.type === "brand"
                          ? ts("brands")
                          : ts("categories")}
                    </Badge>
                    {active === i && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-foreground/40" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Trending (only when no query results gap) */}
          {q.trim().length > 0 && (
            <button
              type="button"
              onClick={() => go(q)}
              className="flex w-full items-center justify-between border-t-2 border-border bg-secondary-background px-3.5 py-2.5 text-left text-sm font-bold hover:bg-main/10"
            >
              <span>
                {ts("allResults")} <span className="text-foreground/50">�{q}�</span>
              </span>
              <CornerDownLeft className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Trending chips (desktop, when focused & empty) */}
      {open && q.trim().length === 0 && trending.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-50 rounded-base border-2 border-border bg-background p-3 shadow-shadow-lg">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase text-foreground/50">
            <TrendingUp className="size-3.5" /> {ts("trending")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {trending.map(
              (p) =>
                p && (
                  <Link
                    key={p.id}
                    href={`/produk/${p.slug}`}
                    onClick={() => {
                      onSubmit?.()
                      setOpen(false)
                    }}
                    className="flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background px-2.5 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5"
                  >
                    <span>{p.logo}</span> {p.name}
                  </Link>
                ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}
