"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Loader2, MonitorSmartphone, ShieldCheck, Trash2 } from "lucide-react"
import { signOut } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { qk, type TrustedDeviceView, useTrustedDevices } from "@/lib/api/queries"

type RevokeTarget = { mode: "one"; device: TrustedDeviceView } | { mode: "all" }

export function TrustedDevicesSettings() {
  const t = useTranslations("account")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { data: devices = [], isLoading } = useTrustedDevices()
  const [target, setTarget] = useState<RevokeTarget | null>(null)
  const [revoking, setRevoking] = useState(false)

  async function revoke() {
    if (!target) return
    setRevoking(true)
    try {
      const response = await fetch("/api/account/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          target.mode === "all" ? { mode: "all" } : { mode: "one", deviceId: target.device.id },
        ),
      })
      if (!response.ok) throw new Error("Device revocation failed")
      const result = (await response.json()) as { signOut: boolean }
      setTarget(null)
      queryClient.removeQueries({ queryKey: qk.trustedDevices })
      toast.success(t("trustedDevicesRevoked"))
      if (result.signOut) {
        queryClient.clear()
        await signOut({ redirectTo: `/${locale}/masuk` })
        return
      }
      await queryClient.invalidateQueries({ queryKey: qk.trustedDevices })
    } catch {
      toast.error(t("trustedDevicesRevokeFailed"))
    } finally {
      setRevoking(false)
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  }

  return (
    <section className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">{t("trustedDevicesTitle")}</h2>
          <p className="mt-1 text-sm text-foreground/60">{t("trustedDevicesDesc")}</p>
        </div>
        {devices.some((device) => device.status === "active") && (
          <Button variant="danger" size="sm" onClick={() => setTarget({ mode: "all" })}>
            <Trash2 className="size-4" aria-hidden="true" />
            {t("trustedDevicesRevokeAll")}
          </Button>
        )}
      </div>

      <div className="mt-5 divide-y-2 divide-dashed divide-border border-y-2 border-dashed border-border">
        {isLoading && (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="size-5 animate-spin" aria-label={t("trustedDevicesLoading")} />
          </div>
        )}
        {!isLoading && devices.length === 0 && (
          <p className="py-5 text-sm text-foreground/60">{t("trustedDevicesEmpty")}</p>
        )}
        {devices.map((device) => (
          <div key={device.id} className="flex items-center gap-3 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-base border-2 border-border bg-background">
              <MonitorSmartphone className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-heading text-sm font-bold">{device.label}</p>
                {device.current && (
                  <span className="inline-flex items-center gap-1 rounded-base border-2 border-border bg-accent-lime px-1.5 py-0.5 text-[10px] font-bold">
                    <ShieldCheck className="size-3" aria-hidden="true" />
                    {t("trustedDevicesCurrent")}
                  </span>
                )}
                {device.status !== "active" && (
                  <span className="text-xs font-bold text-foreground/50">
                    {t(
                      device.status === "revoked"
                        ? "trustedDevicesRevoked"
                        : "trustedDevicesExpired",
                    )}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-foreground/60">
                {t("trustedDevicesLastUsed")} {formatDate(device.lastUsedAt)}
              </p>
            </div>
            {device.status === "active" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="neutral"
                      size="icon"
                      aria-label={t("trustedDevicesRevokeOne")}
                      onClick={() => setTarget({ mode: "one", device })}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("trustedDevicesRevokeOne")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ))}
      </div>

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.mode === "all"
                ? t("trustedDevicesConfirmAllTitle")
                : t("trustedDevicesConfirmOneTitle")}
            </DialogTitle>
            <DialogDescription>
              {target?.mode === "all"
                ? t("trustedDevicesConfirmAllDesc")
                : t("trustedDevicesConfirmOneDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setTarget(null)} disabled={revoking}>
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={revoke} disabled={revoking}>
              {revoking && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {t("trustedDevicesConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
