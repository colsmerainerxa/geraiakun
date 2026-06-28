"use client"

import { Bot, Code, GraduationCap, type LucideIcon, Palette, Play, Rocket } from "lucide-react"
import { motion } from "motion/react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { cn } from "@/lib/utils"
import type { Category } from "@/types"

const icons: Record<string, LucideIcon> = {
  Bot,
  Palette,
  Play,
  Rocket,
  Code,
  GraduationCap,
}

export function CategoryCard({ category }: { category: Category }) {
  const locale = useLocale()
  const isEn = locale === "en"
  const Icon = icons[category.icon] ?? Bot

  return (
    <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={`/kategori/${category.slug}`}
        className="group flex h-full flex-col gap-3 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow transition-shadow hover:shadow-shadow-lg"
      >
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-base border-2 border-border",
            bgFor(category.color),
          )}
        >
          <Icon className="size-6" />
        </span>
        <div>
          <h3 className="font-heading text-base font-bold">
            {isEn ? category.nameEn : category.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-foreground/60">
            {isEn ? category.descriptionEn : category.description}
          </p>
        </div>
        <span className="mt-auto text-xs font-bold text-foreground/50">
          {category.productCount} produk
        </span>
      </Link>
    </motion.div>
  )
}
