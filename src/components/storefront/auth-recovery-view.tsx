"use client"

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  MailCheck,
  RefreshCcw,
  Send,
} from "lucide-react"
import { useLocale } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import {
  requestEmailVerification,
  requestPasswordReset,
  resetPassword,
  verifyEmailToken,
} from "@/app/actions/auth"
import { AuthChallenge } from "@/components/storefront/auth-challenge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

type RecoveryMode = "forgot" | "reset" | "verify"
type ViewState = "idle" | "loading" | "sent" | "success"

export function AuthRecoveryView({
  mode,
  expired = false,
  token = null,
}: {
  mode: RecoveryMode
  expired?: boolean
  token?: string | null
}) {
  const locale = useLocale() === "en" ? "en" : "id"
  const isEn = locale === "en"
  const [state, setState] = useState<ViewState>("idle")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(
    expired ? (isEn ? "This link has expired." : "Tautan sudah kedaluwarsa.") : "",
  )
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [challengeReset, setChallengeReset] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const content = {
    forgot: {
      icon: Send,
      title: isEn ? "Reset your password" : "Pulihkan Kata Sandi",
      body: isEn
        ? "Enter your email and we will send a secure reset link."
        : "Masukkan email dan kami akan mengirim tautan reset yang aman.",
    },
    reset: {
      icon: LockKeyhole,
      title: isEn ? "Create a new password" : "Buat Kata Sandi Baru",
      body: isEn
        ? "Use at least 12 characters with a letter and number."
        : "Gunakan minimal 12 karakter dengan huruf dan angka.",
    },
    verify: {
      icon: MailCheck,
      title: isEn ? "Verify your email" : "Verifikasi Email",
      body: isEn
        ? "Use the secure email link before signing in."
        : "Gunakan tautan email yang aman sebelum masuk.",
    },
  }[mode]
  const Icon = content.icon

  function resetChallenge() {
    setTurnstileToken(null)
    setChallengeReset((value) => value + 1)
  }

  async function requestLink(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (!z.email().safeParse(email.trim()).success) {
      setError(isEn ? "Enter a valid email address." : "Masukkan alamat email yang valid.")
      return
    }
    if (!turnstileToken) {
      setError(isEn ? "Complete the security verification." : "Selesaikan verifikasi keamanan.")
      return
    }

    setState("loading")
    const input = { email, turnstileToken, locale } as const
    const result =
      mode === "verify" ? await requestEmailVerification(input) : await requestPasswordReset(input)
    resetChallenge()
    if (!result.ok) {
      setState("idle")
      setError(result.message)
      return
    }
    setPreviewUrl(result.previewUrl)
    setState("sent")
    toast.success(result.message)
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (!token) {
      setError(isEn ? "Open the reset link from your email." : "Buka tautan reset dari email.")
      return
    }
    if (password.length < 12 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError(
        isEn
          ? "Use at least 12 characters with a letter and number."
          : "Gunakan minimal 12 karakter dengan huruf dan angka.",
      )
      return
    }
    if (password !== confirm) {
      setError(isEn ? "Passwords do not match." : "Konfirmasi kata sandi tidak cocok.")
      return
    }

    setState("loading")
    const result = await resetPassword({ token, password, locale })
    if (!result.ok) {
      setState("idle")
      setError(result.message)
      return
    }
    setState("success")
    toast.success(result.message)
  }

  async function verifyToken() {
    if (!token) return
    setState("loading")
    setError("")
    const result = await verifyEmailToken(token, locale)
    if (!result.ok) {
      setState("idle")
      setError(result.message)
      return
    }
    setState("success")
    toast.success(result.message)
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <Link
        href="/masuk"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {isEn ? "Back to sign in" : "Kembali ke Masuk"}
      </Link>
      <section className="overflow-hidden rounded-base border-2 border-border bg-secondary-background shadow-shadow-lg">
        <div className="border-b-2 border-border bg-main p-6">
          <span className="flex size-12 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm">
            <Icon className="size-6" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-extrabold">{content.title}</h1>
          <p className="mt-1 text-sm font-semibold text-main-foreground/70">{content.body}</p>
        </div>

        <div className="p-6">
          {state === "success" ? (
            <SuccessState mode={mode} isEn={isEn} />
          ) : state === "sent" ? (
            <div className="text-center">
              <MailCheck className="mx-auto size-14 text-accent-cyan" />
              <h2 className="mt-3 font-heading text-xl font-extrabold">
                {isEn ? "Check your email" : "Periksa Email Kamu"}
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                {isEn
                  ? "If the account is available, a secure link has been sent."
                  : "Jika akun tersedia, tautan aman telah dikirim."}
              </p>
              {previewUrl && (
                <Button asChild className="mt-5">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    {isEn ? "Open test email" : "Buka email pengujian"}
                  </a>
                </Button>
              )}
              <Button
                variant="neutral"
                className="mt-3 w-full"
                onClick={() => {
                  setState("idle")
                  setPreviewUrl(null)
                  resetChallenge()
                }}
              >
                <RefreshCcw className="size-4" /> {isEn ? "Send another link" : "Kirim tautan lain"}
              </Button>
            </div>
          ) : mode === "reset" ? (
            <form onSubmit={submitPassword} className="grid gap-4">
              {expired && <ExpiredNotice isEn={isEn} />}
              <PasswordField
                id="new-password"
                label={isEn ? "New password" : "Kata sandi baru"}
                value={password}
                onChange={setPassword}
                show={showPassword}
                toggle={() => setShowPassword((value) => !value)}
              />
              <PasswordField
                id="confirm-password"
                label={isEn ? "Confirm password" : "Konfirmasi kata sandi"}
                value={confirm}
                onChange={setConfirm}
                show={showPassword}
              />
              {error && <p className="text-sm font-bold text-danger">{error}</p>}
              <Button type="submit" disabled={state === "loading" || expired}>
                {state === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {isEn ? "Update password" : "Perbarui Kata Sandi"}
              </Button>
            </form>
          ) : mode === "verify" && token ? (
            <div className="text-center">
              {expired && <ExpiredNotice isEn={isEn} />}
              {error && <p className="mt-3 text-sm font-bold text-danger">{error}</p>}
              <Button
                className="mt-5"
                onClick={verifyToken}
                disabled={state === "loading" || expired}
              >
                {state === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <MailCheck className="size-4" />
                )}
                {isEn ? "Verify email" : "Verifikasi Email"}
              </Button>
            </div>
          ) : (
            <form onSubmit={requestLink} className="grid gap-4">
              {expired && <ExpiredNotice isEn={isEn} />}
              <div className="grid gap-1.5">
                <Label htmlFor="recovery-email">Email</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
              </div>
              <AuthChallenge
                action={mode === "verify" ? "verification_resend" : "password_reset"}
                label={isEn ? "Security verification" : "Verifikasi keamanan"}
                resetSignal={challengeReset}
                onTokenChange={setTurnstileToken}
              />
              {error && <p className="text-sm font-bold text-danger">{error}</p>}
              <Button type="submit" disabled={state === "loading"}>
                {state === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {mode === "verify"
                  ? isEn
                    ? "Send verification link"
                    : "Kirim Tautan Verifikasi"
                  : isEn
                    ? "Send reset link"
                    : "Kirim Tautan Reset"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

function ExpiredNotice({ isEn }: { isEn: boolean }) {
  return (
    <div className="rounded-base border-2 border-warning bg-warning/10 p-3 text-sm font-bold">
      <AlertTriangle className="mr-2 inline size-4" />
      {isEn
        ? "This link has expired. Request a new one."
        : "Tautan sudah kedaluwarsa. Minta tautan baru."}
    </div>
  )
}

function SuccessState({ mode, isEn }: { mode: RecoveryMode; isEn: boolean }) {
  return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto size-14 text-success" />
      <h2 className="mt-3 font-heading text-xl font-extrabold">
        {mode === "verify"
          ? isEn
            ? "Email verified"
            : "Email Terverifikasi"
          : isEn
            ? "Password updated"
            : "Kata Sandi Diperbarui"}
      </h2>
      <p className="mt-1 text-sm text-foreground/60">
        {isEn ? "Your account is ready to use." : "Akun Anda siap digunakan."}
      </p>
      <Button asChild className="mt-5">
        <Link href="/masuk">{isEn ? "Sign in" : "Masuk"}</Link>
      </Button>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  toggle,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  toggle?: () => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(toggle && "pr-10")}
        />
        {toggle && (
          <button
            type="button"
            onClick={toggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  )
}
