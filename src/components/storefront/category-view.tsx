"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/storefront/product-card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Link } from "@/i18n/navigation"
import { useProducts } from "@/lib/api/queries"
import type { SortKey } from "@/lib/mock/fake-api"
import type { CategorySlug } from "@/types"

export function CategoryView({ slug }: { slug: CategorySlug }) {
  const t = useTranslations("catalog")
  const [sort, setSort] = useState<SortKey>("populer")
  const { data: products, isLoading } = useProducts({ category: slug, sort })

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-sm text-foreground/60">
          {products?.length ?? 0} {t("resultsFound")}
        </span>
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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-base border-2 border-dashed border-border py-20 text-center">
          <span className="text-5xl">🔍</span>
          <h3 className="font-heading text-lg font-bold">{t("noResults")}</h3>
          <p className="text-sm text-foreground/60">{t("noResultsDesc")}</p>
          <Button variant="neutral" asChild className="mt-2">
            <Link href="/katalog">{t("title")}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
