"use client"

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gauge,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
} from "lucide-react"
import { motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { Container } from "@/components/shared/container"
import { Reveal } from "@/components/shared/motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import type { ActivationGuide } from "@/lib/mock/activation-guide"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"

const ACCENTS = [
  "bg-accent-cyan",
  "bg-accent-pink",
  "bg-accent-lime",
  "bg-accent-purple",
  "bg-accent-blue",
  "bg-main",
]

export function ActivationGuideView({
  product,
  guide,
}: {
  product: Product
  guide: ActivationGuide
}) {
  const t = useTranslations("activation")
  const tn = useTranslations("nav")
  const isEn = useLocale() === "en"
  const lang = (s: { id: string; en: string }) => (isEn ? s.en : s.id)

  return (
    <Container className="py-8 pb-24 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-foreground/60">
        <Link href="/" className="hover:text-foreground hover:underline">
          {tn("home")}
        </Link>
        <span>/</span>
        <Link href={`/produk/${product.slug}`} className="hover:text-foreground hover:underline">
          {product.name}
        </Link>
        <span>/</span>
        <span className="font-bold text-foreground">{t("title")}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center rounded-base border-2 border-border text-5xl shadow-shadow",
            bgFor(product.accent),
          )}
        >
          {product.logo}
        </div>
        <div className="flex-1">
          <Badge variant="cyan">{product.brand}</Badge>
          <h1 className="mt-1.5 font-heading text-2xl font-extrabold sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-foreground/60">{t("subtitle", { brand: product.brand })}</p>
        </div>
      </div>

      {/* Meta chips */}
      <div className="mt-5 flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm font-bold shadow-shadow-sm">
          <Clock className="size-4" /> {t("timeNeeded")}: {guide.minutes} {t("minutes")}
        </span>
        <span className="inline-flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm font-bold shadow-shadow-sm">
          <Gauge className="size-4" /> {t("difficulty")}: {t(guide.difficulty)}
        </span>
        <span className="inline-flex items-center gap-2 rounded-base border-2 border-border bg-accent-lime px-3 py-2 text-sm font-bold shadow-shadow-sm">
          <ShieldCheck className="size-4" /> {isEn ? "Warranty backed" : "Bergaransi"}
        </span>
      </div>

      {/* Prerequisites */}
      <div className="mt-8 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
          <CheckCircle2 className="size-5 text-success" /> {t("prerequisites")}
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {guide.prerequisites.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border bg-accent-lime text-[10px] font-extrabold">
                ✓
              </span>
              {lang(p)}
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div className="mt-8">
        <h2 className="font-heading text-xl font-extrabold">
          {isEn ? "Activation Steps" : "Langkah Aktivasi"}
        </h2>
        <div className="mt-5 flex flex-col gap-4">
          {guide.steps.map((step, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="flex gap-4 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow-sm">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-base border-2 border-border font-heading text-lg font-extrabold shadow-shadow-sm",
                    ACCENTS[i % ACCENTS.length],
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-base font-bold">
                    {t("step", { n: i + 1 })}: {lang(step.title)}
                  </h3>
                  <p className="mt-1 text-sm text-foreground/70">{lang(step.desc)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Tips */}
      {guide.tips.length > 0 && (
        <div className="mt-8 rounded-base border-2 border-warning bg-warning/10 p-5">
          <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
            <Lightbulb className="size-5 text-warning" /> {t("tipsTitle")}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {guide.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
                {lang(tip)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Troubleshooting */}
      {guide.troubleshooting.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 font-heading text-xl font-extrabold">
            <AlertTriangle className="size-5 text-warning" /> {t("troubleshooting")}
          </h2>
          <Accordion
            type="single"
            collapsible
            className="mt-4 flex flex-col gap-3"
            defaultValue="trouble-0"
          >
            {guide.troubleshooting.map((item, i) => (
              <AccordionItem
                key={i}
                value={`trouble-${i}`}
                className="rounded-base border-2 border-border bg-secondary-background px-4 shadow-shadow-sm"
              >
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="size-4 text-foreground/60" />
                    {lang(item.q)}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70">{lang(item.a)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <Separator className="my-8" />

      {/* CTA: buy + help */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col items-center justify-between gap-4 rounded-base border-2 border-border bg-main p-6 text-center sm:flex-row sm:text-left"
      >
        <div>
          <p className="font-heading text-lg font-extrabold text-main-foreground">
            {t("contactHelp")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="neutral" asChild>
            <Link href={`/produk/${product.slug}`}>
              {isEn ? "Buy This Account" : "Beli Akun Ini"}
            </Link>
          </Button>
          <Button variant="neutral" asChild>
            <Link href="/bantuan">
              {t("contactButton")} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </Container>
  )
}
