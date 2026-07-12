"use client"

import { Tag, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { computeDiscount } from "@/lib/promo"
import { formatIDR } from "@/lib/utils"
import { usePromo } from "@/stores/promo"

export function PromoInput({ subtotal }: { subtotal: number }) {
  const t = useTranslations("cart")
  const promo = usePromo((s) => s.promo)
  const apply = usePromo((s) => s.apply)
  const clear = usePromo((s) => s.clear)
  const [code, setCode] = useState("")

  const discount = computeDiscount(promo, subtotal)
  const belowMin = promo != null && subtotal < promo.minSpend

  async function handleApply() {
    const ok = await apply(code)
    if (ok) {
      toast.success(t("promoApplied"), { description: code.toUpperCase() })
      setCode("")
    } else {
      toast.error(t("promoInvalid"))
    }
  }

  if (promo) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-base border-2 border-border bg-accent-lime/30 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Tag className="size-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold">{promo.code}</p>
            <p className="truncate text-xs text-foreground/60">
              {belowMin ? `Min. belanja ${formatIDR(promo.minSpend)}` : `- ${formatIDR(discount)}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clear}
          className="flex size-7 shrink-0 items-center justify-center rounded-base border-2 border-border bg-secondary-background hover:bg-danger hover:text-white"
          aria-label={t("promoCode")}
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("promoPlaceholder")}
          className="pl-9 uppercase"
          aria-label={t("promoCode")}
        />
      </div>
      <Button type="button" variant="neutral" onClick={handleApply} disabled={!code.trim()}>
        {t("applyPromo")}
      </Button>
    </div>
  )
}
