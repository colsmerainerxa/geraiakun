"use client"

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  LoaderCircle,
  QrCode,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { useLocale } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { changePaymentMethod, retryPayment } from "@/app/actions/payment"
import { Container } from "@/components/shared/container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMounted } from "@/hooks/use-mounted"
import { Link } from "@/i18n/navigation"
import { DEV_TOOLS } from "@/lib/dev"
import { downloadInvoice } from "@/lib/invoice"
import { cn, formatIDR, paymentLabel } from "@/lib/utils"
import { usePurchasedOrders } from "@/stores/orders"
import { usePayments } from "@/stores/payments"
import type { PaymentMethod, PaymentStatus } from "@/types"

const METHODS: PaymentMethod[] = ["qris", "gopay", "ovo", "dana", "bca-va", "bni-va", "mandiri-va"]

const STATUS_META: Record<
  PaymentStatus,
  {
    label: string
    labelEn: string
    description: string
    descriptionEn: string
    icon: typeof Clock3
    tone: string
    badge: "warning" | "cyan" | "success" | "danger" | "neutral"
  }
> = {
  pending: {
    label: "Menunggu Pembayaran",
    labelEn: "Awaiting Payment",
    description: "Selesaikan pembayaran sebelum waktu habis.",
    descriptionEn: "Complete payment before the timer ends.",
    icon: Clock3,
    tone: "bg-warning",
    badge: "warning",
  },
  checking: {
    label: "Memeriksa Pembayaran",
    labelEn: "Checking Payment",
    description: "Kami sedang mencocokkan transaksi dengan invoice.",
    descriptionEn: "We are matching the transaction to your invoice.",
    icon: LoaderCircle,
    tone: "bg-accent-cyan",
    badge: "cyan",
  },
  paid: {
    label: "Pembayaran Berhasil",
    labelEn: "Payment Confirmed",
    description: "Pesanan masuk ke antrean fulfillment.",
    descriptionEn: "Your order is now in the fulfillment queue.",
    icon: CheckCircle2,
    tone: "bg-accent-lime",
    badge: "success",
  },
  expired: {
    label: "Waktu Pembayaran Habis",
    labelEn: "Payment Expired",
    description: "Buat ulang instruksi pembayaran untuk melanjutkan.",
    descriptionEn: "Generate new payment instructions to continue.",
    icon: AlertTriangle,
    tone: "bg-warning",
    badge: "warning",
  },
  failed: {
    label: "Pembayaran Gagal",
    labelEn: "Payment Failed",
    description: "Pembayaran ditolak atau tidak dapat diproses.",
    descriptionEn: "The payment was declined or could not be processed.",
    icon: XCircle,
    tone: "bg-danger",
    badge: "danger",
  },
  cancelled: {
    label: "Pembayaran Dibatalkan",
    labelEn: "Payment Cancelled",
    description: "Pesanan tetap tersimpan dan dapat dicoba kembali.",
    descriptionEn: "The order is saved and can be retried.",
    icon: XCircle,
    tone: "bg-accent-purple",
    badge: "neutral",
  },
}

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function QrMock({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let hash = 0
    for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
    return Array.from({ length: 169 }, (_, index) => {
      const row = Math.floor(index / 13)
      const column = index % 13
      const finder = (row < 4 && column < 4) || (row < 4 && column > 8) || (row > 8 && column < 4)
      return finder || ((hash >> (index % 24)) & 1) === 1 || (row * column + hash) % 7 < 2
    })
  }, [seed])

  return (
    <div
      className="grid aspect-square w-full max-w-52 grid-cols-[repeat(13,minmax(0,1fr))] gap-px border-4 border-border bg-background p-3"
      aria-label="Pratinjau kode QRIS"
      role="img"
    >
      {cells.map((active, index) => (
        <span key={index} className={active ? "bg-foreground" : "bg-transparent"} />
      ))}
    </div>
  )
}

