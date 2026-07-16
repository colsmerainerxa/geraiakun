"use client"

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { useEffect, useRef } from "react"

const developmentSiteKey = "1x00000000000000000000AA"

export function AuthChallenge({
  action,
  label,
  resetSignal,
  onTokenChange,
}: {
  action: string
  label: string
  resetSignal: number
  onTokenChange: (token: string | null) => void
}) {
  const widget = useRef<TurnstileInstance | null>(null)
  const tokenChange = useRef(onTokenChange)
  const previousResetSignal = useRef(resetSignal)
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
    (process.env.NODE_ENV !== "production" ? developmentSiteKey : "")

  useEffect(() => {
    tokenChange.current = onTokenChange
  }, [onTokenChange])

  useEffect(() => {
    if (previousResetSignal.current === resetSignal) return
    previousResetSignal.current = resetSignal
    tokenChange.current(null)
    widget.current?.reset()
  }, [resetSignal])

  return (
    <div className="grid gap-2" data-auth-challenge={action}>
      <span className="text-xs font-bold text-foreground/70">{label}</span>
      {siteKey ? (
        <Turnstile
          ref={widget}
          siteKey={siteKey}
          options={{ action, size: "flexible", refreshExpired: "manual" }}
          onSuccess={(token) => tokenChange.current(token)}
          onExpire={() => {
            tokenChange.current(null)
            widget.current?.reset()
          }}
          onError={() => {
            tokenChange.current(null)
          }}
        />
      ) : (
        <p role="alert" className="text-xs font-bold text-danger">
          Turnstile is not configured.
        </p>
      )}
    </div>
  )
}
