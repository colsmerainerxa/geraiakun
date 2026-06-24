import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/storefront/product-detail"
import { routing } from "@/i18n/routing"
import { fakeApi } from "@/lib/mock/fake-api"
import { products } from "@/lib/mock/products"
import {
  breadcrumbJsonLd,
  JsonLd,
  productJsonLd,
} from "@/lib/seo/json-ld"

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    products.map((p) => ({ locale, slug: p.slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const product = products.find((p) => p.slug === slug)
  if (!product) return {}

  const isEn = locale === "en"
  const title = product.name
  const description = isEn ? product.descriptionEn : product.description
  const path = `/produk/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { id: path, en: `/en${path}` },
    },
    openGraph: {
      type: "website",
      title: `${title} · beliakun`,
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

  const [product, related] = await Promise.all([
    fakeApi.getProduct(slug),
    fakeApi.getRelated(slug),
  ])
  if (!product) notFound()

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: locale === "en" ? "/en" : "/" },
          {
            name: "Katalog",
            path: locale === "en" ? "/en/katalog" : "/katalog",
          },
          { name: product.name, path: `/produk/${slug}` },
        ])}
      />
      <ProductDetail product={product} related={related} />
    </>
  )
}
