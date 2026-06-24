"use client"

import { useEffect, useState } from "react"

/** True only after client mount — guards against hydration mismatch for
 *  values that differ between server and client (e.g. persisted cart). */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
