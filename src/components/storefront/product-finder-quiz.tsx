"use client"

import { ArrowLeft, ArrowRight, Check, ShoppingCart, Sparkles, Wand2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Container } from "@/components/shared/container"
import { CompareButton } from "@/components/storefront/compare"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Link } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { useProducts } from "@/lib/api/queries"
import { cn, formatPrice } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import type { Product, QuizQuestion, RecommendationResult } from "@/types"

type AnswerMap = Record<string, string>

const QUESTION_IDS = ["need", "budget", "duration", "priority"] as const

function cheapestInStock(product: Product) {
  return [...product.variants]
    .filter((variant) => variant.stock > 0)
    .sort((a, b) => a.price - b.price)[0]
}

function preferredVariant(product: Product, answers: AnswerMap) {
  const available = product.variants.filter((variant) => variant.stock > 0)
  const variants = available.length > 0 ? available : product.variants
  const sorted = [...variants].sort((a, b) => a.price - b.price)

  if (answers.duration === "trial") {
    return sorted.find((variant) => variant.price === 0) ?? sorted[0]
  }

  if (answers.duration === "annual") {
    return sorted.find((variant) => (variant.durationDays ?? 0) >= 180) ?? sorted[0]
  }

  if (answers.priority === "privacy") {
    return sorted.find((variant) => variant.type === "private") ?? sorted[0]
  }

  return sorted[0]
}

function budgetLimit(value?: string) {
  if (value === "hemat") return 20000
  if (value === "balanced") return 50000
  return Number.POSITIVE_INFINITY
}

