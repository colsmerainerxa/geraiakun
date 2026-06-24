import type {
  BreadcrumbList,
  Organization,
  Product as ProductSchema,
  WebSite,
  WithContext,
} from "schema-dts"
import type { Product } from "@/types"

const BASE = "https://beliakun.id"

export function organizationJsonLd(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "beliakun",
    url: BASE,
    logo: `${BASE}/icon.png`,
    description:
      "Marketplace akun & langganan digital premium termurah dan terpercaya di Indonesia.",
    sameAs: [
      "https://instagram.com/beliakun",
      "https://twitter.com/beliakun",
      "https://tiktok.com/@beliakun",
    ],
  }
}

export function websiteJsonLd(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "beliakun",
    url: BASE,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE}/katalog?q={search_term_string}`,
      },
      // @ts-expect-error schema-dts query-input shorthand
      "query-input": "required name=search_term_string",
    },
  }
}

export function productJsonLd(p: Product): WithContext<ProductSchema> {
  const prices = p.variants.map((v) => v.price)
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    brand: { "@type": "Brand", name: p.brand },
    category: p.category,
    url: `${BASE}/produk/${p.slug}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
      bestRating: 5,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IDR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: p.variants.length,
      availability: p.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  }
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE}${item.path}`,
    })),
  }
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
