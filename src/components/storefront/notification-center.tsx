"use client"

import { Bell, Info, Percent, Ticket as TicketIcon, Truck } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { useMounted } from "@/hooks/use-mounted"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/stores/notifications"
import type { NotificationKind } from "@/types"

const KIND_META: Record<NotificationKind, { icon: typeof Info; accent: string }> = {
  pesanan: { icon: Truck, accent: "bg-accent-cyan" },
  promo: { icon: Percent, accent: "bg-accent-pink" },
  tiket: { icon: TicketIcon, accent: "bg-accent-lime" },
  info: { icon: Info, accent: "bg-accent-blue" },
}

function timeAgo(
  iso: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return t("justNow")
  if (minutes < 60) return t("minutesAgo", { min: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t("hoursAgo", { jam: hours })
  return t("daysAgo", { day: Math.floor(hours / 24) })
}

export function NotificationCenter() {
  const t = useTranslations("notifications")
  const mounted = useMounted()
  const [open, setOpen] = useState(false)
  const { items, unread, markAllRead, markRead } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onClick)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const unreadCount = mounted ? unread() : 0

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
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
            className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-base border-2 border-border bg-background shadow-shadow-lg"
          >
            <div className="flex items-center justify-between border-b-2 border-border bg-secondary-background px-4 py-3">
              <span className="font-heading text-sm font-extrabold">{t("title")}</span>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] font-bold text-foreground/60 hover:underline">
                  {t("markAllRead")}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-foreground/60">{t("empty")}</div>
              ) : (
                <ul className="divide-y-2 divide-border">
                  {items.slice(0, 12).map((notification) => {
                    const meta = KIND_META[notification.kind]
                    return (
                      <li key={notification.id}>
                        <Link
                          href={notification.href ?? "#"}
                          onClick={() => markRead(notification.id)}
                          className={cn("flex gap-3 px-4 py-3 hover:bg-main/5", !notification.read && "bg-accent-lime/10")}
                        >
                          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-base border-2 border-border", meta.accent)}>
                            <meta.icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold">{notification.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground/60">{notification.body}</p>
                            <p className="mt-1 text-[10px] font-semibold text-foreground/60">{timeAgo(notification.createdAt, t)}</p>
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
