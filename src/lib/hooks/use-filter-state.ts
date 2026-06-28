"use client"

import { useCallback, useState } from "react"

// URL-synced filter state for admin list views. Each filter value is mirrored
// to a search-param (`<module>.<key>`) via history.replaceState — shareable
// URLs + working back/forward, without the Suspense boundary that
// useSearchParams() forces on static-rendered routes and without re-render
// storms from router.push. Defaults clear the param so URLs stay clean.
//
// Pair with `FilterPresetsBar` (persisted named presets) for the full
// "saved filter presets + URL-sync" UX.

function readParam(paramKey: string): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get(paramKey)
}

function writeParam(paramKey: string, next: string, defaultValue: string) {
  if (typeof window === "undefined") return
  const params = new URLSearchParams(window.location.search)
  if (!next || next === defaultValue) params.delete(paramKey)
  else params.set(paramKey, next)
  const qs = params.toString()
  const path = window.location.pathname + window.location.hash
  window.history.replaceState(null, "", qs ? `${path}?${qs}` : path)
}

export function useFilterState<T extends string>(
  module: string,
  key: string,
  defaultValue: T,
) {
  const paramKey = `${module}.${key}`
  const [value, setValue] = useState<T>(() => {
    const fromUrl = readParam(paramKey)
    return (fromUrl as T | null) ?? defaultValue
  })

  const update = useCallback(
    (next: T) => {
      setValue(next)
      writeParam(paramKey, next, defaultValue)
    },
    [paramKey, defaultValue],
  )

  // Reset to defaults and clear all of this module's params from the URL.
  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      Array.from(params.keys())
        .filter((k) => k.startsWith(`${module}.`))
        .forEach((k) => params.delete(k))
      const qs = params.toString()
      const path = window.location.pathname + window.location.hash
      window.history.replaceState(null, "", qs ? `${path}?${qs}` : path)
    }
  }, [module])

  return [value, update, reset] as const
}

// Apply a preset snapshot: returns nothing; caller maps record -> each setter.
// Centralized so the param-writing rules stay in one place.
export function applyFilterSnapshot(module: string, snapshot: Record<string, string>) {
  if (typeof window === "undefined") return
  const params = new URLSearchParams(window.location.search)
  Array.from(params.keys())
    .filter((k) => k.startsWith(`${module}.`))
    .forEach((k) => params.delete(k))
  Object.entries(snapshot).forEach(([key, val]) => {
    if (val) params.set(`${module}.${key}`, val)
  })
  const qs = params.toString()
  const path = window.location.pathname + window.location.hash
  window.history.replaceState(null, "", qs ? `${path}?${qs}` : path)
}
