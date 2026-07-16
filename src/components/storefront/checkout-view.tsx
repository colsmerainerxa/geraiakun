"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  FileText,
  KeyRound,
  Lock,
  QrCode,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  TimerReset,
  UserRound,
  Wallet,
} from "lucide-react"
import { motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { createCheckoutOrder } from "@/app/actions/checkout"
import { Container } from "@/components/shared/container"
import { PromoInput } from "@/components/storefront/promo-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useRouter } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { downloadInvoice } from "@/lib/invoice"
import { computeDiscount } from "@/lib/promo"
import { cn, formatIDR, paymentLabel } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import { usePurchasedOrders } from "@/stores/orders"
import { usePayments } from "@/stores/payments"
import { usePromo } from "@/stores/promo"
import type { Order, PaymentMethod } from "@/types"

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  whatsapp: z
    .string()
    .min(9, "Nomor tidak valid")
    .regex(/^[0-9+\-\s]+$/, "Nomor tidak valid"),
})

type FormValues = z.infer<typeof schema>

const ASSURANCE_STEPS = [
  { label: "Invoice dibuat", description: "Nomor invoice dan instruksi bayar langsung tersedia." },
  { label: "Pembayaran dipantau", description: "QRIS, e-wallet, dan VA ditampilkan sebagai status real-time." },
  { label: "Risk check", description: "Order dicek dari sinyal fraud, stok, dan duplikasi akun." },
  { label: "Credential dikirim", description: "Akun masuk ke dashboard, email, dan riwayat pesanan." },
]

const PAYMENT_GROUPS: {
  group: "qris" | "eWallet" | "bankTransfer"
  icon: typeof QrCode
  methods: { id: PaymentMethod; label: string }[]
}[] = [
  {
    group: "qris",
    icon: QrCode,
    methods: [{ id: "qris", label: "QRIS" }],
  },
  {
    group: "eWallet",
    icon: Wallet,
    methods: [
      { id: "gopay", label: "GoPay" },
      { id: "ovo", label: "OVO" },
      { id: "dana", label: "DANA" },
    ],
  },
  {
    group: "bankTransfer",
    icon: CreditCard,
    methods: [
      { id: "bca-va", label: "BCA Virtual Account" },
      { id: "bni-va", label: "BNI Virtual Account" },
      { id: "mandiri-va", label: "Mandiri Virtual Account" },
    ],
  },
]

const FEE = 1000