export function PaymentStatusView({ invoice }: { invoice: string }) {
  const mounted = useMounted()
  const isEn = useLocale() === "en"
  const attempt = usePayments((state) =>
    state.attempts.find((item) => item.invoice.toLowerCase() === invoice.toLowerCase()),
  )
  const setStatus = usePayments((state) => state.setStatus)
  const changeMethod = usePayments((state) => state.changeMethod)
  const retry = usePayments((state) => state.retry)
  const upsertAttempt = usePayments((state) => state.upsertAttempt)
  const order = usePurchasedOrders((state) =>
    state.orders.find((item) => item.invoice.toLowerCase() === invoice.toLowerCase()),
  )
  const updateOrder = usePurchasedOrders((state) => state.updateOrder)
  const [remaining, setRemaining] = useState(0)
  const [methodOpen, setMethodOpen] = useState(false)
  const [nextMethod, setNextMethod] = useState<PaymentMethod>("qris")

  useEffect(() => {
    if (!attempt) return
    const sync = () => {
      const seconds = Math.ceil((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)
      setRemaining(Math.max(0, seconds))
      if (seconds <= 0 && attempt.status === "pending") setStatus(invoice, "expired")
    }
    sync()
    const timer = setInterval(sync, 1000)
    return () => clearInterval(timer)
  }, [attempt, invoice, setStatus])

  if (!mounted) {
    return (
      <Container className="py-12">
        <div className="h-[520px] animate-pulse rounded-base border-2 border-border/30 bg-secondary-background" />
      </Container>
    )
  }

  if (!attempt) {
    return (
      <Container className="py-24 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-base border-2 border-border bg-warning shadow-shadow">
          <AlertTriangle className="size-8" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-extrabold">
          {isEn ? "Payment not found" : "Pembayaran tidak ditemukan"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-foreground/60">
          {isEn
            ? "The local payment attempt may have been cleared. Return to the catalog to create a new order."
            : "Data pembayaran lokal mungkin sudah terhapus. Kembali ke katalog untuk membuat pesanan baru."}
        </p>
        <Button asChild className="mt-5">
          <Link href="/katalog">{isEn ? "Browse catalog" : "Buka Katalog"}</Link>
        </Button>
      </Container>
    )
  }

  const meta = STATUS_META[attempt.status]
  const StatusIcon = meta.icon
  const activePayment = attempt.status === "pending" || attempt.status === "checking"
  const canRetry = ["expired", "failed", "cancelled"].includes(attempt.status)

  function copyCode() {
    void navigator.clipboard?.writeText(attempt?.paymentCode ?? "")
    toast.success(isEn ? "Payment code copied" : "Kode pembayaran disalin")
  }

  function checkPayment() {
    setStatus(invoice, "checking")
    window.setTimeout(() => {
      setStatus(invoice, "paid")
      updateOrder(invoice, { status: "diproses", paidAt: new Date().toISOString() })
      toast.success(isEn ? "Payment confirmed" : "Pembayaran terkonfirmasi")
    }, 1200)
  }

  async function handleRetry() {
    try {
      const nextAttempt = await retryPayment(invoice, attempt!.method)
      upsertAttempt(nextAttempt)
      retry(invoice)
      updateOrder(invoice, { status: "menunggu-pembayaran" })
      toast.success(isEn ? "New payment window created" : "Waktu pembayaran baru dibuat")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat pembayaran baru.")
    }
  }

  async function saveMethod() {
    try {
      const nextAttempt = await changePaymentMethod(invoice, nextMethod)
      upsertAttempt(nextAttempt)
      changeMethod(invoice, nextMethod)
      updateOrder(invoice, { paymentMethod: nextMethod, status: "menunggu-pembayaran" })
      setMethodOpen(false)
      toast.success(isEn ? "Payment method updated" : "Metode pembayaran diperbarui")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengganti metode pembayaran.")
    }
  }

  return (
    <Container className="py-10">
      <Link
        href="/akun"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {isEn ? "Back to account" : "Kembali ke Akun"}
      </Link>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow">
          <div
            className={cn(
              "flex flex-wrap items-start justify-between gap-4 border-b-2 border-border p-6",
              meta.tone,
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm">
                <StatusIcon
                  className={cn("size-6", attempt.status === "checking" && "animate-spin")}
                />
              </span>
              <div>
                <Badge variant={meta.badge}>{isEn ? meta.labelEn : meta.label}</Badge>
                <h1 className="mt-2 font-heading text-2xl font-extrabold">{invoice}</h1>
                <p className="text-sm font-bold text-foreground/70">
                  {isEn ? meta.descriptionEn : meta.description}
                </p>
              </div>
            </div>
            {activePayment && (
              <div className="rounded-base border-2 border-border bg-secondary-background px-4 py-2 text-right shadow-shadow-sm">
                <p className="text-xs font-bold uppercase text-foreground/60">
                  {isEn ? "Time left" : "Sisa waktu"}
                </p>
                <p className="font-mono text-xl font-extrabold">{formatCountdown(remaining)}</p>
              </div>
            )}
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex justify-center">
              {attempt.method === "qris" ? (
                <QrMock seed={attempt.qrPayload ?? attempt.paymentCode} />
              ) : (
                <div className="flex aspect-square w-full max-w-52 flex-col items-center justify-center rounded-base border-2 border-border bg-background p-5 text-center">
                  <span className="flex size-16 items-center justify-center rounded-base border-2 border-border bg-accent-cyan shadow-shadow-sm">
                    <QrCode className="size-8" />
                  </span>
                  <p className="mt-4 font-heading text-sm font-extrabold">
                    {paymentLabel(attempt.method)}
                  </p>
                  <p className="mt-1 text-xs text-foreground/60">
                    {isEn
                      ? "Open your payment app to continue."
                      : "Buka aplikasi pembayaran untuk melanjutkan."}
                  </p>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-foreground/60">
                {isEn ? "Payment method" : "Metode pembayaran"}
              </p>
              <p className="mt-1 font-heading text-lg font-extrabold">
                {paymentLabel(attempt.method)}
              </p>
              <div className="mt-4 rounded-base border-2 border-border bg-background p-4">
                <p className="text-xs font-bold text-foreground/60">
                  {attempt.method === "qris"
                    ? "QR reference"
                    : isEn
                      ? "Payment code"
                      : "Kode pembayaran"}
                </p>
                <div className="mt-1 flex min-w-0 items-center justify-between gap-3">
                  <code className="truncate font-heading text-base font-extrabold">
                    {attempt.paymentCode}
                  </code>
                  <Button
                    size="icon-sm"
                    variant="neutral"
                    onClick={copyCode}
                    aria-label={isEn ? "Copy payment code" : "Salin kode pembayaran"}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-y-2 border-dashed border-border py-4">
                <span className="font-bold text-foreground/60">
                  {isEn ? "Total" : "Total bayar"}
                </span>
                <span className="font-heading text-2xl font-extrabold">
                  {formatIDR(attempt.amount)}
                </span>
              </div>
              {attempt.failureReason && (
                <p className="mt-4 rounded-base border-2 border-danger bg-danger/10 p-3 text-sm font-bold text-danger">
                  {attempt.failureReason}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {activePayment && (
                  <Button onClick={checkPayment} disabled={attempt.status === "checking"}>
                    <RefreshCcw
                      className={cn("size-4", attempt.status === "checking" && "animate-spin")}
                    />
                    {isEn ? "Check payment" : "Cek Pembayaran"}
                  </Button>
                )}
                {canRetry && (
                  <Button onClick={handleRetry}>
                    <RotateCcw className="size-4" /> {isEn ? "Try again" : "Coba Lagi"}
                  </Button>
                )}
                {attempt.status !== "paid" && (
                  <Button
                    variant="neutral"
                    onClick={() => {
                      setNextMethod(attempt.method)
                      setMethodOpen(true)
                    }}
                  >
                    {isEn ? "Change method" : "Ganti Metode"}
                  </Button>
                )}
                {order && (
                  <Button
                    variant="ghost"
                    onClick={() => downloadInvoice(order, isEn ? "en" : "id")}
                  >
                    <Download className="size-4" /> Invoice
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-5">
          <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
            <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold">
              <ShieldCheck className="size-5" /> {isEn ? "Order timeline" : "Timeline Pesanan"}
            </h2>
            <ol className="mt-4 flex flex-col gap-4">
              {[
                { label: isEn ? "Invoice created" : "Invoice dibuat", done: true },
                {
                  label: isEn ? "Payment confirmed" : "Pembayaran dikonfirmasi",
                  done: attempt.status === "paid",
                },
                {
                  label: isEn ? "Risk and stock check" : "Cek risiko dan stok",
                  done: attempt.status === "paid",
                },
                {
                  label: isEn ? "Credential delivered" : "Credential dikirim",
                  done: order?.status === "selesai",
                },
              ].map((step, index) => (
                <li key={step.label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border text-xs font-extrabold",
                      step.done ? "bg-accent-lime" : "bg-background",
                    )}
                  >
                    {step.done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <p className={cn("pt-1 text-sm font-bold", !step.done && "text-foreground/60")}>
                    {step.label}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {DEV_TOOLS && (
            <div className="rounded-base border-2 border-dashed border-border bg-main p-4 text-sm">
              <p className="font-heading font-extrabold">Frontend state preview</p>
              <p className="mt-1 text-xs font-bold text-main-foreground/65">
                {isEn
                  ? "Switch state to review every payment outcome before backend integration."
                  : "Ganti status untuk memeriksa seluruh hasil pembayaran sebelum integrasi backend."}
              </p>
              <Select
                value={attempt.status}
                onValueChange={(value) =>
                  setStatus(
                    invoice,
                    value as PaymentStatus,
                    value === "failed" ? "Transaksi ditolak oleh kanal pembayaran." : null,
                  )
                }
              >
                <SelectTrigger className="mt-3 bg-secondary-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_META).map(([value, item]) => (
                    <SelectItem key={value} value={value}>
                      {isEn ? item.labelEn : item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </aside>
      </div>

      <Dialog open={methodOpen} onOpenChange={setMethodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEn ? "Change payment method" : "Ganti Metode Pembayaran"}</DialogTitle>
            <DialogDescription>
              {isEn
                ? "A new payment code and expiry time will be generated."
                : "Kode pembayaran dan waktu kedaluwarsa baru akan dibuat."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>{isEn ? "Payment method" : "Metode pembayaran"}</Label>
            <Select
              value={nextMethod}
              onValueChange={(value) => setNextMethod(value as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {paymentLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setMethodOpen(false)}>
              {isEn ? "Cancel" : "Batal"}
            </Button>
            <Button onClick={saveMethod}>{isEn ? "Use method" : "Gunakan Metode"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
