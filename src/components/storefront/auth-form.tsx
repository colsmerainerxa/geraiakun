"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useRouter } from "@/i18n/navigation"
import { z } from "zod"

type Mode = "login" | "register"

const loginSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  confirmPassword: z.string().optional(),
})

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Kata sandi tidak cocok",
    path: ["confirmPassword"],
  })

type FormValues = {
  name?: string
  email: string
  password: string
  confirmPassword?: string
}

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const isRegister = mode === "register"
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  })

  function onSubmit() {
    toast.success(isRegister ? t("registerButton") : t("loginButton"), {
      description: t("demoNote"),
    })
    router.push("/akun")
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
            beli<span className="text-accent-pink">akun</span>
          </span>
        </Link>

        <h1 className="mt-6 text-center font-heading text-2xl font-extrabold">
          {isRegister ? t("registerTitle") : t("loginTitle")}
        </h1>
        <p className="mt-1 text-center text-sm text-foreground/60">
          {isRegister ? t("registerSubtitle") : t("loginSubtitle")}
        </p>

        {/* Demo banner */}
        <div className="mt-5 rounded-base border-2 border-dashed border-border bg-warning/20 px-3 py-2 text-center text-xs font-bold text-foreground/70">
          {t("demoNote")}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 flex flex-col gap-4"
        >
          {isRegister && (
            <div className="grid gap-1.5">
              <Label htmlFor="name">{t("name")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
                <Input
                  id="name"
                  className="pl-9"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <span className="text-xs font-bold text-danger">
                  {errors.name.message}
                </span>
              )}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
              <Input
                id="email"
                type="email"
                className="pl-9"
                placeholder="email@kamu.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <span className="text-xs font-bold text-danger">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                className="px-9"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                aria-label={showPw ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPw ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs font-bold text-danger">
                {errors.password.message}
              </span>
            )}
          </div>

          {isRegister && (
            <div className="grid gap-1.5">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-9"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-xs font-bold text-danger">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
          )}

          {!isRegister && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 font-bold">
                <input type="checkbox" className="size-4 accent-main" />
                {t("rememberMe")}
              </label>
              <span className="font-bold text-foreground/50">
                {t("forgotPassword")}
              </span>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isRegister ? t("registerButton") : t("loginButton")}
          </Button>
        </form>

        {/* Social (decorative) */}
        <div className="mt-5 flex items-center gap-3">
          <span className="h-0.5 flex-1 bg-border" />
          <span className="text-xs font-bold text-foreground/40">
            {t("orContinue")}
          </span>
          <span className="h-0.5 flex-1 bg-border" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="neutral" type="button">
            Google
          </Button>
          <Button variant="neutral" type="button">
            Apple
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-foreground/60">
          {isRegister ? t("hasAccount") : t("noAccount")}{" "}
          <Link
            href={isRegister ? "/masuk" : "/daftar"}
            className="font-bold text-accent-pink underline-offset-2 hover:underline"
          >
            {isRegister ? t("loginLink") : t("registerLink")}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
