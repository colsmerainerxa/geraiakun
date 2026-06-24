"use client"

import { useQuery } from "@tanstack/react-query"
import { fakeApi, type ProductQuery } from "@/lib/mock/fake-api"

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
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: fakeApi.getCategories })
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
    queryFn: () => fakeApi.getProducts(query),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: qk.product(slug),
    queryFn: () => fakeApi.getProduct(slug),
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
export function useOrders() {
  return useQuery({ queryKey: qk.orders, queryFn: fakeApi.getOrders })
}
export function useOrder(invoice: string) {
  return useQuery({
    queryKey: qk.order(invoice),
    queryFn: () => fakeApi.getOrder(invoice),
    enabled: !!invoice,
  })
}
export function useCustomers() {
  return useQuery({ queryKey: qk.customers, queryFn: fakeApi.getCustomers })
}
export function useTransactions() {
  return useQuery({
    queryKey: qk.transactions,
    queryFn: fakeApi.getTransactions,
  })
}
export function usePromos() {
  return useQuery({ queryKey: qk.promos, queryFn: fakeApi.getPromos })
}
export function useCredentials() {
  return useQuery({ queryKey: qk.credentials, queryFn: fakeApi.getCredentials })
}
export function useDashboardStats() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: fakeApi.getDashboardStats,
  })
}
