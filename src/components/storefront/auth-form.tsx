"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react"
import { motion } from "motion/react"
import { signIn } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import {
  beginCredentialLogin,
  registerCustomer,
  resendCredentialLoginOtp,
  verifyCredentialLoginOtp,
} from "@/app/actions/auth"
import { AuthChallenge } from "@/components/storefront/auth-challenge"
import { LoginOtpForm } from "@/components/storefront/login-otp-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useRouter } from "@/i18n/navigation"

type Mode = "login" | "register"

function createLoginSchema(isEn: boolean) {
  return z.object({
    name: z.string().optional(),
    email: z.string().email(isEn ? "Enter a valid email" : "Email tidak valid"),
    password: z
      .string()
      .min(1, isEn ? "Password is required" : "Kata sandi wajib diisi")
      .max(128),
  })
}

function createRegisterSchema(isEn: boolean) {
  return z
    .object({
      name: z
        .string()
        .min(2, isEn ? "Name must contain at least 2 characters" : "Nama minimal 2 karakter"),
      email: z.string().email(isEn ? "Enter a valid email" : "Email tidak valid"),
      password: z
        .string()
        .min(
          12,
          isEn ? "Password must contain at least 12 characters" : "Kata sandi minimal 12 karakter",
        )
        .max(128)
        .regex(
          /[A-Za-z]/,
          isEn ? "Password must contain a letter" : "Kata sandi harus memiliki huruf",
        )
        .regex(
          /[0-9]/,
          isEn ? "Password must contain a number" : "Kata sandi harus memiliki angka",
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: isEn ? "Passwords do not match" : "Kata sandi tidak cocok",
      path: ["confirmPassword"],
    })
}

type FormValues = {
  name?: string
  email: string
  password: string
  confirmPassword?: string
}

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("auth")
  const locale = useLocale()
  const isEn = locale === "en"
  const router = useRouter()
  const isRegister = mode === "register"
  const [showPw, setShowPw] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [challengeReset, setChallengeReset] = useState(0)
  const [verification, setVerification] = useState<{
    message: string
    previewUrl: string | null
  } | null>(null)
  const [otp, setOtp] = useState<{
    challengeId: string
    maskedEmail: string
    expiresAt: string
    resendAt: string
    previewUrl: string | null
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isRegister ? createRegisterSchema(isEn) : createLoginSchema(isEn)),
  })

  async function onSubmit(values: FormValues) {
    if (isRegister) {
      if (!turnstileToken) {
        toast.error(t("securityRequired"))
        return
      }
      const result = await registerCustomer({
        name: values.name ?? "",
        email: values.email,
        password: values.password,
        turnstileToken,
        locale: locale === "en" ? "en" : "id",
      })
      setChallengeReset((value) => value + 1)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setVerification({ message: result.message, previewUrl: result.previewUrl })
      toast.success(result.message)
      return
    }

    const result = await beginCredentialLogin({
      email: values.email,
      password: values.password,
      locale: locale === "en" ? "en" : "id",
    })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    if (result.state === "otp") {
      setOtp(result)
      return
    }

    await completeGrantLogin(result.grant)
  }

  async function completeGrantLogin(grant: string) {
    const result = await signIn("credentials", { grant, redirect: false })
    if (result?.error) {
      toast.error(t("loginInvalid"))
      setOtp(null)
      return
    }

    router.push("/akun")
    router.refresh()
  }

  async function verifyOtp(code: string) {
    if (!otp) return
    const result = await verifyCredentialLoginOtp({
      challengeId: otp.challengeId,
      code,
      locale: locale === "en" ? "en" : "id",
    })
    if (!result.ok) {
      toast.error(result.message)
      if (["expired", "exhausted", "device-mismatch"].includes(result.code)) setOtp(null)
      return
    }
    setOtp(null)
    await completeGrantLogin(result.grant)
  }

  async function resendOtp() {
    if (!otp) return
    const result = await resendCredentialLoginOtp({
      challengeId: otp.challengeId,
      locale: locale === "en" ? "en" : "id",
    })
    if (!result.ok) {
      toast.error(result.message)
      if (result.code === "invalid-challenge") setOtp(null)
      return
    }
    setOtp((current) =>
      current
        ? {
            ...current,
            expiresAt: result.expiresAt,
            resendAt: result.resendAt,
            previewUrl: result.previewUrl,
          }
        : null,
    )
    toast.success(t("otpResent"))
  }

  async function continueWithGoogle() {
    setSocialLoading(true)
    const redirectTo = new URL(`/${locale}/akun`, window.location.origin).toString()
    try {
      await signIn("google", { redirectTo })
    } finally {
      setSocialLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow-lg sm:p-8"
      >
        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <span className="font-heading text-xl font-extrabold tracking-tight">
            gerai<span className="text-accent-pink">akun</span>
          </span>
        </Link>

        <h1 className="mt-6 text-center font-heading text-2xl font-extrabold">
          {isRegister ? t("registerTitle") : t("loginTitle")}
        </h1>
        <p className="mt-1 text-center text-sm text-foreground/60">
          {isRegister ? t("registerSubtitle") : t("loginSubtitle")}
        </p>

        {verification && (
          <div className="mt-5 rounded-base border-2 border-border bg-accent-lime/15 p-4 text-center">
            <p className="font-heading font-bold">{t("verificationSentTitle")}</p>
            <p className="mt-1 text-sm text-foreground/70">{verification.message}</p>
            {verification.previewUrl && (
              <Button asChild className="mt-4 w-full">
                <a href={verification.previewUrl} target="_blank" rel="noopener noreferrer">
                  {t("openTestEmail")}
                </a>
              </Button>
            )}
            <Button asChild variant="neutral" className="mt-3 w-full">
              <Link href="/masuk">{t("loginLink")}</Link>
            </Button>
          </div>
        )}

        {otp && (
          <LoginOtpForm
            maskedEmail={otp.maskedEmail}
            expiresAt={otp.expiresAt}
            resendAt={otp.resendAt}
            previewUrl={otp.previewUrl}
            labels={{
              title: t("otpTitle"),
              description: t("otpDescription"),
              code: t("otpCode"),
              expires: t("otpExpires"),
              verify: t("otpVerify"),
              resend: t("otpResend"),
              resendIn: t("otpResendIn"),
              back: t("otpBack"),
              openTestEmail: t("openTestEmail"),
            }}
            onVerify={verifyOtp}
            onResend={resendOtp}
            onCancel={() => setOtp(null)}
          />
        )}

        {!verification && !otp && (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
            {isRegister && (
              <div className="grid gap-1.5">
                <Label htmlFor="name">{t("name")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
                  <Input
                    id="name"
                    autoComplete="name"
                    className="pl-9"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "auth-name-error" : undefined}
                    {...register("name")}
                  />
                </div>
                {errors.name && (
                  <span id="auth-name-error" className="text-xs font-bold text-danger">
                    {errors.name.message}
                  </span>
                )}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  placeholder="email@kamu.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "auth-email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <span id="auth-email-error" className="text-xs font-bold text-danger">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={isRegister ? 12 : undefined}
                  maxLength={128}
                  className="px-9"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "auth-password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground"
                  aria-label={showPw ? t("hidePassword") : t("showPassword")}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <span id="auth-password-error" className="text-xs font-bold text-danger">
                  {errors.password.message}
                </span>
              )}
            </div>

            {isRegister && (
              <div className="grid gap-1.5">
                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="pl-9"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "auth-confirm-error" : undefined}
                    {...register("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <span id="auth-confirm-error" className="text-xs font-bold text-danger">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>
            )}

            {!isRegister && (
              <div className="flex justify-end text-sm">
                <Link href="/lupa-sandi" className="font-bold text-accent-pink hover:underline">
                  {t("forgotPassword")}
                </Link>
              </div>
            )}

            {isRegister && (
              <AuthChallenge
                action="register"
                label={t("securityCheck")}
                resetSignal={challengeReset}
                onTokenChange={setTurnstileToken}
              />
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isRegister ? t("registerButton") : t("loginButton")}
            </Button>
          </form>
        )}

        {/* Social (decorative) */}
        {!otp && (
          <div className="mt-5 flex items-center gap-3">
            <span className="h-0.5 flex-1 bg-border" />
            <span className="text-xs font-bold text-foreground/60">{t("orContinue")}</span>
            <span className="h-0.5 flex-1 bg-border" />
          </div>
        )}
        {!otp && (
          <div className="mt-4">
            <Button
              variant="neutral"
              type="button"
              className="w-full"
              disabled={socialLoading}
              onClick={continueWithGoogle}
            >
              {socialLoading ? "Menghubungkan Google..." : "Google"}
            </Button>
          </div>
        )}

        {!otp && (
          <p className="mt-6 text-center text-sm text-foreground/60">
            {isRegister ? t("hasAccount") : t("noAccount")}{" "}
            <Link
              href={isRegister ? "/masuk" : "/daftar"}
              className="font-bold text-accent-pink underline-offset-2 hover:underline"
            >
              {isRegister ? t("loginLink") : t("registerLink")}
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  )
}
