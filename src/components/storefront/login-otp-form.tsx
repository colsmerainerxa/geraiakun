"use client"

import { ArrowLeft, Loader2, MailCheck, RefreshCw } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OtpLabels = {
  title: string
  description: string
  code: string
  expires: string
  verify: string
  resend: string
  resendIn: string
  back: string
  openTestEmail: string
}

const defaultLabels: OtpLabels = {
  title: "Verifikasi perangkat baru",
  description: "Kode enam digit telah dikirim ke",
  code: "Kode OTP",
  expires: "Kode berakhir dalam",
  verify: "Verifikasi dan masuk",
  resend: "Kirim ulang kode",
  resendIn: "Kirim ulang dalam",
  back: "Kembali",
  openTestEmail: "Buka email pengujian",
}

function remainingSeconds(value: string, now: number) {
  return Math.max(0, Math.ceil((new Date(value).getTime() - now) / 1_000))
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`
}

export function LoginOtpForm({
  maskedEmail,
  expiresAt,
  resendAt,
  previewUrl,
  labels = defaultLabels,
  onVerify,
  onResend,
  onCancel,
}: {
  maskedEmail: string
  expiresAt: string
  resendAt: string
  previewUrl?: string | null
  labels?: OtpLabels
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
  onCancel: () => void | Promise<void>
}) {
  const [code, setCode] = useState("")
  const [now, setNow] = useState(() => Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const expirySeconds = remainingSeconds(expiresAt, now)
  const resendSeconds = remainingSeconds(resendAt, now)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(interval)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (code.length !== 6 || submitting || expirySeconds === 0) return
    setSubmitting(true)
    try {
      await onVerify(code)
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    if (resending || resendSeconds > 0) return
    setResending(true)
    try {
      await onResend()
      setCode("")
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <div className="flex items-start gap-3 border-b-2 border-border pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-base border-2 border-border bg-accent-lime">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-extrabold">{labels.title}</h2>
          <p id="login-otp-help" className="mt-1 text-sm text-foreground/65">
            {labels.description}{" "}
            <strong className="break-all text-foreground">{maskedEmail}</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="login-otp">{labels.code}</Label>
        <Input
          id="login-otp"
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          aria-describedby="login-otp-help login-otp-expiry"
          className="h-12 text-center font-mono text-xl font-extrabold"
          autoFocus
        />
        <p id="login-otp-expiry" className="text-center text-xs font-bold text-foreground/60">
          {labels.expires} {formatTime(expirySeconds)}
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full"
        disabled={code.length !== 6 || submitting || expirySeconds === 0}
      >
        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {labels.verify}
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="neutral" className="h-11" onClick={onCancel}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {labels.back}
        </Button>
        <Button
          type="button"
          variant="neutral"
          className="h-11"
          onClick={resend}
          disabled={resending || resendSeconds > 0}
        >
          <RefreshCw className={`size-4 ${resending ? "animate-spin" : ""}`} aria-hidden="true" />
          {resendSeconds > 0 ? `${labels.resendIn} ${formatTime(resendSeconds)}` : labels.resend}
        </Button>
      </div>

      {previewUrl && (
        <Button asChild type="button" variant="neutral" className="h-11 w-full">
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            {labels.openTestEmail}
          </a>
        </Button>
      )}
    </form>
  )
}
