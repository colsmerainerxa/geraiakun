import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { ProductDetail } from "@/components/storefront/product-detail"
import { routing } from "@/i18n/routing"
import { reviewsForProduct } from "@/lib/mock/reviews"
import { breadcrumbJsonLd, faqPageJsonLd, JsonLd, productJsonLd } from "@/lib/seo/json-ld"
import { seoAlternates } from "@/lib/seo/site"
import { getCatalogProduct, getCatalogProducts } from "@/lib/server/catalog"
import { backendFlags } from "@/lib/server/env"
import { products } from "@/lib/mock/products"

async function getPrisma() {
  return (await import("@/lib/server/prisma")).prisma
}

function isDbUnavailable(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  const record = error as Record<string, unknown>
  return (
    record.code === "P2021" ||
    String(record.message ?? "").includes("does not exist") ||
    String(record.message ?? "").includes("TableDoesNotExist")
  )
}

async function getReviews(productId: string) {
  if (!backendFlags.databaseConfigured) return reviewsForProduct(productId)
  try {
    const prisma = await getPrisma()
    const dbReviews = await prisma.review.findMany({
      where: { productId, verified: true },
      orderBy: { createdAt: "desc" },
    })
    return dbReviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      author: r.userName,
      avatar: "",
      rating: r.rating,
      comment: r.body,
      date: r.createdAt.toISOString(),
      variantLabel: "",
      verified: r.verified,
    }))
  } catch (error) {
    if (isDbUnavailable(error)) return reviewsForProduct(productId)
    throw error
  }
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const product = await getCatalogProduct(slug)
  if (!product) return {}

  const isEn = locale === "en"
  const title = product.name
  const description = isEn ? product.descriptionEn : product.description
  const path = `/produk/${slug}`

  return {
    title,
    description,
    alternates: seoAlternates(locale, path),
    openGraph: {
      type: "website",
      title: `${title} · geraiakun`,
      description,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const product = await getCatalogProduct(slug)
  if (!product) notFound()
  const related = (await getCatalogProducts({ category: product.category }))
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4)

  return (
    <>
      <JsonLd id={`jsonld-product-${slug}`} data={productJsonLd(product)} />
      <JsonLd
        id={`jsonld-product-breadcrumb-${slug}`}
        data={breadcrumbJsonLd([
          { name: "Beranda", path: locale === "en" ? "/en" : "/" },
          {
            name: "Katalog",
            path: locale === "en" ? "/en/katalog" : "/katalog",
          },
          { name: product.name, path: `/produk/${slug}` },
        ])}
      />
      {product.faqs.length > 0 && (
        <JsonLd
          id={`jsonld-product-faq-${slug}`}
          data={faqPageJsonLd(
            product.faqs.map((f: any) => ({
              q: locale === "en" ? f.qEn : f.q,
              a: locale === "en" ? f.aEn : f.a,
            })),
          )}
        />
      )}
      <ProductDetail
        product={{ ...product, reviews: await getReviews(product.id) }}
        related={related}
      />
    </>
  )
}
