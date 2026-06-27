"use client"

import { Copy, MessageCircle, Send, Share2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { SITE_URL } from "@/lib/seo/site"
import { cn } from "@/lib/utils"

export function ShareButtons({ path, title }: { path: string; title: string }) {
  const t = useTranslations("blog")
  const tt = useTranslations("track")
  const url = `${SITE_URL}${path}`
  const enc = encodeURIComponent

  const targets = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${enc(`${title} ${url}`)}`,
      color: "bg-accent-lime",
    },
    {
      label: "X",
      icon: Share2,
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
      color: "bg-secondary-background",
    },
    {
      label: "Telegram",
      icon: Send,
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
      color: "bg-accent-cyan",
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/60">
        <Share2 className="size-4" /> {t("share")}:
      </span>
      {targets.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-base border-2 border-border px-3 py-1.5 font-heading text-xs font-bold shadow-shadow-sm transition-all hover:-translate-y-0.5",
            s.color,
          )}
        >
          <s.icon className="size-3.5" /> {s.label}
        </a>
      ))}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url)
          toast.success(t("shareCopied"))
        }}
        className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-background px-3 py-1.5 font-heading text-xs font-bold shadow-shadow-sm transition-all hover:-translate-y-0.5"
        aria-label={tt("copy")}
      >
        <Copy className="size-3.5" /> {tt("copy")}
      </button>
    </div>
  )
}
