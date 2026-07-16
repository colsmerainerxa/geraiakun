"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Bell, History, LogOut, Mail, Phone, Save, Shield, User as UserIcon } from "lucide-react"
import { signOut } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"
import { TrustedDevicesSettings } from "@/components/storefront/trusted-devices-settings"
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
import { Link } from "@/i18n/navigation"
import { type AccountProfile, qk, useAccountProfile } from "@/lib/api/queries"
import { initials } from "@/lib/utils"

const PREF_FIELDS: {
  key: keyof AccountProfile["notifications"]
  labelKey: string
  descKey: string
  icon: typeof Bell
}[] = [
  { key: "orderUpdates", labelKey: "prefOrders", descKey: "prefOrdersDesc", icon: History },
  { key: "promos", labelKey: "prefPromos", descKey: "prefPromosDesc", icon: Bell },
  { key: "ticketReplies", labelKey: "prefTickets", descKey: "prefTicketsDesc", icon: Shield },
  { key: "newsletter", labelKey: "prefNewsletter", descKey: "prefNewsletterDesc", icon: Mail },
]

export function AccountSettingsView() {
  const t = useTranslations("account")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { data: profile } = useAccountProfile()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savingPreference, setSavingPreference] = useState<
    keyof AccountProfile["notifications"] | null
  >(null)

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "")
    const whatsapp = String(form.get("whatsapp") ?? "")
    if (name.trim().length < 2) {
      toast.error(
        locale === "en" ? "Name must contain at least 2 characters" : "Nama minimal 2 karakter",
      )
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          whatsapp: whatsapp.trim() === "" ? null : whatsapp,
        }),
      })
      if (!response.ok) throw new Error("Profile update failed")
      const updated = (await response.json()) as AccountProfile
      queryClient.setQueryData(qk.accountProfile, updated)
      toast.success(t("profileSaved"))
    } catch {
      toast.error(locale === "en" ? "Profile could not be saved" : "Profil gagal disimpan")
    } finally {
      setIsSaving(false)
    }
  }

  async function updatePreference(key: keyof AccountProfile["notifications"], value: boolean) {
    if (!profile) return
    const previous = profile
    const optimistic = { ...profile, notifications: { ...profile.notifications, [key]: value } }
    queryClient.setQueryData(qk.accountProfile, optimistic)
    setSavingPreference(key)
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: { [key]: value } }),
      })
      if (!response.ok) throw new Error("Preference update failed")
      queryClient.setQueryData(qk.accountProfile, (await response.json()) as AccountProfile)
    } catch {
      queryClient.setQueryData(qk.accountProfile, previous)
      toast.error(locale === "en" ? "Preference could not be saved" : "Preferensi gagal disimpan")
    } finally {
      setSavingPreference(null)
    }
  }

  async function logout() {
    queryClient.removeQueries({ queryKey: qk.accountProfile })
    await signOut({ redirectTo: `/${locale}` })
  }

  const displayName = profile?.name?.trim() || profile?.email?.split("@")[0] || "Pelanggan"
  const preferences = profile?.notifications ?? {
    orderUpdates: true,
    promos: true,
    ticketReplies: true,
    newsletter: false,
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-6">
        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="font-heading text-lg font-bold">{t("editProfile")}</h2>
          <div className="mt-4 flex items-center gap-4">
            <Avatar className="size-16">
              {profile?.image && <AvatarImage src={profile.image} alt={displayName} />}
              <AvatarFallback>{initials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-bold">{displayName}</p>
              <p className="flex flex-wrap items-center gap-2 text-foreground/60">
                {profile?.email ?? ""}
                {profile?.emailVerified && (
                  <span className="rounded-base border-2 border-border bg-accent-lime px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                    Verified
                  </span>
                )}
              </p>
            </div>
          </div>

          <form
            key={profile ? `${profile.name}:${profile.whatsapp}` : "loading"}
            onSubmit={onSaveProfile}
            className="mt-5 grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name" label={t("nameLabel")} icon={UserIcon}>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  className="pl-9"
                  defaultValue={profile?.name ?? ""}
                  disabled={!profile}
                />
              </Field>
              <Field id="email" label={t("emailLabel")} icon={Mail}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  disabled
                  value={profile?.email ?? ""}
                />
              </Field>
            </div>
            <Field id="whatsapp" label={t("whatsappLabel")} icon={Phone}>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                className="pl-9"
                defaultValue={profile?.whatsapp ?? ""}
                disabled={!profile}
              />
            </Field>
            <Button type="submit" disabled={isSaving || !profile} className="w-fit">
              <Save className="size-4" /> {t("saveProfile")}
            </Button>
          </form>
        </section>

        <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
          <h2 className="font-heading text-lg font-bold">{t("notifications")}</h2>
          <p className="mt-1 text-sm text-foreground/60">{t("notificationsDesc")}</p>
          <div className="mt-4 flex flex-col divide-y-2 divide-dashed divide-border">
            {PREF_FIELDS.map((field) => (
              <div
                key={field.key}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-base border-2 border-border bg-background shadow-shadow-sm">
                    <field.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold">{t(field.labelKey)}</p>
                    <p className="text-xs text-foreground/60">{t(field.descKey)}</p>
                  </div>
                </div>
                <Switch
                  className="relative z-10 shrink-0"
                  checked={preferences[field.key]}
                  disabled={!profile || savingPreference !== null}
                  onCheckedChange={(value) => updatePreference(field.key, value)}
                  aria-label={t(field.labelKey)}
                />
              </div>
            ))}
          </div>
        </section>

        <TrustedDevicesSettings />
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-base border-2 border-danger bg-danger/5 p-6">
          <h2 className="font-heading text-lg font-bold text-danger">{t("dangerZone")}</h2>
          <p className="mt-1 text-sm text-foreground/60">{t("logoutDesc")}</p>
          <Button variant="danger" onClick={() => setLogoutOpen(true)} className="mt-4 w-full">
            <LogOut className="size-4" /> {t("logout")}
          </Button>
          <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("logoutConfirmTitle")}</DialogTitle>
                <DialogDescription>{t("logoutConfirmDesc")}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="neutral" onClick={() => setLogoutOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button variant="danger" onClick={logout}>
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
