"use client"

import { BellRing } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Tidak mengaku berhasil sebelum endpoint langganan stok tersedia.
 */
export function NotifyMe({ variantLabel }: { variantLabel?: string }) {
  const t = useTranslations("notify")
  const [email, setEmail] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) return
    toast.error("Notifikasi stok belum tersedia.")
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-base border-2 border-border bg-secondary-background p-3.5 shadow-shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <BellRing className="size-4 text-foreground/60" />
        <p className="text-sm font-bold">{t("title")}</p>
      </div>
      <p className="mb-2.5 text-xs text-foreground/60">
        {t("desc")}
        {variantLabel ? ` (${variantLabel})` : ""}
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          className="h-10"
          aria-label={t("placeholder")}
        />
        <Button type="submit" size="sm" className="shrink-0">
          {t("button")}
        </Button>
      </div>
    </form>
  )
}
