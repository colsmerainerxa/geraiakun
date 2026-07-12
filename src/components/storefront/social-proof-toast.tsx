"use client"

import { AnimatePresence, motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { useProducts } from "@/lib/api/queries"
import { formatNumber, initials } from "@/lib/utils"

// Nama-nama pembeli mock untuk rotasi toast social-proof.
const BUYERS = [
  "Rafa Pratama",
  "Dewi Lestari",
  "Bagas Saputra",
  "Nabila Putri",
  "Kevin Wijaya",
  "Siti Rohmah",
  "Dimas Arya",
  "Aulia Rahman",
  "Citra Maharani",
  "Fajar Nugroho",
  "Gita Permata",
  "Yoga Pranata",
]
const CITIES = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
  "Malang",
  "Medan",
  "Makassar",
  "Denpasar",
  "Bekasi",
  "Tangerang",
  "Depok",
]

interface ToastEvent {
  id: number
  productSlug: string
  productName: string
  productLogo: string
  accent: string
  buyer: string
  city: string
  minutesAgo: number
}

function buildEvent(i: number, products: { slug: string; name: string; logo: string; accent: string }[]): ToastEvent {
  const p = products.length > 0 ? products[i % products.length] : null
  if (!p) return { id: i, productSlug: "", productName: "", productLogo: "", accent: "accent-cyan", buyer: BUYERS[i % BUYERS.length], city: CITIES[i % BUYERS.length], minutesAgo: 1 + (i % 12) }
  return {
    id: i,
    productSlug: p.slug,
    productName: p.name,
    productLogo: p.logo,
    accent: p.accent,
    buyer: BUYERS[i % BUYERS.length],
    city: CITIES[i % CITIES.length],
    minutesAgo: 1 + (i % 12),
  }
}

/**
 * Toast social-proof rotasi yang muncul di pojok kiri-bawah. Muncul 6s,
 * jeda 9—14s, lalu event berikutnya. Dimulai ~5s setelah mount agar tidak
 * mengganggu first paint.
 */
export function SocialProofToast() {
  const { data: allProducts } = useProducts()
  const t = useTranslations("socialProof")
  const isEn = useLocale() === "en"
  const [current, setCurrent] = useState<ToastEvent | null>(null)

  useEffect(() => {
    let eventIdx = 0
    let hideTimer: ReturnType<typeof setTimeout>
    let showTimer: ReturnType<typeof setTimeout>

    const show = () => {
      eventIdx += 1
      setCurrent(buildEvent(eventIdx, allProducts ?? []))
      hideTimer = setTimeout(() => setCurrent(null), 6000)
      showTimer = setTimeout(show, 9000 + Math.random() * 5000)
    }

    const start = setTimeout(show, 5000)
    return () => {
      clearTimeout(start)
      clearTimeout(hideTimer)
      clearTimeout(showTimer)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-30 hidden sm:block">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: -40, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="pointer-events-auto w-72"
          >
            <Link
              href={`/produk/${current.productSlug}`}
              className="flex items-center gap-3 rounded-base border-2 border-border bg-background p-3 shadow-shadow"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-base border-2 border-border text-2xl ${bgFor(current.accent)}`}
              >
                {current.productLogo}
              </span>
              <Avatar className="size-8 shrink-0 border-2 border-border">
                <AvatarImage
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(current.buyer)}`}
                  alt={current.buyer}
                />
                <AvatarFallback className="text-[10px]">{initials(current.buyer)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold leading-tight">
                  {current.buyer.split(" ")[0]} {t("justBought")}
                </p>
                <p className="truncate text-xs font-semibold text-foreground/70">
                  {current.productName}
                </p>
                <p className="text-[10px] text-foreground/60">
                  {isEn ? current.city : current.city} — {current.minutesAgo} {t("minutesAgo")}
                </p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * "X orang sedang melihat ini" — badge kecil untuk halaman produk.
 * Angka berubah per beberapa detik untuk efek live.
 */
export function ViewersBadge({ initial = 0 }: { initial?: number }) {
  const t = useTranslations("socialProof")
  const [count, setCount] = useState(initial || 18)

  useEffect(() => {
    if (!initial) setCount(8 + Math.floor(Math.random() * 22))

    const id = setInterval(() => {
      setCount((c) =>
        Math.max(3, c + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4)),
      )
    }, 4000)
    return () => clearInterval(id)
  }, [initial])

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-accent-lime px-2.5 py-1 text-xs font-bold">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/60" />
        <span className="relative inline-flex size-2 rounded-full bg-foreground" />
      </span>
      {formatNumber(count)} {t("viewingNow")}
    </span>
  )
}
