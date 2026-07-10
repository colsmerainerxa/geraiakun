"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fakeApi, type ProductQuery } from "@/lib/mock/fake-api"
import type { Order } from "@/types"

async function fetchJson<T>(url: string, fallback: () => Promise<T>): Promise<T> {
  try {
    const response = await fetch(url)
    if (!response.ok) return fallback()
    return response.json()
  } catch {
    return fallback()
  }
}

function productQueryUrl(query: ProductQuery = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) continue
    params.set(key, Array.isArray(value) ? value.join(",") : String(value))
  }
  const qs = params.toString()
  return `/api/catalog/products${qs ? `?${qs}` : ""}`
}

// Centralized query keys — single source of truth for cache invalidation.
export const qk = {
  categories: ["categories"] as const,
  category: (slug: string) => ["category", slug] as const,
  products: (q: ProductQuery) => ["products", q] as const,
  product: (slug: string) => ["product", slug] as const,
  featured: ["featured"] as const,
  related: (slug: string) => ["related", slug] as const,
  testimonials: ["testimonials"] as const,
  banners: ["banners"] as const,
  orders: ["orders"] as const,
  order: (invoice: string) => ["order", invoice] as const,
  customers: ["customers"] as const,
  transactions: ["transactions"] as const,
  promos: ["promos"] as const,
  credentials: ["credentials"] as const,
  dashboard: ["dashboard-stats"] as const,
  currentUserOrders: ["account", "orders"] as const,
  userRefunds: ["account", "refunds"] as const,
  userWishlist: ["account", "wishlist"] as const,
  adminResellers: ["admin", "resellers"] as const,
  adminReviews: ["admin", "reviews"] as const,
  adminRisk: ["admin", "risk"] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: () => fetchJson("/api/catalog/categories", fakeApi.getCategories),
  })
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: qk.category(slug),
    queryFn: () => fakeApi.getCategory(slug),
  })
}

export function useProducts(query: ProductQuery = {}) {
  return useQuery({
    queryKey: qk.products(query),
    queryFn: () => fetchJson(productQueryUrl(query), () => fakeApi.getProducts(query)),
    // Keep showing the previous grid while a new filter/sort fetch resolves
    // (no skeleton flash between filter changes).
    placeholderData: keepPreviousData,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: qk.product(slug),
    queryFn: () => fetchJson(`/api/catalog/products/${slug}`, () => fakeApi.getProduct(slug)),
    enabled: !!slug,
  })
}

export function useFeatured() {
  return useQuery({ queryKey: qk.featured, queryFn: fakeApi.getFeatured })
}

export function useRelated(slug: string) {
  return useQuery({
    queryKey: qk.related(slug),
    queryFn: () => fakeApi.getRelated(slug),
    enabled: !!slug,
  })
}

export function useTestimonials() {
  return useQuery({
    queryKey: qk.testimonials,
    queryFn: fakeApi.getTestimonials,
  })
}

export function useBanners() {
  return useQuery({ queryKey: qk.banners, queryFn: fakeApi.getBanners })
}

// ---- Admin ----
export function useAdminOrders(filters?: { page?: number; limit?: number; search?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))
  if (filters?.search) params.set("search", filters.search)
  if (filters?.status) params.set("status", filters.status)
  const qs = params.toString()
  return useQuery({
    queryKey: [...qk.orders, filters ?? {}],
    queryFn: async () => {
      const r = await fetch(`/api/admin/orders${qs ? `?${qs}` : ""}`)
      if (!r.ok) return { data: [], total: 0, page: 1, limit: 20 }
      return r.json()
    },
  })
}

export function useAdminTickets(filters?: { page?: number; limit?: number; status?: string; search?: string }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))
  if (filters?.status) params.set("status", filters.status)
  if (filters?.search) params.set("search", filters.search)
  const qs = params.toString()
  return useQuery({
    queryKey: ["admin", "tickets", filters ?? {}],
    queryFn: async () => {
      const r = await fetch(`/api/admin/tickets${qs ? `?${qs}` : ""}`)
      if (!r.ok) return { data: [], total: 0, page: 1, limit: 20 }
      return r.json()
    },
  })
}

