"use client"

import { create } from "zustand"

export type PipelineViewKey = "orders" | "fulfillment" | "refunds" | "tickets"
export type PipelineViewMode = "table" | "kanban"

interface UIState {
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  pipelineViews: Record<PipelineViewKey, PipelineViewMode>
  setPipelineView: (key: PipelineViewKey, mode: PipelineViewMode) => void
}

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  pipelineViews: {
    orders: "table",
    fulfillment: "table",
    refunds: "table",
    tickets: "table",
  },
  setPipelineView: (key, mode) =>
    set((state) => ({
      pipelineViews: {
        ...state.pipelineViews,
        [key]: mode,
      },
    })),
}))
