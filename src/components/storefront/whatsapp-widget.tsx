"use client"

import { Check, Clock, MessageCircle, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"
import { useCompare } from "@/stores/compare"

// Nomor WA demo (format internasional tanpa +). Ganti dengan nomor asli.
const WA_NUMBER = "6281234567890"

export function WhatsAppWidget() {
  const t = useTranslations("support")
  const isEn = useLocale() === "en"
  const mounted = useMounted()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isProductDetail = /^(?:\/(?:id|en))?\/produk\/[^/]+\/?$/.test(pathname)
  const compareCount = useCompare((s) => s.slugs.length)
  const hideOnMobile = isProductDetail && compareCount > 0

  // Tutup saat navigasi/scroll jauh (opsional, ringan). Cukup tutup dengan Esc.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  // Cegah render di server (animasi + ikon) — hindari hydration mismatch
  if (!mounted) return null

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    isEn
      ? "Hi geraiakun, I have a question about my order/account."
      : "Halo geraiakun, saya mau tanya soal pesanan/akun saya.",
  )}`

  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex-col items-end gap-3",
        hideOnMobile ? "hidden lg:flex" : "flex",
        isProductDetail ? "bottom-24 lg:bottom-4" : "bottom-4",
      )}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-base border-2 border-border bg-background shadow-shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b-2 border-border bg-accent-lime p-4">
              <span className="relative flex size-11 items-center justify-center rounded-full border-2 border-border bg-background">
                <MessageCircle className="size-5" />
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-3.5 rounded-full border-2 border-border bg-success" />
                </span>
              </span>
              <div className="flex-1">
                <p className="font-heading text-sm font-extrabold">{t("waTitle")}</p>
                <p className="flex items-center gap-1 text-[11px] font-bold text-foreground/70">
                  <span className="size-1.5 rounded-full bg-success" />
                  {t("waOnline")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-base border-2 border-border bg-background shadow-shadow-sm"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Chat preview */}
            <div className="bg-accent-lime/20 p-4">
              <div className="max-w-[85%] rounded-base rounded-tl-none border-2 border-border bg-background p-3 shadow-shadow-sm">
                <p className="text-xs leading-relaxed text-foreground/80">{t("waGreeting")}</p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-foreground/60">
                <Clock className="size-3" /> {t("waTypical")}
              </div>
            </div>

            {/* CTA */}
            <div className="p-3 pt-0">
              <Button asChild className="w-full bg-accent-lime">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> {t("waButton")}
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex size-14 items-center justify-center rounded-full border-2 border-border bg-accent-lime shadow-shadow-lg"
        aria-label={t("waButton")}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="size-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="size-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Notif dot kecil */}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full border-2 border-border bg-danger text-[8px] font-extrabold">
            1
          </span>
        )}
      </motion.button>

      {/* Hidden helper: trust microcopy */}
      <span className="sr-only">
        <Check /> {t("waOnline")}
      </span>
    </div>
  )
}
