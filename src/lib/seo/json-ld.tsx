import Script from "next/script"
import type {
  BlogPosting,
  BreadcrumbList,
  ItemList,
  Organization,
  Product as ProductSchema,
  WebSite,
  WithContext,
} from "schema-dts"
import { SITE_URL } from "@/lib/seo/site"
import type { Product } from "@/types"

const BASE = SITE_URL

export function organizationJsonLd(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "geraiakun",
    url: BASE,
    logo: `${BASE}/icon.png`,
    description:
      "Marketplace akun & langganan digital premium yang praktis, transparan, dan bergaransi.",
    sameAs: [
      "https://instagram.com/geraiakun",
      "https://twitter.com/geraiakun",
      "https://tiktok.com/@geraiakun",
    ],
  }
}

export function websiteJsonLd(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "geraiakun",
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
    sku: p.id,
    url: `${BASE}/produk/${p.slug}`,
    image: `${BASE}/opengraph-image`,
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

export function itemListJsonLd(items: { name: string; path: string }[]): WithContext<ItemList> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${BASE}${item.path}`,
    })),
  }
}

export function articleJsonLd(a: {
  title: string
  description: string
  slug: string
  date: string
}): WithContext<BlogPosting> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.date,
    url: `${BASE}/artikel/${a.slug}`,
    image: `${BASE}/opengraph-image`,
    author: { "@type": "Organization", name: "geraiakun", url: BASE },
    publisher: {
      "@type": "Organization",
      name: "geraiakun",
      logo: { "@type": "ImageObject", url: `${BASE}/icon.png` },
    },
    mainEntityOfPage: `${BASE}/artikel/${a.slug}`,
  }
}

export function faqPageJsonLd(items: { q: string; a: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}

// Escape characters that could break out of the <script> context. Data is
// currently static/trusted, but this hardens against future user-derived fields.
// (< already prevents the </script> breakout, which is the only real risk for
// a JSON-LD script.)
function safeJsonLd(data: object) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}

export function JsonLd({ data, id }: { data: object; id: string }) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  )
}
