"use client"

import { Bell, Info, Percent, Ticket as TicketIcon, Truck } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { useMounted } from "@/hooks/use-mounted"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/stores/notifications"
import type { NotificationKind } from "@/types"

const KIND_META: Record<NotificationKind, { icon: typeof Info; accent: string; key: string }> = {
  pesanan: { icon: Truck, accent: "bg-accent-cyan", key: "kindPesanan" },
  promo: { icon: Percent, accent: "bg-accent-pink", key: "kindPromo" },
  tiket: { icon: TicketIcon, accent: "bg-accent-lime", key: "kindTiket" },
  info: { icon: Info, accent: "bg-accent-blue", key: "kindInfo" },
}

function timeAgo(
  iso: string,
  isEn: boolean,
  t: (k: string, v?: Record<string, string | number | Date>) => string,
) {
  void isEn
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return t("justNow")
  if (min < 60) return t("minutesAgo", { min })
  const jam = Math.floor(min / 60)
  if (jam < 24) return t("hoursAgo", { jam })
  return t("daysAgo", { day: Math.floor(jam / 24) })
}

/**
 * Tombol lonceng + popover daftar notifikasi. Seed notifikasi demo sekali
 * saat pertama dibuka (jika kosong). Tombol menampilkan badge jumlah belum
 * dibaca.
 */
export function NotificationCenter() {
  const t = useTranslations("notifications")
  const isEn = useLocale() === "en"
  const mounted = useMounted()
  const [open, setOpen] = useState(false)
  const { items, unread, markAllRead, markRead, seeded, seedDemo } = useNotificationsSeed(isEn)
  const ref = useRef<HTMLDivElement>(null)

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onClick)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const unreadCount = mounted ? unread() : 0

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && !seeded) seedDemo()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5"
        aria-label={t("title")}
      >
        <Bell className="size-4" />
        {mounted && unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border-2 border-border bg-danger text-[10px] font-extrabold text-foreground"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-base border-2 border-border bg-background shadow-shadow-lg"
          >
            <div className="flex items-center justify-between border-b-2 border-border bg-secondary-background px-4 py-3">
              <span className="font-heading text-sm font-extrabold">{t("title")}</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-foreground/60 hover:text-foreground hover:underline"
                >
                  {t("markAllRead")}
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="text-3xl">🔕</span>
                  <p className="text-sm text-foreground/60">{t("empty")}</p>
                </div>
              ) : (
                <ul className="divide-y-2 divide-border">
                  {items.slice(0, 12).map((n) => {
                    const meta = KIND_META[n.kind]
                    return (
                      <li key={n.id}>
                        <Link
                          href={n.href ?? "#"}
                          onClick={() => markRead(n.id)}
                          className={cn(
                            "flex gap-3 px-4 py-3 transition-colors hover:bg-main/5",
                            !n.read && "bg-accent-lime/10",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-base border-2 border-border",
                              meta.accent,
                            )}
                          >
                            <meta.icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-bold">{n.title}</p>
                              {!n.read && (
                                <span className="size-1.5 shrink-0 rounded-full bg-danger" />
                              )}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground/60">
                              {n.body}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold text-foreground/40">
                              {timeAgo(n.createdAt, isEn, t)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Hook yang membungkus store + seeding demo. Seed hanya dijalankan sekali
 * (flag `seeded` disimpan di komponen, bukan persist, agar tidak menumpuk).
 */
function useNotificationsSeed(isEn: boolean) {
  const store = useNotifications()
  const [seeded, setSeeded] = useState(false)

  function seedDemo() {
    setSeeded(true)
    if (store.items.length > 0) return
    const demo: Array<{
      kind: NotificationKind
      title: string
      body: string
      href: string | null
      minsAgo: number
    }> = [
      {
        kind: "promo",
        title: isEn ? "⚡ Flash Sale Today!" : "⚡ Flash Sale Hari Ini!",
        body: isEn
          ? "Up to 30% off on ChatGPT, Gemini & more. Ends at midnight."
          : "Diskon hingga 30% untuk akun ChatGPT, Gemini & lainnya. Berakhir tengah malam.",
        href: "/#flash-sale",
        minsAgo: 3,
      },
      {
        kind: "info",
        title: isEn ? "Welcome to geraiakun! 🎉" : "Selamat datang di geraiakun! 🎉",
        body: isEn
          ? "Create an account, wishlist favorites, and enjoy new-member promos."
          : "Buat akun, wishlist produk favorit, dan nikmati promo member baru.",
        href: "/katalog",
        minsAgo: 45,
      },
      {
        kind: "pesanan",
        title: isEn ? "Your order is being processed" : "Pesananmu sedang diproses",
        body: isEn
          ? "Thanks for shopping. Your digital account will be delivered instantly."
          : "Terima kasih sudah berbelanja. Akun digital kamu akan dikirim instan.",
        href: "/lacak",
        minsAgo: 120,
      },
      {
        kind: "tiket",
        title: isEn ? "Warranty ticket updated" : "Tiket garansi diupdate",
        body: isEn
          ? "Our agent is reviewing your warranty claim. Track it in the help center."
          : "Agen kami sedang meninjau klaim garansi kamu. Pantau di pusat bantuan.",
        href: "/bantuan/tiket",
        minsAgo: 1500,
      },
    ]
    // push dengan timestamp mundur agar "time ago" variatif
    demo.forEach((d) => {
      store.push({
        kind: d.kind,
        title: d.title,
        body: d.body,
        href: d.href,
        createdAt: new Date(Date.now() - d.minsAgo * 60000).toISOString(),
      })
    })
  }

  return { ...store, seeded, seedDemo }
}
