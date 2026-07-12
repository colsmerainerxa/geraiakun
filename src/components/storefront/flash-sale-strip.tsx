"use client"

import { Flame } from "lucide-react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Container } from "@/components/shared/container"
import { CountdownTimer } from "@/components/shared/countdown-timer"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { useFlashSale } from "@/lib/api/queries"
import { cn, formatIDR, formatNumber } from "@/lib/utils"

export function FlashSaleStrip() {
  const t = useTranslations("flashSale")
  const { data: flashSales = [] } = useFlashSale()

  // Map DB flash sales to display items
  const items = flashSales.map((fs: any) => ({
    product: { id: fs.product.id, slug: fs.product.slug, name: fs.product.name, logo: fs.product.logo, accent: fs.product.accent },
    salePrice: fs.salePrice,
    originalPrice: fs.variant.price,
    off: Math.round((1 - fs.salePrice / fs.variant.price) * 100),
    soldCount: fs.sold,
    claimedRatio: fs.quota ? fs.sold / fs.quota : 0,
  }))

  // Use earliest ending flash sale as countdown target
  const [end] = useState(() => {
    if (flashSales.length > 0) return flashSales[0].endsAt
    return new Date(Date.now() + 86400000).toISOString()
  })

  if (items.length === 0) return null

  return (
    <div className="border-y-2 border-border bg-main">
      <Container className="py-10 text-main-foreground">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="flex size-12 items-center justify-center rounded-base border-2 border-border bg-accent-pink shadow-shadow"
            >
              <Flame className="size-6" />
            </motion.span>
            <div>
              <p className="font-heading text-xs font-extrabold uppercase tracking-widest text-main-foreground/70">
                {t("eyebrow")}
              </p>
              <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">{t("title")}</h2>
            </div>
          </div>
          <CountdownTimer targetISO={end} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item: any, i: number) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/produk/${item.product.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-base border-2 border-border bg-secondary-background text-foreground shadow-shadow-sm transition-all hover:-translate-y-1 hover:shadow-shadow"
              >
                <div
                  className={cn(
                    "relative flex aspect-square items-center justify-center border-b-2 border-border",
                    bgFor(item.product.accent),
                  )}
                >
                  <span className="text-4xl drop-shadow-[2px_2px_0_var(--border)]">
                    {item.product.logo}
                  </span>
                  <Badge variant="danger" className="absolute left-1.5 top-1.5">
                    -{item.off}%
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2.5">
                  <p className="truncate font-heading text-xs font-bold leading-tight">
                    {item.product.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-sm font-extrabold text-danger">
                      {formatIDR(item.salePrice, { compact: true })}
                    </span>
                  </div>
                  <span className="text-[10px] text-foreground/60 line-through">
                    {formatIDR(item.originalPrice, { compact: true })}
                  </span>

                  <Progress
                    value={item.claimedRatio * 100}
                    className="mt-1.5 h-1.5 border-0 bg-foreground/15"
                    indicatorClassName="bg-danger"
                  />
                  <span className="text-[9px] font-bold text-foreground/60">
                    {formatNumber(item.soldCount)} {t("sold")}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </div>
  )
}
