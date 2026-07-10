import type { CategorySlug, Product } from "@/types"
// re-export for backward compat — types now live in @/types
export type { ProductQuery, SortKey, DurationBucket } from "@/types"
import type { ProductQuery } from "@/types"
import { categories } from "./categories"
import { banners, testimonials } from "./content"
import { credentialStats, credentials } from "./credentials"
import { customers } from "./customers"
import { orders } from "./orders"
import { productMinPrice, products } from "./products"
import { reviewsForProduct } from "./reviews"
import { promos, transactions } from "./transactions"

// Data mock resolve instan — latensi buatan dihapus agar UI terasa cepat.
// (Dengan API nyata, latensi datang dari jaringan; tak perlu disimulasikan.)
const delay = (_ms = 0) => Promise.resolve()

function categoriesWithCount() {
  return categories.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.category === c.slug).length,
  }))
}

export const fakeApi = {
  async getCategories() {
    await delay(150)
    return categoriesWithCount()
  },

  async getCategory(slug: string) {
    await delay(150)
    return categoriesWithCount().find((c) => c.slug === slug) ?? null
  },

  async getProducts(query: ProductQuery = {}): Promise<Product[]> {
    await delay()
    let list = [...products]
    const { category, search, sort, minPrice, maxPrice, badges, accountType, duration } = query

    if (category && category !== "semua") {
      list = list.filter((p) => p.category === category)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q),
      )
    }
    if (typeof minPrice === "number") {
      list = list.filter((p) => productMinPrice(p) >= minPrice)
    }
    if (typeof maxPrice === "number") {
      list = list.filter((p) => productMinPrice(p) <= maxPrice)
    }
    if (badges?.length) {
      list = list.filter((p) => p.badges.some((b) => badges.includes(b)))
    }
    if (accountType) {
      list = list.filter((p) => p.variants.some((v) => v.type === accountType))
    }
    if (duration) {
      list = list.filter((p) =>
        p.variants.some((v) => {
          if (duration === "lifetime") return v.durationDays === null
          const cap = duration === "1m" ? 30 : duration === "3m" ? 90 : 365
          return v.durationDays !== null && v.durationDays <= cap
        }),
      )
    }

    switch (sort) {
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
        list.sort(
          (a, b) => (b.badges.includes("baru") ? 1 : 0) - (a.badges.includes("baru") ? 1 : 0),
        )
        break
      default:
        list.sort((a, b) => b.soldCount - a.soldCount)
    }
    return list
  },

  async getProduct(slug: string) {
    await delay(200)
    const product = products.find((p) => p.slug === slug)
    if (!product) return null
    return { ...product, reviews: reviewsForProduct(product.id) }
  },

  async getFeatured() {
    await delay(200)
    return products.filter((p) => p.featured)
  },

  async getRelated(slug: string) {
    await delay(150)
    const product = products.find((p) => p.slug === slug)
    if (!product) return []
    return products.filter((p) => p.category === product.category && p.slug !== slug).slice(0, 4)
  },

  async getTestimonials() {
    await delay(120)
    return testimonials
  },

  async getBanners() {
    await delay(120)
    return banners.filter((b) => b.active)
  },

  // ---- Admin ----
  async getOrders() {
    await delay(250)
    return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async getOrder(invoice: string) {
    await delay(200)
    return orders.find((o) => o.invoice.toLowerCase() === invoice.toLowerCase()) ?? null
  },
  async getCustomers() {
    await delay(250)
    return customers
  },
  async getTransactions() {
    await delay(250)
    return transactions
  },
  async getPromos() {
    await delay(200)
    return promos
  },
  async getCredentials() {
    await delay(200)
    return credentials
  },

  async getDashboardStats() {
    await delay(300)
    const paid = orders.filter((o) => o.paidAt)
    const revenue = paid.reduce((s, o) => s + o.total, 0)
    return {
      revenue,
      orderCount: orders.length,
      customerCount: customers.length,
      productCount: products.length,
      pendingOrders: orders.filter((o) => o.status === "menunggu-pembayaran").length,
      completedOrders: orders.filter((o) => o.status === "selesai").length,
      credentials: credentialStats(),
      // 7-hari revenue trend (dummy, deterministik)
      trend: [
        { day: "Sen", value: 1250000 },
        { day: "Sel", value: 1820000 },
        { day: "Rab", value: 1430000 },
        { day: "Kam", value: 2100000 },
        { day: "Jum", value: 2680000 },
        { day: "Sab", value: 3120000 },
        { day: "Min", value: 2450000 },
      ],
      topProducts: [...products]
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5)
        .map((p) => ({
          name: p.name,
          logo: p.logo,
          sold: p.soldCount,
          accent: p.accent,
        })),
    }
  },
}

export type DashboardStats = Awaited<ReturnType<typeof fakeApi.getDashboardStats>>
