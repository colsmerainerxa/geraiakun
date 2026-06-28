"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Saved filter presets per admin module. Each preset is a snapshot of the
// module's filter values (string-valued) so it can be re-applied in one click.
// Pair with `useFilterState` (URL-sync) — presets persist across sessions,
// URL-sync shares the current view.

export interface FilterPreset {
  id: string
  name: string
  value: Record<string, string>
  createdAt: string
}

interface FilterPresetsState {
  presets: Record<string, FilterPreset[]>
  savePreset: (module: string, name: string, value: Record<string, string>) => void
  deletePreset: (module: string, id: string) => void
  renamePreset: (module: string, id: string, name: string) => void
  reset: () => void
}

export const useFilterPresets = create<FilterPresetsState>()(
  persist(
    (set) => ({
      presets: {},
      savePreset: (module, name, value) =>
        set((state) => {
          const preset: FilterPreset = {
            id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name,
            value,
            createdAt: new Date().toISOString(),
          }
          return {
            presets: {
              ...state.presets,
              [module]: [...(state.presets[module] ?? []), preset],
            },
          }
        }),
      deletePreset: (module, id) =>
        set((state) => ({
          presets: {
            ...state.presets,
            [module]: (state.presets[module] ?? []).filter((p) => p.id !== id),
          },
        })),
      renamePreset: (module, id, name) =>
        set((state) => ({
          presets: {
            ...state.presets,
            [module]: (state.presets[module] ?? []).map((p) =>
              p.id === id ? { ...p, name } : p,
            ),
          },
        })),
      reset: () => set({ presets: {} }),
    }),
    { name: "beliakun-filter-presets" },
  ),
)
