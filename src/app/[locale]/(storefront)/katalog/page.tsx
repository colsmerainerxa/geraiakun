import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"
import { CatalogView } from "@/components/storefront/catalog-view"
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"
import { getCatalogCategories, getCatalogProducts } from "@/lib/server/catalog"

// Matches CatalogView's initial query (no filters) so the prefetched cache
// hydrates the first client render — products land in the SSR HTML.
const DEFAULT_QUERY = { category: "semua", search: "", sort: "populer" } as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "catalog" })
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: seoAlternates(locale, "/katalog"),
  }
}

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const qc = new QueryClient()
  const [products] = await Promise.all([
    getCatalogProducts(DEFAULT_QUERY),
    qc.prefetchQuery({
      queryKey: ["products", DEFAULT_QUERY],
      queryFn: () => getCatalogProducts(DEFAULT_QUERY),
    }),
    qc.prefetchQuery({
      queryKey: ["categories"],
      queryFn: getCatalogCategories,
    }),
  ])

  return (
    <>
      <JsonLd
        id="jsonld-catalog-item-list"
        data={itemListJsonLd(
          products.map((p) => ({
            name: p.name,
            path: `/produk/${p.slug}`,
          })),
        )}
      />
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense>
          <CatalogView />
        </Suspense>
      </HydrationBoundary>
    </>
  )
}
