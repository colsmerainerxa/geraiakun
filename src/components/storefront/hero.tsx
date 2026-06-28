"use client"

import { ArrowRight, PlayCircle, Sparkles, Star } from "lucide-react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { Container } from "@/components/shared/container"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

const floatingLogos = [
  { emoji: "🤖", className: "left-[6%] top-[18%]", accent: "bg-accent-cyan", delay: 0 },
  { emoji: "🎨", className: "right-[8%] top-[12%]", accent: "bg-accent-pink", delay: 0.3 },
  { emoji: "🎵", className: "left-[12%] bottom-[14%]", accent: "bg-accent-lime", delay: 0.6 },
  { emoji: "🔑", className: "right-[10%] bottom-[18%]", accent: "bg-accent-blue", delay: 0.9 },
  { emoji: "✨", className: "left-[44%] top-[6%]", accent: "bg-main", delay: 1.2 },
]

const stats = [
  { value: "200+", key: "statProducts" },
  { value: "50rb+", key: "statCustomers" },
  { value: "4.9★", key: "statRating" },
  { value: "24/7", key: "statSupport" },
] as const

export function Hero() {
  const t = useTranslations("home")

  return (
    <section className="relative overflow-hidden border-b-2 border-border bg-background">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.07]" />

      {/* Floating brand chips (desktop) */}
      {floatingLogos.map((f) => (
        <motion.div
          key={f.emoji}
          className={`absolute hidden size-16 items-center justify-center rounded-base border-2 border-border ${f.accent} text-3xl shadow-shadow lg:flex ${f.className}`}
          animate={{ y: [0, -14, 0], rotate: [-3, 3, -3] }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            delay: f.delay,
            ease: "easeInOut",
          }}
        >
          {f.emoji}
        </motion.div>
      ))}

      <Container className="relative py-20 text-center sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-3xl flex-col items-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background px-3 py-1.5 font-heading text-xs font-bold shadow-shadow-sm sm:text-sm">
            <Sparkles className="size-4 text-accent-pink" /> {t("heroBadge")}
          </span>

          <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            {t("heroTitle")}
          </h1>

          <p className="mt-5 max-w-2xl text-base text-foreground/70 text-balance sm:text-lg">
            {t("heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="xl" asChild>
              <Link href="/katalog">
                {t("heroCtaPrimary")} <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button size="xl" variant="neutral" asChild>
              <Link href="#cara-kerja">
                <PlayCircle className="size-5" /> {t("heroCtaSecondary")}
              </Link>
            </Button>
          </div>

          {/* Rating proof */}
          <div className="mt-6 flex items-center gap-2 text-sm text-foreground/60">
            <div className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-4 fill-warning text-warning" />
              ))}
            </div>
            <span>
              <strong className="text-foreground">4.9/5</strong> dari 12.000+ ulasan
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.key}
              className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow"
            >
              <div className="font-heading text-2xl font-extrabold sm:text-3xl">{s.value}</div>
              <div className="text-xs text-foreground/60">{t(s.key)}</div>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