export function useAdminRefunds(filters?: { page?: number; limit?: number; status?: string; search?: string }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))
  if (filters?.status) params.set("status", filters.status)
  if (filters?.search) params.set("search", filters.search)
  const qs = params.toString()
  return useQuery({
    queryKey: ["admin", "refunds", filters ?? {}],
    queryFn: async () => {
      const r = await fetch(`/api/admin/refunds${qs ? `?${qs}` : ""}`)
      if (!r.ok) return { data: [], total: 0, page: 1, limit: 20 }
      return r.json()
    },
  })
}

export function useAdminCustomers(filters?: { page?: number; limit?: number; search?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))
  if (filters?.search) params.set("search", filters.search)
  if (filters?.status) params.set("status", filters.status)
  const qs = params.toString()
  return useQuery({
    queryKey: ["admin", "customers", filters ?? {}],
    queryFn: async () => {
      const r = await fetch(`/api/admin/customers${qs ? `?${qs}` : ""}`)
      if (!r.ok) return { data: [], total: 0, page: 1, limit: 20 }
      return r.json()
    },
  })
}

export function useAdminProducts(filters?: { page?: number; limit?: number; search?: string; category?: string; active?: boolean }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))
  if (filters?.search) params.set("search", filters.search)
  if (filters?.category) params.set("category", filters.category)
  if (filters?.active !== undefined) params.set("active", String(filters.active))
  const qs = params.toString()
  return useQuery({
    queryKey: ["admin", "products", filters ?? {}],
    queryFn: async () => {
      const r = await fetch(`/api/admin/products${qs ? `?${qs}` : ""}`)
      if (!r.ok) return { data: [], total: 0, page: 1, limit: 20 }
      return r.json()
    },
  })
}

export function useAdminCredentials(filters?: { productId?: string; variantId?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.productId) params.set("productId", filters.productId)
  if (filters?.variantId) params.set("variantId", filters.variantId)
  if (filters?.status) params.set("status", filters.status)
  const qs = params.toString()
  return useQuery({
    queryKey: ["admin", "credentials", filters ?? {}],
    queryFn: async () => {
      const r = await fetch(`/api/admin/credentials${qs ? `?${qs}` : ""}`)
      if (!r.ok) return []
      return r.json()
    },
  })
}

export function useAdminPromos() {
  return useQuery({
    queryKey: ["admin", "promos"],
    queryFn: async () => {
      const r = await fetch("/api/admin/promos")
      if (!r.ok) return []
      return r.json()
    },
  })
}

export function useAdminFulfillment(filters?: { status?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams()
  if (filters?.status) params.set("status", filters.status)
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))
  const qs = params.toString()
  return useQuery({
    queryKey: ["admin", "fulfillment", filters ?? {}],
    queryFn: async () => {
      const r = await fetch(`/api/admin/fulfillment${qs ? `?${qs}` : ""}`)
      if (!r.ok) return { data: [], total: 0, page: 1, limit: 20 }
      return r.json()
    },
  })
}

export function useAdminTeam() {
  return useQuery({
    queryKey: ["admin", "team"],
    queryFn: async () => {
      const r = await fetch("/api/admin/team")
      if (!r.ok) return []
      return r.json()
    },
  })
}

export function useAdminAudit(filters?: { page?: number; limit?: number; module?: string }) {
  const params = new URLSearchParams()
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))
  if (filters?.module) params.set("module", filters.module)
  const qs = params.toString()
  return useQuery({
    queryKey: ["admin", "audit", filters ?? {}],
    queryFn: async () => {
      const r = await fetch(`/api/admin/audit${qs ? `?${qs}` : ""}`)
      if (!r.ok) return { data: [], total: 0, page: 1, limit: 20 }
      return r.json()
    },
  })
}

export function useOrders() {
  return useAdminOrders()
}

export function useCurrentUserOrders() {
  return useQuery<Order[]>({
    queryKey: qk.currentUserOrders,
    queryFn: async () => {
      const response = await fetch("/api/account/orders")
      if (!response.ok) return []
      return response.json()
    },
  })
}