function buildResults(
  answers: AnswerMap,
  isEn: boolean,
  reasonLabels: Record<string, string>,
  products: Product[],
): RecommendationResult[] {
  return products
    .map((product) => {
      const variant = preferredVariant(product, answers)
      const minVariant = cheapestInStock(product) ?? variant
      const stock = product.variants.reduce((sum, item) => sum + item.stock, 0)
      const reasons: string[] = []
      let score = 38

      if (answers.need === "developer" && product.category === "api-developer") {
        score += 28
        reasons.push(reasonLabels.developer)
      }

      if (answers.need !== "developer" && product.category === "ai-chatbot") {
        score += 20
        reasons.push(reasonLabels.ai)
      }

      const maxBudget = budgetLimit(answers.budget)
      if (minVariant.price <= maxBudget) {
        score += 18
        reasons.push(reasonLabels.budget)
      } else if (minVariant.price <= maxBudget * 1.5) {
        score += 8
      } else {
        score -= 8
      }

      if (answers.duration === "trial" && product.variants.some((item) => item.price === 0)) {
        score += 18
        reasons.push(reasonLabels.trial)
      }

      if (
        answers.duration === "annual" &&
        product.variants.some((item) => (item.durationDays ?? 0) >= 180)
      ) {
        score += 14
        reasons.push(reasonLabels.annual)
      }

      if (
        answers.duration === "monthly" &&
        product.variants.some(
          (item) => item.durationDays !== null && item.durationDays > 0 && item.durationDays <= 45,
        )
      ) {
        score += 12
        reasons.push(reasonLabels.monthly)
      }

      if (answers.priority === "price" && minVariant.price <= 20000) {
        score += 12
        reasons.push(reasonLabels.price)
      }

      if (
        answers.priority === "privacy" &&
        product.variants.some((item) => item.type === "private")
      ) {
        score += 12
        reasons.push(reasonLabels.privacy)
      }

      if (answers.priority === "speed" && stock >= 20) {
        score += 10
        reasons.push(reasonLabels.speed)
      }

      if (
        answers.priority === "features" &&
        (isEn ? product.featuresEn : product.features).length >= 4
      ) {
        score += 10
        reasons.push(reasonLabels.features)
      }

      if (product.badges.includes("terlaris")) score += 4
      if (product.badges.includes("promo")) score += 4

      return {
        product,
        variantId: variant.id,
        score: Math.max(45, Math.min(98, score)),
        reasons: Array.from(new Set(reasons)).slice(0, 3),
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function ProductFinderQuiz() {
  const t = useTranslations("finder")
  const tc = useTranslations("common")
  const isEn = useLocale() === "en"
  const { data: products } = useProducts()
  const addItem = useCart((state) => state.addItem)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})

  const questions = useMemo<QuizQuestion[]>(
    () => [
      {
        id: "need",
        title: t("needTitle"),
        description: t("needDesc"),
        options: [
          {
            value: "ai",
            label: t("needAi"),
            description: t("needAiDesc"),
            accent: "bg-accent-cyan",
          },
          {
            value: "developer",
            label: t("needDeveloper"),
            description: t("needDeveloperDesc"),
            accent: "bg-accent-lime",
          },
          {
            value: "study",
            label: t("needStudy"),
            description: t("needStudyDesc"),
            accent: "bg-accent-purple",
          },
        ],
      },
      {
        id: "budget",
        title: t("budgetTitle"),
        description: t("budgetDesc"),
        options: [
          {
            value: "hemat",
            label: t("budgetHemat"),
            description: t("budgetHematDesc"),
            accent: "bg-main",
          },
          {
            value: "balanced",
            label: t("budgetBalanced"),
            description: t("budgetBalancedDesc"),
            accent: "bg-accent-cyan",
          },
          {
            value: "flex",
            label: t("budgetFlex"),
            description: t("budgetFlexDesc"),
            accent: "bg-accent-pink",
          },
        ],
      },
      {
        id: "duration",
        title: t("durationTitle"),
        description: t("durationDesc"),
        options: [
          {
            value: "trial",
            label: t("durationTrial"),
            description: t("durationTrialDesc"),
            accent: "bg-accent-lime",
          },
          {
            value: "monthly",
            label: t("durationMonthly"),
            description: t("durationMonthlyDesc"),
            accent: "bg-main",
          },
          {
            value: "annual",
            label: t("durationAnnual"),
            description: t("durationAnnualDesc"),
            accent: "bg-accent-blue",
          },
        ],
      },
      {
        id: "priority",
        title: t("priorityTitle"),
        description: t("priorityDesc"),
        options: [
          {
            value: "price",
            label: t("priorityPrice"),
            description: t("priorityPriceDesc"),
            accent: "bg-main",
          },
          {
            value: "speed",
            label: t("prioritySpeed"),
            description: t("prioritySpeedDesc"),
            accent: "bg-accent-cyan",
          },
          {
            value: "privacy",
            label: t("priorityPrivacy"),
            description: t("priorityPrivacyDesc"),
            accent: "bg-accent-purple",
          },
          {
            value: "features",
            label: t("priorityFeatures"),
            description: t("priorityFeaturesDesc"),
            accent: "bg-accent-lime",
          },
        ],
      },
    ],
    [t],
  )

  const done = step >= questions.length
  const current = questions[Math.min(step, questions.length - 1)]
  const currentAnswer = answers[current.id]
  const completedCount = QUESTION_IDS.filter((id) => answers[id]).length
  const progress = done ? 100 : (completedCount / questions.length) * 100
  const reasonLabels = useMemo(
    () => ({
      ai: t("reasonAi"),
      developer: t("reasonDeveloper"),
      budget: t("reasonBudget"),
      trial: t("reasonTrial"),
      annual: t("reasonAnnual"),
      monthly: t("reasonMonthly"),
      price: t("reasonPrice"),
      privacy: t("reasonPrivacy"),
      speed: t("reasonSpeed"),
      features: t("reasonFeatures"),
    }),
    [t],
  )
  const results = useMemo(
    () => buildResults(answers, isEn, reasonLabels, products ?? []).slice(0, 3),
    [answers, isEn, reasonLabels, products],
  )

  function choose(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function next() {
    if (!currentAnswer) return
    setStep((value) => Math.min(questions.length, value + 1))
  }

  function restart() {
    setAnswers({})
    setStep(0)
  }

  function addResult(result: RecommendationResult) {
    const variant =
      result.product.variants.find((item) => item.id === result.variantId) ??
      preferredVariant(result.product, answers)

    addItem({
      productId: result.product.id,
      productName: result.product.name,
      productLogo: result.product.logo,
      productSlug: result.product.slug,
      variantId: variant.id,
      variantLabel: isEn ? variant.labelEn : variant.label,
      price: variant.price,
      qty: 1,
      accent: result.product.accent,
    })
    toast.success(t("addedToCart"), { description: result.product.name })
  }

  return (
    <Container className="py-8 pb-24 lg:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="purple">
            <Wand2 className="size-3" /> {t("eyebrow")}
          </Badge>
          <h1 className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-foreground/70">{t("subtitle")}</p>
        </div>
        <Button variant="neutral" asChild>
          <Link href="/katalog">{tc("viewAll")}</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="self-start">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-accent-purple" />
                {done
                  ? t("resultTitle")
                  : t("stepLabel", { current: step + 1, total: questions.length })}
              </CardTitle>
              <Badge variant="neutral">{Math.round(progress)}%</Badge>
            </div>
            <Progress value={progress} className="mt-3 h-3" indicatorClassName="bg-accent-purple" />
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="rounded-base border-2 border-dashed border-border bg-background p-4">
                <p className="font-heading text-lg font-extrabold">{t("doneTitle")}</p>
                <p className="mt-1 text-sm text-foreground/60">{t("doneDesc")}</p>
                <Button variant="neutral" className="mt-4" onClick={restart}>
                  <ArrowLeft className="size-4" /> {t("restart")}
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="font-heading text-xl font-extrabold">{current.title}</h2>
                  <p className="mt-1 text-sm text-foreground/60">{current.description}</p>
                </div>
                <div className="mt-5 grid gap-3">
                  {current.options.map((option) => {
                    const active = currentAnswer === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => choose(current.id, option.value)}
                        className={cn(
                          "flex items-start gap-3 rounded-base border-2 border-border bg-secondary-background p-3 text-left shadow-shadow-sm transition-all",
                          active ? "translate-x-1 translate-y-1 shadow-none" : "brutal-press",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                            option.accent,
                          )}
                        >
                          {active ? <Check className="size-5" /> : <Sparkles className="size-5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-heading text-sm font-extrabold">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-foreground/60">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    disabled={step === 0}
                    onClick={() => setStep((value) => Math.max(0, value - 1))}
                  >
                    <ArrowLeft className="size-4" /> {tc("back")}
                  </Button>
                  <Button onClick={next} disabled={!currentAnswer}>
                    {step === questions.length - 1 ? t("showResult") : tc("continue")}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <div className="rounded-base border-2 border-border bg-main p-4 shadow-shadow">
            <h2 className="font-heading text-lg font-extrabold text-main-foreground">
              {done ? t("resultTitle") : t("previewTitle")}
            </h2>
            <p className="mt-1 text-sm font-semibold text-main-foreground/70">
              {done ? t("resultDesc") : t("previewDesc")}
            </p>
          </div>

          {results.map((result, index) => {
            const product = result.product
            const variant =
              product.variants.find((item) => item.id === result.variantId) ??
              preferredVariant(product, answers)

            return (
              <article
                key={product.id}
                className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <Link
                    href={`/produk/${product.slug}`}
                    className={cn(
                      "flex size-16 shrink-0 items-center justify-center rounded-base border-2 border-border text-4xl shadow-shadow-sm",
                      bgFor(product.accent),
                    )}
                  >
                    {product.logo}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Badge variant={index === 0 ? "lime" : "neutral"}>
                          {index === 0 ? t("bestMatch") : t("match")}
                        </Badge>
                        <Link
                          href={`/produk/${product.slug}`}
                          className="mt-2 block font-heading text-xl font-extrabold leading-tight hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm text-foreground/60">
                          {isEn ? product.taglineEn : product.tagline}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-2xl font-extrabold">{result.score}%</p>
                        <p className="text-[10px] font-bold uppercase text-foreground/50">
                          {t("score")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(result.reasons.length > 0 ? result.reasons : [t("reasonFallback")]).map(
                        (reason) => (
                          <Badge key={reason} variant="neutral">
                            {reason}
                          </Badge>
                        ),
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-border pt-3">
                      <div className="mr-auto">
                        <p className="text-xs font-bold text-foreground/50">
                          {isEn ? variant.labelEn : variant.label}
                        </p>
                        <p className="font-heading text-lg font-extrabold">
                          {formatPrice(variant.price, isEn)}
                        </p>
                      </div>
                      <CompareButton slug={product.slug} size="sm" withLabel />
                      <Button variant="neutral" size="sm" onClick={() => addResult(result)}>
                        <ShoppingCart className="size-4" /> {tc("addToCart")}
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/produk/${product.slug}`}>{tc("viewDetail")}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </Container>
  )
}
