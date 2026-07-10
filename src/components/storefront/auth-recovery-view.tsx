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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/stores/user"

type RecoveryMode = "forgot" | "reset" | "verify"
type ViewState = "idle" | "loading" | "sent" | "success"

const emailSchema = z.string().email()

export function AuthRecoveryView({
  mode,
  expired = false,
  token = null,
}: {
  mode: RecoveryMode
  expired?: boolean
  token?: string | null
}) {
  const isEn = useLocale() === "en"
  const profile = useUser((state) => state.profile)
  const emailVerified = useUser((state) => state.emailVerified)
  const setEmailVerified = useUser((state) => state.setEmailVerified)
  const [state, setState] = useState<ViewState>(
    emailVerified && mode === "verify" ? "success" : "idle",
  )
  const [email, setEmail] = useState(profile.email)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [actionToken, setActionToken] = useState(token ?? "")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

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
        ? "Use at least eight characters with a number."
        : "Gunakan minimal delapan karakter dan sertakan angka.",
    },
    verify: {
      icon: MailCheck,
      title: isEn ? "Verify your email" : "Verifikasi Email",
      body: isEn
        ? "Confirm your email before accessing account and purchase history."
        : "Konfirmasi email sebelum mengakses akun dan riwayat pembelian.",
    },
  }[mode]
  const Icon = content.icon

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (!emailSchema.safeParse(email).success) {
      setError(isEn ? "Enter a valid email address." : "Masukkan alamat email yang valid.")
      return
    }
    setState("loading")
    const result = await requestPasswordReset(email)
    if (!result.ok) {
      setState("idle")
      setError(result.message)
      return
    }
    if (result.token) setActionToken(result.token)
    setState("sent")
    toast.success(isEn ? "Reset link sent" : "Tautan reset dikirim")
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (!actionToken) {
      setError(
        isEn
          ? "Open the reset link from your email first."
          : "Buka tautan reset dari email terlebih dahulu.",
      )
      return
    }
    if (password.length < 8 || !/\d/.test(password)) {
      setError(
        isEn
          ? "Use at least 8 characters and one number."
          : "Gunakan minimal 8 karakter dan satu angka.",
      )
      return
    }
    if (password !== confirm) {
      setError(isEn ? "Passwords do not match." : "Konfirmasi kata sandi tidak cocok.")
      return
    }
    setState("loading")
    const result = await resetPassword({ token: actionToken, password })
    if (!result.ok) {
      setState("idle")
      setError(result.message)
      return
    }
    setState("success")
    toast.success(isEn ? "Password updated" : "Kata sandi diperbarui")
  }

  async function verifyEmail() {
    setError("")
    setState("loading")
    if (actionToken) {
      const result = await verifyEmailToken(actionToken)
      if (!result.ok) {
        setState("idle")
        setError(result.message)
        return
      }
      setEmailVerified(true)
      setState("success")
      toast.success(isEn ? "Email verified" : "Email berhasil diverifikasi")
      return
    }

    const result = await requestEmailVerification(email || profile.email)
    if (!result.ok) {
      setState("idle")
      setError(result.message)
      return
    }
    if (result.token) setActionToken(result.token)
    setState("sent")
    toast.success(isEn ? "Verification link sent" : "Tautan verifikasi dikirim")
  }

  async function resend() {
    setError("")
    setState("loading")
    const result =
      mode === "verify" ? await requestEmailVerification(email) : await requestPasswordReset(email)
    if (!result.ok) {
      setState("idle")
      setError(result.message)
      return
    }
    if (result.token) setActionToken(result.token)
    setState("sent")
    toast.success(isEn ? "A new link has been sent" : "Tautan baru telah dikirim")
  }

  const invalidLink = expired && state !== "sent" && state !== "success"

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
          {invalidLink ? (
            <div className="text-center">
              <AlertTriangle className="mx-auto size-12 text-warning" />
              <h2 className="mt-3 font-heading text-lg font-extrabold">
                {isEn ? "This link has expired" : "Tautan Sudah Kedaluwarsa"}
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                {isEn
                  ? "Request a new secure link to continue."
                  : "Minta tautan aman yang baru untuk melanjutkan."}
              </p>
              <Button className="mt-5" onClick={resend}>
                <RefreshCcw className="size-4" /> {isEn ? "Send new link" : "Kirim Tautan Baru"}
              </Button>
            </div>
          ) : state === "success" ? (
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
                <Link href={mode === "verify" ? "/akun" : "/masuk"}>
                  {mode === "verify"
                    ? isEn
                      ? "Open account"
                      : "Buka Akun"
                    : isEn
                      ? "Sign in"
                      : "Masuk"}
                </Link>
              </Button>
            </div>
          ) : mode === "forgot" && state === "sent" ? (
            <div className="text-center">
              <MailCheck className="mx-auto size-14 text-accent-cyan" />
              <h2 className="mt-3 font-heading text-xl font-extrabold">
                {isEn ? "Check your inbox" : "Periksa Kotak Masuk"}
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                {isEn ? `A reset link was sent to ${email}.` : `Tautan reset dikirim ke ${email}.`}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button asChild>
                  <Link
                    href={
                      actionToken
                        ? `/reset-sandi?token=${encodeURIComponent(actionToken)}`
                        : "/reset-sandi"
                    }
                  >
                    {isEn ? "Open reset link" : "Buka Tautan Reset"}
                  </Link>
                </Button>
                <Button variant="neutral" onClick={resend}>
                  <RefreshCcw className="size-4" /> {isEn ? "Resend" : "Kirim Ulang"}
                </Button>
              </div>
            </div>
          ) : mode === "forgot" ? (
            <form onSubmit={submitEmail} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="recovery-email">Email</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
              </div>
              {error && <p className="text-sm font-bold text-danger">{error}</p>}
              <Button type="submit" disabled={state === "loading"}>
                {state === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {isEn ? "Send reset link" : "Kirim Tautan Reset"}
              </Button>
            </form>
          ) : mode === "reset" ? (
            <form onSubmit={submitPassword} className="grid gap-4">
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
              <Button type="submit" disabled={state === "loading"}>
                {state === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {isEn ? "Update password" : "Perbarui Kata Sandi"}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <p className="rounded-base border-2 border-dashed border-border bg-background p-4 font-heading text-sm font-bold">
                {profile.email}
              </p>
              {state === "sent" && (
                <p className="mt-3 text-sm font-bold text-accent-cyan">
                  {isEn ? "Verification link has been sent." : "Tautan verifikasi sudah dikirim."}
                </p>
              )}
              {error && <p className="mt-3 text-sm font-bold text-danger">{error}</p>}
              <Button className="mt-5" onClick={verifyEmail} disabled={state === "loading"}>
                {state === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <MailCheck className="size-4" />
                )}
                {isEn ? "Verify email" : "Verifikasi Email"}
              </Button>
              <Button variant="ghost" className="mt-2 w-full" onClick={resend}>
                {isEn ? "Send a new verification link" : "Kirim tautan verifikasi baru"}
              </Button>
            </div>
          )}
        </div>
      </section>
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
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(toggle && "pr-10")}
        />
        {toggle && (
          <button
            type="button"
            onClick={toggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50"
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  )
}
