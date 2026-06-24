"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Container } from "@/components/shared/container"
import { PromoInput } from "@/components/storefront/promo-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useRouter } from "@/i18n/navigation"
import { bgFor } from "@/lib/accent"
import { computeDiscount } from "@/lib/promo"
import { cn, formatIDR } from "@/lib/utils"
import { useCart } from "@/stores/cart"
import { usePromo } from "@/stores/promo"
import type { PaymentMethod } from "@/types"

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  whatsapp: z
    .string()
    .min(9, "Nomor tidak valid")
    .regex(/^[0-9+\-\s]+$/, "Nomor tidak valid"),
})

type FormValues = z.infer<typeof schema>

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

function makeInvoice() {
  const n = Math.floor(1000 + Math.random() * 8999)
  return `INV-2026${n}`
}

export function CheckoutView() {
  const t = useTranslations("checkout")
  const tc = useTranslations("common")
  const router = useRouter()
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const promo = usePromo((s) => s.promo)
  const clearPromo = usePromo((s) => s.clear)

  const [method, setMethod] = useState<PaymentMethod>("qris")
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState<{ invoice: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = computeDiscount(promo, subtotal)
  const total = subtotal - discount + FEE

  // Empty cart guard (skip once an order succeeded).
  useEffect(() => {
    if (items.length === 0 && !done) {
      const id = setTimeout(() => router.push("/katalog"), 1500)
      return () => clearTimeout(id)
    }
  }, [items.length, done, router])

  function onSubmit() {
    setProcessing(true)
    setTimeout(() => {
      const invoice = makeInvoice()
      clear()
      clearPromo()
      setProcessing(false)
      setDone({ invoice })
    }, 1600)
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
        <h1 className="mt-6 font-heading text-3xl font-extrabold">
          {t("successTitle")}
        </h1>
        <p className="mt-2 max-w-md text-foreground/70">{t("successDesc")}</p>
        <div className="mt-5 rounded-base border-2 border-dashed border-border bg-secondary-background px-5 py-3">
          <span className="text-xs text-foreground/60">
            {t("invoiceLabel")}
          </span>
          <p className="font-heading text-xl font-extrabold tracking-wide">
            {done.invoice}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={`/lacak?inv=${done.invoice}`}>{t("viewOrder")}</Link>
          </Button>
          <Button asChild variant="neutral" size="lg">
            <Link href="/katalog">{tc("continue")}</Link>
          </Button>
        </div>
      </Container>
    )
  }

  if (items.length === 0) {
    return (
      <Container className="py-24 text-center">
        <p className="text-foreground/60">{t("emptyRedirect")}</p>
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
      <h1 className="mb-8 font-heading text-3xl font-extrabold sm:text-4xl">
        {t("title")}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-8 lg:grid-cols-[1fr_380px]"
      >
        <div className="flex flex-col gap-8">
          {/* Contact */}
          <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <h2 className="font-heading text-lg font-bold">
              {t("contactInfo")}
            </h2>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  placeholder={t("namePlaceholder")}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name && (
                  <span className="text-xs font-bold text-danger">
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
                  {...register("email")}
                />
                {errors.email ? (
                  <span className="text-xs font-bold text-danger">
                    {errors.email.message}
                  </span>
                ) : (
                  <span className="text-xs text-foreground/50">
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
                  {...register("whatsapp")}
                />
                {errors.whatsapp && (
                  <span className="text-xs font-bold text-danger">
                    {errors.whatsapp.message}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
            <h2 className="font-heading text-lg font-bold">
              {t("paymentMethod")}
            </h2>
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
                            {active && (
                              <span className="size-1.5 rounded-full bg-foreground" />
                            )}
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
            <h2 className="font-heading text-lg font-bold">
              {t("orderSummary")}
            </h2>
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
                      {item.variantLabel} × {item.qty}
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
                <span className="font-heading text-2xl font-extrabold">
                  {formatIDR(total)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-5 w-full"
              disabled={processing}
            >
              {processing ? (
                t("processing")
              ) : (
                <>
                  <Lock className="size-4" /> {t("payNow")}
                </>
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-foreground/50">
              <ShieldCheck className="size-3.5" /> {t("agreeNote")}
            </p>
          </div>
        </aside>
      </form>
    </Container>
  )
}