export function useOrder(invoice: string) {
  return useQuery({
    queryKey: qk.order(invoice),
    queryFn: async () => {
      const r = await fetch(`/api/admin/orders?search=${encodeURIComponent(invoice)}`)
      if (!r.ok) return null
      const data = await r.json()
      return data.data?.[0] ?? null
    },
    enabled: !!invoice,
  })
}

export function useCustomers() {
  return useAdminCustomers()
}

export function useTransactions() {
  return useAdminOrders()
}

export function usePromos() {
  return useAdminPromos()
}

export function useCredentials() {
  return useAdminCredentials()
}

export function useDashboardStats() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: async () => {
      // Import server action dynamically to avoid circular deps
      const { getDashboardStats } = await import("@/app/actions/admin-analytics")
      return getDashboardStats()
    },
  })
}

// ---- Reviews ----
export function useReviews(productId?: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      if (!productId) return []
      const r = await fetch(`/api/catalog/reviews?productId=${productId}`)
      if (!r.ok) return []
      return r.json()
    },
    enabled: !!productId,
  })
}

// ---- Flash Sale ----
export function useFlashSale() {
  return useQuery({
    queryKey: ["flash-sale"],
    queryFn: async () => {
      const r = await fetch("/api/catalog/flash-sale")
      if (!r.ok) return []
      return r.json()
    },
  })
}

// ---- Articles ----
export function useArticles(category?: string, limit?: number) {
  const params = new URLSearchParams()
  if (category) params.set("category", category)
  if (limit) params.set("limit", String(limit))
  const qs = params.toString()
  return useQuery({
    queryKey: ["articles", category ?? "all", limit ?? "all"],
    queryFn: async () => {
      const r = await fetch(`/api/articles${qs ? `?${qs}` : ""}`)
      if (!r.ok) return []
      return r.json()
    },
  })
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const r = await fetch(`/api/articles?slug=${slug}`)
      if (!r.ok) return null
      return r.json()
    },
    enabled: !!slug,
  })
}

// ---- User Refunds ----
export function useUserRefunds() {
  return useQuery({
    queryKey: qk.userRefunds,
    queryFn: async () => {
      const r = await fetch("/api/account/refunds")
      if (!r.ok) return []
      return r.json()
    },
  })
}

// ---- User Wishlist ----
export function useWishlist() {
  return useQuery({
    queryKey: qk.userWishlist,
    queryFn: async () => {
      const r = await fetch("/api/account/wishlist")
      if (!r.ok) return []
      return r.json()
    },
  })
}

// ---- Admin Resellers ----
export function useAdminResellers(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ""
  return useQuery({
    queryKey: [...qk.adminResellers, search ?? ""],
    queryFn: async () => {
      const r = await fetch(`/api/admin/resellers${qs}`)
      if (!r.ok) return []
      const d = await r.json()
      return d.data ?? d
    },
  })
}

// ---- Vault ----
export function useVault() {
  return useQuery({
    queryKey: ["account", "vault"],
    queryFn: async () => {
      const r = await fetch("/api/account/vault")
      if (!r.ok) return []
      return r.json()
    },
  })
}

// ---- Reseller Portal ----
export function useResellerPortal() {
  return useQuery({
    queryKey: ["reseller", "portal"],
    queryFn: async () => {
      const r = await fetch("/api/resellers")
      if (!r.ok) return null
      return r.json()
    },
  })
}

// ---- Admin Reviews ----
export function useAdminReviews(search?: string, rating?: number) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (rating) params.set("rating", String(rating))
  const qs = params.toString()
  return useQuery({
    queryKey: [...qk.adminReviews, search ?? "", rating ?? 0],
    queryFn: async () => {
      const r = await fetch(`/api/admin/reviews${qs ? `?${qs}` : ""}`)
      if (!r.ok) return []
      const d = await r.json()
      return d.data ?? d
    },
  })
}

// ---- Admin Risk ----
export function useAdminRisk(status?: string, risk?: string) {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (risk) params.set("risk", risk)
  const qs = params.toString()
  return useQuery({
    queryKey: [...qk.adminRisk, status ?? "", risk ?? ""],
    queryFn: async () => {
      const r = await fetch(`/api/admin/risk${qs ? `?${qs}` : ""}`)
      if (!r.ok) return []
      const d = await r.json()
      return d.data ?? d
    },
  })
}
