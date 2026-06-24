"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { OrderStatus } from "@/types"

// Demo admin "edits" (no backend) — a localStorage overlay that the admin pages
// merge on top of the static mock. Lets you change product price/stock, override
// an order's status, and toggle a promo within the session.

interface ProductPatch {
  price?: number // overrides the FIRST variant's price (demo simplicity)
  stock?: number // overrides total stock display
}

interface AdminOverlayState {
  productPatches: Record<string, ProductPatch> // key: product id
  orderStatus: Record<string, OrderStatus> // key: invoice
  promoActive: Record<string, boolean> // key: promo id -> active override
  setProductPatch: (id: string, patch: ProductPatch) => void
  setOrderStatus: (invoice: string, status: OrderStatus) => void
  setPromoActive: (id: string, active: boolean) => void
  reset: () => void
}

export const useAdminOverlay = create<AdminOverlayState>()(
  persist(
    (set) => ({
      productPatches: {},
      orderStatus: {},
      promoActive: {},
      setProductPatch: (id, patch) =>
        set((s) => ({
          productPatches: {
            ...s.productPatches,
            [id]: { ...s.productPatches[id], ...patch },
          },
        })),
      setOrderStatus: (invoice, status) =>
        set((s) => ({
          orderStatus: { ...s.orderStatus, [invoice]: status },
        })),
      setPromoActive: (id, active) =>
        set((s) => ({
          promoActive: { ...s.promoActive, [id]: active },
        })),
      reset: () =>
        set({ productPatches: {}, orderStatus: {}, promoActive: {} }),
    }),
    { name: "beliakun-admin-overlay" },
  ),
)
