"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order } from "@/types"

interface OrdersState {
  orders: Order[]
  addOrder: (o: Order) => void
  updateOrder: (invoice: string, patch: Partial<Order>) => void
  getByInvoice: (invoice: string) => Order | undefined
}

// Orders the user created at checkout (demo: no backend). Persisted so the
// generated invoice is findable in /lacak across reloads.
export const usePurchasedOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (o) =>
        set((s) => ({
          orders: [o, ...s.orders.filter((x) => x.invoice !== o.invoice)],
        })),
      updateOrder: (invoice, patch) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.invoice === invoice ? { ...order, ...patch } : order,
          ),
        })),
      getByInvoice: (invoice) =>
        get().orders.find((o) => o.invoice.toLowerCase() === invoice.toLowerCase()),
    }),
    { name: "beliakun-orders" },
  ),
)
