"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Bell,
  CreditCard,
  Eye,
  EyeOff,
  History,
  LogOut,
  Mail,
  MapPin,
  MonitorSmartphone,
  Phone,
  Plus,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Link, useRouter } from "@/i18n/navigation"
import { cn, formatDate, initials } from "@/lib/utils"
import type { ActivityEntry, NotificationPrefs } from "@/stores/user"
import { useUser } from "@/stores/user"

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  whatsapp: z
    .string()
    .min(9, "Nomor tidak valid")
    .regex(/^[0-9+\-\s]+$/, "Nomor tidak valid"),
})

const passwordSchema = z
  .object({
    current: z.string().min(1, "Masukkan kata sandi saat ini"),
    next: z.string().min(6, "Minimal 6 karakter"),
    confirm: z.string().min(1, "Konfirmasi kata sandi baru"),
  })
  .refine((d) => d.next === d.confirm, {
    message: "Konfirmasi tidak cocok",
    path: ["confirm"],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

const PREF_FIELDS: {
  key: keyof NotificationPrefs
  labelKey: string
  descKey: string
  icon: typeof Bell
}[] = [
  {
    key: "orderUpdates",
    labelKey: "prefOrders",
    descKey: "prefOrdersDesc",
    icon: History,
  },
  {
    key: "promos",
    labelKey: "prefPromos",
    descKey: "prefPromosDesc",
    icon: Bell,
  },
  {
    key: "ticketReplies",
    labelKey: "prefTickets",
    descKey: "prefTicketsDesc",
    icon: Shield,
  },
  {
    key: "newsletter",
    labelKey: "prefNewsletter",
    descKey: "prefNewsletterDesc",
    icon: Mail,
  },
]

const ACTIVITY_ICON: Record<ActivityEntry["kind"], typeof Bell> = {
  login: LogOut,
  order: History,
  ticket: Shield,
  review: UserIcon,
  profile: UserIcon,
}

export function AccountSettingsView() {
  const t = useTranslations("account")
  const isEn = useLocale() === "en"
  const dateLocale = isEn ? "en-US" : "id-ID"
  const router = useRouter()

  const profile = useUser((s) => s.profile)
  const prefs = useUser((s) => s.prefs)
  const activity = useUser((s) => s.activity)
  const sessions = useUser((s) => s.sessions)
  const emailVerified = useUser((s) => s.emailVerified)
  const updateProfile = useUser((s) => s.updateProfile)
  const updatePrefs = useUser((s) => s.updatePrefs)
  const logActivity = useUser((s) => s.logActivity)
  const terminateSession = useUser((s) => s.terminateSession)
  const terminateOtherSessions = useUser((s) => s.terminateOtherSessions)

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [twoFA, setTwoFA] = useState(false)
  const [twoFACode, setTwoFACode] = useState("")
  const [savedMethods, setSavedMethods] = useState<{ id: string; label: string; number: string }[]>(
    [{ id: "pm-1", label: "GoPay", number: "0812****4421" }],
  )
  const [newMethod, setNewMethod] = useState("GoPay")
  const [newNumber, setNewNumber] = useState("")

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    formState: { errors: profileErrors, isSubmitting: profileSaving },
    reset: resetProfile,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      email: profile.email,
      whatsapp: profile.whatsapp,
    },
  })

  const {
    register: regPw,
    handleSubmit: submitPw,
    formState: { errors: pwErrors },
    reset: resetPw,
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  function onSaveProfile(values: ProfileValues) {
    updateProfile({
      name: values.name,
      email: values.email,
      whatsapp: values.whatsapp,
    })
    logActivity({
      kind: "profile",
      message: isEn ? "Profile updated" : "Profil diperbarui",
    })
    toast.success(t("profileSaved"))
    resetProfile(values)
  }

  function onChangePassword(values: PasswordValues) {
    // Demo only — no backend. Acknowledge and clear.
    logActivity({
      kind: "profile",
      message: isEn ? "Password changed" : "Kata sandi diganti",
    })
    toast.success(t("passwordChanged"))
    resetPw()
    void values
  }

  function doLogout() {
    setLogoutOpen(false)
    logActivity({
      kind: "login",
      message: isEn ? "Signed out" : "Keluar dari akun",
    })
    toast.success(isEn ? "Signed out" : "Berhasil keluar")
    router.push("/")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      {/* ---- Left: forms ---- */}
      <div className="flex flex-col gap-6">
        {/* Profile */}
        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="font-heading text-lg font-bold">{t("editProfile")}</h2>
          <div className="mt-4 flex items-center gap-4">
            <Avatar className="size-16">
              {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.name} />}
              <AvatarFallback>{initials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-bold">{profile.name}</p>
              <p className="flex flex-wrap items-center gap-2 text-foreground/60">
                {profile.email}
                {emailVerified && (
                  <span className="rounded-base border-2 border-border bg-accent-lime px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                    Verified
                  </span>
                )}
              </p>
              <p className="text-xs text-foreground/60">
                {isEn ? "Member since" : "Bergabung sejak"}{" "}
                {formatDate(profile.joinedAt, dateLocale)}
              </p>
            </div>
          </div>

          <form onSubmit={submitProfile(onSaveProfile)} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="name"
                label={t("nameLabel")}
                icon={UserIcon}
                error={profileErrors.name?.message}
              >
                <Input
                  id="name"
                  className="pl-9"
                  aria-invalid={!!profileErrors.name}
                  {...regProfile("name")}
                />
              </Field>
              <Field
                id="email"
                label={t("emailLabel")}
                icon={Mail}
                error={profileErrors.email?.message}
              >
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  aria-invalid={!!profileErrors.email}
                  {...regProfile("email")}
                />
              </Field>
            </div>
            <Field
              id="whatsapp"
              label={t("whatsappLabel")}
              icon={Phone}
              error={profileErrors.whatsapp?.message}
            >
              <Input
                id="whatsapp"
                inputMode="tel"
                className="pl-9"
                aria-invalid={!!profileErrors.whatsapp}
                {...regProfile("whatsapp")}
              />
            </Field>
            <div>
              <Button type="submit" disabled={profileSaving}>
                <Save className="size-4" /> {t("saveProfile")}
              </Button>
            </div>
          </form>
        </section>

        {/* Change password */}
        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="font-heading text-lg font-bold">{t("changePassword")}</h2>
          <p className="mt-1 text-sm text-foreground/60">{t("changePasswordDesc")}</p>
          <form onSubmit={submitPw(onChangePassword)} className="mt-4 grid gap-4">
            <Field id="pw-current" label={t("currentPassword")} error={pwErrors.current?.message}>
              <Input
                id="pw-current"
                type={showPw ? "text" : "password"}
                className="pr-9"
                {...regPw("current")}
              />
              <TogglePw show={showPw} setShow={setShowPw} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="pw-next" label={t("newPassword")} error={pwErrors.next?.message}>
                <Input
                  id="pw-next"
                  type={showPw ? "text" : "password"}
                  className="pr-9"
                  {...regPw("next")}
                />
                <TogglePw show={showPw} setShow={setShowPw} />
              </Field>
              <Field id="pw-confirm" label={t("confirmPassword")} error={pwErrors.confirm?.message}>
                <Input
                  id="pw-confirm"
                  type={showPw ? "text" : "password"}
                  className="pr-9"
                  {...regPw("confirm")}
                />
                <TogglePw show={showPw} setShow={setShowPw} />
              </Field>
            </div>
            <div>
              <Button type="submit" variant="neutral">
                <Shield className="size-4" /> {t("updatePassword")}
              </Button>
            </div>
          </form>
        </section>

        {/* Notification preferences */}
        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="font-heading text-lg font-bold">{t("notifications")}</h2>
          <p className="mt-1 text-sm text-foreground/60">{t("notificationsDesc")}</p>
          <div className="mt-4 flex flex-col divide-y-2 divide-dashed divide-border">
            {PREF_FIELDS.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-background shadow-shadow-sm">
                    <f.icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-heading text-sm font-bold">{t(f.labelKey)}</p>
                    <p className="text-xs text-foreground/60">{t(f.descKey)}</p>
                  </div>
                </div>
                <Switch
                  checked={prefs[f.key]}
                  onCheckedChange={(v) => updatePrefs({ [f.key]: v })}
                  aria-label={t(f.labelKey)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 2FA enrollment (UI mock) */}
        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-background shadow-shadow-sm">
                <Shield className="size-4" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold">{t("twoFactorTitle")}</h2>
                <p className="mt-1 text-sm text-foreground/60">{t("twoFactorDesc")}</p>
              </div>
            </div>
            <Switch
              checked={twoFA}
              onCheckedChange={(v) => {
                setTwoFA(v)
                toast.success(v ? t("twoFactorOn") : t("twoFactorOff"))
              }}
              aria-label={t("twoFactorTitle")}
            />
          </div>
          {twoFA && (
            <div className="mt-4 rounded-base border-2 border-dashed border-border bg-background p-4">
              <p className="text-xs font-bold text-foreground/70">{t("twoFactorVerify")}</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="123456"
                  className="font-mono sm:max-w-[160px]"
                />
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => {
                    if (twoFACode.length !== 6) {
                      toast.error(t("twoFactorCodeRequired"))
                      return
                    }
                    toast.success(t("twoFactorVerified"))
                    setTwoFACode("")
                  }}
                >
                  <ShieldCheck className="size-4" /> {t("twoFactorConfirm")}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-foreground/60">{t("twoFactorHint")}</p>
            </div>
          )}
        </section>

        {/* Saved payment methods (UI mock) */}
        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-background shadow-shadow-sm">
              <CreditCard className="size-4" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold">{t("paymentsTitle")}</h2>
              <p className="mt-1 text-sm text-foreground/60">{t("paymentsDesc")}</p>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {savedMethods.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-base border-2 border-border bg-background p-3"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="size-4 text-foreground/60" />
                  <div>
                    <p className="font-heading text-sm font-bold">{m.label}</p>
                    <p className="font-mono text-xs text-foreground/60">{m.number}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("paymentsRemove")}
                  onClick={() => setSavedMethods((prev) => prev.filter((x) => x.id !== m.id))}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </li>
            ))}
            {savedMethods.length === 0 && (
              <li className="rounded-base border-2 border-dashed border-border p-4 text-center text-sm text-foreground/60">
                {t("paymentsEmpty")}
              </li>
            )}
          </ul>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              className="h-10 rounded-base border-2 border-border bg-background px-3 text-sm font-bold"
              aria-label={t("paymentsMethodLabel")}
            >
              {["GoPay", "OVO", "DANA", "BCA", "Mandiri"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Input
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder={t("paymentsNumberPlaceholder")}
              className="flex-1"
            />
            <Button
              variant="neutral"
              size="sm"
              onClick={() => {
                const num = newNumber.trim()
                if (!num) {
                  toast.error(t("paymentsNumberRequired"))
                  return
                }
                const masked = num.length > 4 ? `${num.slice(0, 4)}****${num.slice(-4)}` : num
                setSavedMethods((prev) => [
                  ...prev,
                  { id: `pm-${Date.now()}`, label: newMethod, number: masked },
                ])
                setNewNumber("")
                toast.success(t("paymentsAdded"))
              }}
            >
              <Plus className="size-4" /> {t("paymentsAdd")}
            </Button>
          </div>
        </section>
      </div>

      {/* ---- Right: activity + danger zone ---- */}
      <div className="flex flex-col gap-6">
        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="font-heading text-lg font-bold">{t("activityLog")}</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {activity.slice(0, 8).map((a) => {
              const Icon = ACTIVITY_ICON[a.kind]
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-background shadow-shadow-sm">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{a.message}</p>
                    <p className="text-xs text-foreground/60">{formatDate(a.date, dateLocale)}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold">
                {isEn ? "Devices and sessions" : "Perangkat dan Sesi"}
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                {isEn
                  ? "Review where your geraiakun account is currently signed in."
                  : "Periksa perangkat yang sedang menggunakan akun geraiakun Anda."}
              </p>
            </div>
            {sessions.some((session) => !session.current) && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  terminateOtherSessions()
                  toast.success(
                    isEn ? "Other sessions signed out" : "Sesi lain berhasil dikeluarkan",
                  )
                }}
              >
                <LogOut className="size-4" /> {isEn ? "Sign out others" : "Keluar Semua"}
              </Button>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-base border-2 border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-accent-cyan shadow-shadow-sm">
                      <MonitorSmartphone className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-bold">
                        {session.device} - {session.browser}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-foreground/60">
                        <MapPin className="size-3" /> {session.location} - {session.ipAddress}
                      </p>
                      <p className="mt-1 text-xs text-foreground/60">
                        {isEn ? "Last active" : "Aktif terakhir"}{" "}
                        {formatDate(session.lastActiveAt, dateLocale)}
                      </p>
                    </div>
                  </div>
                  {session.current ? (
                    <span className="rounded-base border-2 border-border bg-accent-lime px-2 py-1 text-xs font-bold">
                      {isEn ? "Current" : "Saat ini"}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="neutral"
                      onClick={() => {
                        terminateSession(session.id)
                        toast.success(isEn ? "Session signed out" : "Sesi berhasil dikeluarkan")
                      }}
                    >
                      {isEn ? "Sign out" : "Keluarkan"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-base border-2 border-danger bg-danger/5 p-6">
          <h2 className="font-heading text-lg font-bold text-danger">{t("dangerZone")}</h2>
          <p className="mt-1 text-sm text-foreground/60">{t("logoutDesc")}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="danger" onClick={() => setLogoutOpen(true)} className="w-full">
              <LogOut className="size-4" /> {t("logout")}
            </Button>
          </div>
          <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LogOut className="size-5 text-danger" /> {t("logoutConfirmTitle")}
                </DialogTitle>
                <DialogDescription>{t("logoutConfirmDesc")}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="neutral" onClick={() => setLogoutOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button variant="danger" onClick={doLogout}>
                  {t("logout")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <div className="rounded-base border-2 border-dashed border-border bg-secondary-background p-5 text-sm">
          <p className="font-heading font-bold">{t("supportTitle")}</p>
          <p className="mt-1 text-foreground/60">{t("supportDesc")}</p>
          <Button asChild variant="neutral" size="sm" className="mt-3 w-full">
            <Link href="/bantuan">{t("goHelp")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string
  label: string
  icon?: typeof Bell
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/60" />
        )}
        {children}
      </div>
      {error && <span className="text-xs font-bold text-danger">{error}</span>}
    </div>
  )
}

function TogglePw({ show, setShow }: { show: boolean; setShow: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => setShow(!show)}
      className={cn(
        "absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground",
      )}
      aria-label={show ? "Sembunyikan" : "Tampilkan"}
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
}