function CheckoutStepper() {
  const t = useTranslations("checkout")
  const steps = [
    {
      icon: UserRound,
      title: t("stepContactTitle"),
      body: t("stepContactDesc"),
      accent: "bg-accent-lime",
    },
    {
      icon: CreditCard,
      title: t("stepPaymentTitle"),
      body: t("stepPaymentDesc"),
      accent: "bg-main",
    },
    {
      icon: ShieldCheck,
      title: t("stepReviewTitle"),
      body: t("stepReviewDesc"),
      accent: "bg-accent-cyan",
    },
  ]

  return (
    <section className="mb-6 rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-extrabold uppercase text-foreground/60">
          {t("stepperTitle")}
        </h2>
        <Badge variant="neutral">{t("stepperBadge")}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-base border-2 border-border bg-background p-3">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                  step.accent,
                )}
              >
                <step.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-sm font-extrabold">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/60">{step.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CheckoutAssurancePanel({ method }: { method: PaymentMethod }) {
  const highlights = [
    {
      icon: FileText,
      label: "Invoice otomatis",
      body: "Nomor invoice dibuat sebelum credential dikirim.",
      accent: "bg-accent-cyan",
    },
    {
      icon: ScanLine,
      label: "Payment monitor",
      body: `${paymentLabel(method)} dipantau sebagai status pembayaran real-time.`,
      accent: "bg-accent-lime",
    },
    {
      icon: Activity,
      label: "Risk check",
      body: "Order dicek dari duplikasi, stok, dan pola fraud ringan.",
      accent: "bg-accent-purple",
    },
    {
      icon: TimerReset,
      label: "SLA delivery",
      body: "Target pengiriman credential instan setelah pembayaran aman.",
      accent: "bg-accent-pink",
    },
  ]

  return (
    <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">Payment Status v2</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Ringkasan status yang nantinya bisa terhubung ke payment gateway dan fulfillment.
          </p>
        </div>
        <span className="rounded-base border-2 border-border bg-main px-3 py-1 font-heading text-xs font-bold shadow-shadow-sm">
          Mock local
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {highlights.map((item) => (
          <div
            key={item.label}
            className="flex gap-3 rounded-base border-2 border-border bg-background p-3"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow-sm",
                item.accent,
              )}
            >
              <item.icon className="size-4" />
            </span>
            <div>
              <p className="font-heading text-sm font-bold">{item.label}</p>
              <p className="text-xs text-foreground/60">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {ASSURANCE_STEPS.map((step, index) => (
          <div key={step.label} className="rounded-base border-2 border-dashed border-border p-3">
            <p className="font-heading text-xs font-extrabold">
              {index + 1}. {step.label}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground/60">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function CheckoutView() {
  const t = useTranslations("checkout")
  const tc = useTranslations("common")
  const tt = useTranslations("track")
  const isEn = useLocale() === "en"
  const router = useRouter()
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const promo = usePromo((s) => s.promo)
  const clearPromo = usePromo((s) => s.clear)
  const addOrder = usePurchasedOrders((s) => s.addOrder)
  const upsertPaymentAttempt = usePayments((s) => s.upsertAttempt)

  const [method, setMethod] = useState<PaymentMethod>("qris")
  const [processing, setProcessing] = useState(false)
  const [done, _setDone] = useState<Order | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = computeDiscount(promo, subtotal)
  const total = subtotal - discount + FEE

  async function onSubmit(data: FormValues) {
    setProcessing(true)
    try {
      const result = await createCheckoutOrder({
        customer: data,
        paymentMethod: method,
        promoCode: promo?.code ?? null,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty,
        })),
      })
      addOrder(result.order)
      upsertPaymentAttempt(result.payment)
      clear()
      clearPromo()
      router.push(`/pembayaran/${result.order.invoice}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout gagal diproses."
      if (message === "AUTH_REQUIRED") {
        toast.error("Silakan masuk dulu untuk checkout.")
        router.push("/masuk?callbackUrl=/checkout")
      } else {
        toast.error(message)
      }
    } finally {
      setProcessing(false)
    }
  }

  if (done) {
    return (
      <Container className="flex flex-col items-center py-20 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="flex size-24 items-center justify-center rounded-base border-2 border-border bg-accent-lime shadow-shadow"
        >
          <CheckCircle2 className="size-12" />
        </motion.div>
        <h1 className="mt-6 font-heading text-3xl font-extrabold">{t("successTitle")}</h1>
        <p className="mt-2 max-w-md text-foreground/70">{t("successDesc")}</p>
        <div className="mt-5 rounded-base border-2 border-dashed border-border bg-secondary-background px-5 py-3">
          <span className="text-xs text-foreground/60">{t("invoiceLabel")}</span>
          <p className="font-heading text-xl font-extrabold tracking-wide">{done.invoice}</p>
        </div>

        <div className="mt-6 w-full max-w-2xl rounded-base border-2 border-border bg-secondary-background p-5 text-left shadow-shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-extrabold">Status pembayaran</h2>
              <p className="text-sm text-foreground/60">
                Instruksi pembayaran dibuat dan pesanan menunggu konfirmasi gateway.
              </p>
            </div>
            <span className="rounded-base border-2 border-border bg-accent-lime px-3 py-1 font-heading text-xs font-bold shadow-shadow-sm">
              Menunggu Pembayaran
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {ASSURANCE_STEPS.map((step, index) => (
              <div
                key={step.label}
                className="rounded-base border-2 border-border bg-background p-3"
              >
                <span className="flex size-8 items-center justify-center rounded-base border-2 border-border bg-main font-heading text-xs font-extrabold shadow-shadow-sm">
                  {index + 1}
                </span>
                <p className="mt-2 font-heading text-xs font-bold">{step.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {done.credentials.length > 0 && (
          <div className="mt-6 w-full max-w-md text-left">
            <div className="mb-2 flex items-center justify-center gap-2">
              <KeyRound className="size-4" />
              <span className="font-heading text-sm font-bold">{tt("credentials")}</span>
            </div>
            <div className="flex flex-col gap-2">
              {done.credentials.map((c) => (
                <div
                  key={c.email}
                  className="rounded-base border-2 border-border bg-secondary-background p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono">{c.email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${c.email} / ${c.password}`)
                        toast.success(tt("copied"))
                      }}
                      className="flex size-7 shrink-0 items-center justify-center rounded-base border-2 border-border bg-background hover:bg-main"
                      aria-label={tt("copy")}
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                  <span className="block font-mono text-foreground/70">{c.password}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={`/lacak?inv=${done.invoice}`}>{t("viewOrder")}</Link>
          </Button>
          <Button
            variant="neutral"
            size="lg"
            onClick={() => downloadInvoice(done, isEn ? "en" : "id")}
          >
            <Download className="size-5" /> {t("downloadInvoice")}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/katalog">{tc("continue")}</Link>
          </Button>
        </div>
      </Container>
    )
  }

  if (items.length === 0) {
    return (
      <Container className="py-20">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-base border-2 border-dashed border-border bg-secondary-background p-8 text-center shadow-shadow">
          <span className="flex size-16 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm">
            <ShoppingCart className="size-7" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-extrabold">{t("emptyTitle")}</h1>
          <p className="mt-2 text-sm text-foreground/60">{t("emptyDesc")}</p>
          <Button asChild className="mt-5">
            <Link href="/katalog">{t("emptyCta")}</Link>
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-10">
      <Link
        href="/katalog"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {tc("back")}
      </Link>
      <h1 className="mb-8 font-heading text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
      <CheckoutStepper />

      <form
        id="checkout-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-8 pb-24 lg:grid-cols-[1fr_380px] lg:pb-0"
      >
        <div className="flex flex-col gap-8">
          {/* Contact */}
          <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-bold">{t("contactInfo")}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-accent-lime px-2.5 py-1 text-[11px] font-extrabold">
                <UserRound className="size-3.5" /> {t("guestBadge")}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-foreground/60">{t("guestHint")}</p>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  placeholder={t("namePlaceholder")}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  {...register("name")}
                />
                {errors.name && (
                  <span id="name-error" className="text-xs font-bold text-danger">
                    {errors.name.message}
                  </span>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : "email-note"}
                  {...register("email")}
                />
                {errors.email ? (
                  <span id="email-error" className="text-xs font-bold text-danger">
                    {errors.email.message}
                  </span>
                ) : (
                  <span id="email-note" className="text-xs text-foreground/60">
                    {t("emailNote")}
                  </span>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="whatsapp">{t("whatsapp")}</Label>
                <Input
                  id="whatsapp"
                  inputMode="tel"
                  placeholder={t("whatsappPlaceholder")}
                  aria-invalid={!!errors.whatsapp}
                  aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
                  {...register("whatsapp")}
                />
                {errors.whatsapp && (
                  <span id="whatsapp-error" className="text-xs font-bold text-danger">
                    {errors.whatsapp.message}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <h2 className="font-heading text-lg font-bold">{t("paymentMethod")}</h2>
            <div className="mt-4 flex flex-col gap-5">
              {PAYMENT_GROUPS.map((g) => (
                <div key={g.group}>
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground/60">
                    <g.icon className="size-4" /> {t(g.group)}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {g.methods.map((m) => {
                      const active = method === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={cn(
                            "flex items-center justify-between rounded-base border-2 px-4 py-3 text-left font-heading text-sm font-bold transition-all",
                            active
                              ? "border-border bg-main text-main-foreground shadow-shadow-sm"
                              : "border-border bg-background hover:-translate-y-0.5",
                          )}
                        >
                          {m.label}
                          <span
                            className={cn(
                              "flex size-4 items-center justify-center rounded-full border-2 border-border",
                              active && "bg-accent-lime",
                            )}
                          >
                            {active && <span className="size-1.5 rounded-full bg-foreground" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <h2 className="font-heading text-lg font-bold">{t("orderSummary")}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-base border-2 border-border text-xl",
                      bgFor(item.accent),
                    )}
                  >
                    {item.productLogo}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-heading text-sm font-bold leading-tight">
                      {item.productName}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {item.variantLabel} x {item.qty}
                    </span>
                  </div>
                  <span className="font-heading text-sm font-bold">
                    {formatIDR(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <PromoInput subtotal={subtotal} />
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t-2 border-dashed border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/70">{tc("subtotal")}</span>
                <span className="font-bold">{formatIDR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>{tc("discount")}</span>
                  <span className="font-bold">- {formatIDR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-foreground/70">{tc("fee")}</span>
                <span className="font-bold">{formatIDR(FEE)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t-2 border-border pt-2">
                <span className="font-heading font-bold">{tc("total")}</span>
                <span className="font-heading text-2xl font-extrabold">{formatIDR(total)}</span>
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={processing}>
              {processing ? (
                t("processing")
              ) : (
                <>
                  <Lock className="size-4" /> {t("payNow")}
                </>
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-foreground/60">
              <ShieldCheck className="size-3.5" /> {t("agreeNote")}
            </p>
          </div>
        </aside>
      </form>

      {/* Sticky mobile pay bar */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-background/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase text-foreground/60">{tc("total")}</p>
              <p className="font-heading text-lg font-extrabold leading-none">{formatIDR(total)}</p>
            </div>
            <Button
              type="submit"
              form="checkout-form"
              size="lg"
              disabled={processing}
              className="shrink-0"
            >
              <Lock className="size-4" /> {t("payNow")}
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}
