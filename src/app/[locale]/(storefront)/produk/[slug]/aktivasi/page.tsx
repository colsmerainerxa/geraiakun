import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { ActivationGuideView } from "@/components/storefront/activation-guide-view"
import { getActivationGuide } from "@/lib/mock/activation-guide"
import { products } from "@/lib/mock/products"
import { seoAlternates } from "@/lib/seo/site"

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
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
  return {
    title: isEn ? `Activate ${product.name}` : `Aktivasi ${product.name}`,
    description: isEn
      ? `Step by step to activate your ${product.name} account.`
      : `Panduan langkah demi langkah aktivasi akun ${product.name}.`,
    alternates: seoAlternates(locale, `/produk/${slug}/aktivasi`),
    robots: { index: true, follow: true },
  }
}

export default async function ActivationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const product = products.find((p) => p.slug === slug)
  if (!product) notFound()

  const guide = getActivationGuide(product.brand, product.category)

  return <ActivationGuideView product={product} guide={guide} />
}
