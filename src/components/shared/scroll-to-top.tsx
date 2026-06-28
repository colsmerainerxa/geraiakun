"use client"

import { ArrowUp } from "lucide-react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useCompare } from "@/stores/compare"

export function ScrollToTop() {
  const t = useTranslations("common")
  const [show, setShow] = useState(false)
  const pathname = usePathname()
  const isProductDetail = /^(?:\/(?:id|en))?\/produk\/[^/]+\/?$/.test(pathname)
  const compareCount = useCompare((s) => s.slugs.length)
  const hideOnMobile = isProductDetail && compareCount > 0

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label={t("backToTop")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed right-5 z-30 size-11 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow transition-all hover:translate-x-0.5 hover:translate-y-0.5",
        hideOnMobile ? "hidden lg:flex" : "flex",
        isProductDetail ? "bottom-44 lg:bottom-28" : "bottom-24 lg:bottom-28",
        show ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp className="size-5" />
    </button>
  )
}
