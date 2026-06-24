import {
  Bot,
  Code,
  GraduationCap,
  type LucideIcon,
  Palette,
  Play,
  Rocket,
} from "lucide-react"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import type { Metadata } from "next"
import { getLocale, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { Container } from "@/components/shared/container"
import { CategoryView } from "@/components/storefront/category-view"
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld"
import { Badge } from "@/components/ui/badge"
import { routing } from "@/i18n/routing"
import { bgFor } from "@/lib/accent"
import { categories } from "@/lib/mock/categories"
import { fakeApi } from "@/lib/mock/fake-api"
import { cn } from "@/lib/utils"
import { seoAlternates } from "@/lib/seo/site"

const icons: Record<string, LucideIcon> = {
  Bot,
  Palette,
  Play,
  Rocket,
  Code,
  GraduationCap,
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    categories.map((c) => ({ locale, slug: c.slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) return {}

  const isEn = locale === "en"
  const title = isEn ? category.nameEn : category.name
  const description = isEn ? category.descriptionEn : category.description
  const path = `/kategori/${slug}`

  return {
    title,
    description,
    alternates: seoAlternates(locale, path),
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const category = await fakeApi.getCategory(slug)
  if (!category) notFound()

  const currentLocale = await getLocale()
  const isEn = currentLocale === "en"
  const Icon = icons[category.icon] ?? Bot

  // Prefetch the category's products so the grid is in the SSR HTML (crawlable)
  // and CatalogView/CategoryView hydrates without a client fetch waterfall.
  const catQuery = { category: category.slug, sort: "populer" } as const
  const catProducts = await fakeApi.getProducts(catQuery)
  const qc = new QueryClient()
  qc.setQueryData(["products", catQuery], catProducts)

  return (
    <Container className="py-10">
      <JsonLd
        data={itemListJsonLd(
          catProducts.map((p) => ({
            name: p.name,
            path: `/produk/${p.slug}`,
          })),
        )}
      />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow",
            bgFor(category.color),
          )}
        >
          <Icon className="size-8" />
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
              {isEn ? category.nameEn : category.name}
            </h1>
            <Badge variant="neutral">{category.productCount} produk</Badge>
          </div>
          <p className="max-w-2xl text-foreground/70">
            {isEn ? category.descriptionEn : category.description}
          </p>
        </div>
      </div>

      <HydrationBoundary state={dehydrate(qc)}>
        <CategoryView slug={category.slug} />
      </HydrationBoundary>
    </Container>
  )
}
