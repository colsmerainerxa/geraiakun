import { fakeApi, type ProductQuery } from "@/lib/mock/fake-api"
import { productMinPrice } from "@/lib/mock/products"
import { backendFlags } from "@/lib/server/env"
import type { Category, Product } from "@/types"

const badgeFromDb = {
  BESTSELLER: "terlaris",
  NEW: "baru",
  PROMO: "promo",
  RARE: "langka",
} as const

const accountTypeFromDb = {
  SHARING: "sharing",
  PRIVATE: "private",
  INVITE: "invite",
  LIFETIME: "lifetime",
} as const

type DbCatalogVariant = {
  id: string
  label: string
  labelEn: string
  type: keyof typeof accountTypeFromDb
  durationDays: number | null
  price: number
  originalPrice: number | null
  stock: number
}

type DbCatalogProduct = {
  id: string
  slug: string
  name: string
  brand: string
  tagline: string
  taglineEn: string
  description: string
  descriptionEn: string
  image: string
  gallery: string[]
  logo: string
  accent: string
  badges: (keyof typeof badgeFromDb)[]
  rating: number
  reviewCount: number
  soldCount: number
  featured: boolean
  features: string[]
  featuresEn: string[]
  faqs: unknown
  category: { slug: string }
  variants: DbCatalogVariant[]
}

function serializeProduct(product: DbCatalogProduct): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    tagline: product.tagline,
    taglineEn: product.taglineEn,
    description: product.description,
    descriptionEn: product.descriptionEn,
    category: product.category.slug as Category["slug"],
    image: product.image,
    gallery: product.gallery,
    logo: product.logo,
    accent: product.accent,
    badges: product.badges.map((badge) => badgeFromDb[badge]),
    rating: product.rating,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    featured: product.featured,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      labelEn: variant.labelEn,
      type: accountTypeFromDb[variant.type],
      durationDays: variant.durationDays,
      price: variant.price,
      originalPrice: variant.originalPrice,
      stock: variant.stock,
    })),
    features: product.features,
    featuresEn: product.featuresEn,
    faqs: Array.isArray(product.faqs) ? product.faqs : [],
  }
}

function filterProducts(products: Product[], query: ProductQuery) {
  let list = [...products]
  if (query.category && query.category !== "semua") {
    list = list.filter((product) => product.category === query.category)
  }
  if (query.search) {
    const q = query.search.toLowerCase()
    list = list.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.tagline.toLowerCase().includes(q),
    )
  }
  const minPrice = query.minPrice
  if (typeof minPrice === "number") {
    list = list.filter((product) => productMinPrice(product) >= minPrice)
  }
  const maxPrice = query.maxPrice
  if (typeof maxPrice === "number") {
    list = list.filter((product) => productMinPrice(product) <= maxPrice)
  }
  if (query.badges?.length) {
    list = list.filter((product) => product.badges.some((badge) => query.badges?.includes(badge)))
  }
  if (query.accountType) {
    list = list.filter((product) =>
      product.variants.some((variant) => variant.type === query.accountType),
    )
  }

  switch (query.sort) {
    case "termurah":
      list.sort((a, b) => productMinPrice(a) - productMinPrice(b))
      break
    case "termahal":
      list.sort((a, b) => productMinPrice(b) - productMinPrice(a))
      break
    case "rating":
      list.sort((a, b) => b.rating - a.rating)
      break
    case "terbaru":
      list.sort((a, b) => (b.badges.includes("baru") ? 1 : 0) - (a.badges.includes("baru") ? 1 : 0))
      break
    default:
      list.sort((a, b) => b.soldCount - a.soldCount)
  }
  return list
}

function isCatalogDatabaseUnavailable(error: unknown) {
  if (typeof error !== "object" || error === null) return false
  const record = error as Record<string, unknown>
  return (
    record.code === "P2021" ||
    String(record.message ?? "").includes("does not exist") ||
    String(record.message ?? "").includes("TableDoesNotExist")
  )
}

async function getPrisma() {
  return (await import("@/lib/server/prisma")).prisma
}

export async function getCatalogProducts(query: ProductQuery = {}) {
  if (!backendFlags.databaseConfigured) return fakeApi.getProducts(query)

  try {
    const prisma = await getPrisma()
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        category: true,
        variants: { where: { active: true }, orderBy: { price: "asc" } },
      },
    })
    return filterProducts(products.map(serializeProduct), query)
  } catch (error) {
    if (isCatalogDatabaseUnavailable(error)) return fakeApi.getProducts(query)
    throw error
  }
}

export async function getCatalogProduct(slug: string) {
  if (!backendFlags.databaseConfigured) return fakeApi.getProduct(slug)
  try {
    const prisma = await getPrisma()
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: { where: { active: true }, orderBy: { price: "asc" } },
      },
    })
    return product ? serializeProduct(product) : null
  } catch (error) {
    if (isCatalogDatabaseUnavailable(error)) return fakeApi.getProduct(slug)
    throw error
  }
}

export async function getCatalogCategories() {
  if (!backendFlags.databaseConfigured) return fakeApi.getCategories()
  try {
    const prisma = await getPrisma()
    const [categories, products] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.product.groupBy({ by: ["categoryId"], _count: true, where: { active: true } }),
    ])
    const countByCategory = new Map(products.map((item) => [item.categoryId, item._count]))
    return categories.map(
      (category): Category => ({
        id: category.id,
        slug: category.slug as Category["slug"],
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        descriptionEn: category.descriptionEn,
        icon: category.icon,
        color: category.color,
        productCount: countByCategory.get(category.id) ?? 0,
      }),
    )
  } catch (error) {
    if (isCatalogDatabaseUnavailable(error)) return fakeApi.getCategories()
    throw error
  }
}
