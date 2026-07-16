export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA"
export const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA"

type TurnstileEnvironment = Record<string, string | undefined>

export function getTurnstileConfig(
  env: TurnstileEnvironment = process.env,
  nodeEnv = process.env.NODE_ENV,
) {
  const configuredSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  const configuredSecretKey = env.TURNSTILE_SECRET_KEY?.trim()
  const expectedHostnames = (env.TURNSTILE_ALLOWED_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean)

  if (nodeEnv === "production") {
    if (!configuredSiteKey || !configuredSecretKey || expectedHostnames.length === 0) {
      throw new Error(
        "TURNSTILE site key, secret key, and allowed hostnames must be configured in production",
      )
    }
    if (
      configuredSiteKey === TURNSTILE_TEST_SITE_KEY ||
      configuredSecretKey === TURNSTILE_TEST_SECRET_KEY
    ) {
      throw new Error("Turnstile test keys are not allowed in production")
    }
    return { siteKey: configuredSiteKey, secretKey: configuredSecretKey, expectedHostnames }
  }

  if (configuredSiteKey && configuredSecretKey) {
    return { siteKey: configuredSiteKey, secretKey: configuredSecretKey, expectedHostnames }
  }

  return {
    siteKey: TURNSTILE_TEST_SITE_KEY,
    secretKey: TURNSTILE_TEST_SECRET_KEY,
    expectedHostnames: [],
  }
}

type TurnstileVerification =
  | { ok: true }
  | {
      ok: false
      reason:
        | "missing-token"
        | "invalid-token"
        | "siteverify-failed"
        | "action-mismatch"
        | "hostname-mismatch"
        | "timeout"
        | "unavailable"
    }

type VerifyTurnstileInput = {
  token: string
  secretKey: string
  expectedAction: string
  expectedHostnames?: string[]
  remoteIp?: string | null
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export async function verifyTurnstile({
  token,
  secretKey,
  expectedAction,
  expectedHostnames = [],
  remoteIp,
  timeoutMs = 8_000,
  fetchImpl = fetch,
}: VerifyTurnstileInput): Promise<TurnstileVerification> {
  if (!token) return { ok: false, reason: "missing-token" }
  if (token.length > 2_048) return { ok: false, reason: "invalid-token" }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body = new FormData()
    body.set("secret", secretKey)
    body.set("response", token)
    if (remoteIp) body.set("remoteip", remoteIp)

    const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: controller.signal,
    })
    if (!response.ok) return { ok: false, reason: "unavailable" }

    const result = (await response.json()) as {
      success?: boolean
      action?: string
      hostname?: string
      metadata?: { result_with_testing_key?: boolean }
    }
    if (!result.success) return { ok: false, reason: "siteverify-failed" }
    if (
      secretKey === TURNSTILE_TEST_SECRET_KEY &&
      result.metadata?.result_with_testing_key === true
    ) {
      return { ok: true }
    }
    if (result.action !== expectedAction) return { ok: false, reason: "action-mismatch" }
    if (
      expectedHostnames.length > 0 &&
      (!result.hostname || !expectedHostnames.includes(result.hostname.toLowerCase()))
    ) {
      return { ok: false, reason: "hostname-mismatch" }
    }
    return { ok: true }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, reason: "timeout" }
    }
    return { ok: false, reason: "unavailable" }
  } finally {
    clearTimeout(timeout)
  }
}
