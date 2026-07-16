import { createHmac, randomBytes } from "node:crypto"

export type AccountTokenPurpose = "EMAIL_VERIFY" | "PASSWORD_RESET" | "STAFF_INVITE" | "LOGIN_GRANT"
export type AuthRateAction =
  | "login"
  | "register"
  | "passwordReset"
  | "verificationResend"
  | "loginOtpSend"
  | "loginOtpVerify"

type RateBoundary = {
  limit: number
  windowMs: number
}

type RatePolicy = {
  identity: RateBoundary
  ip?: RateBoundary
}

export const AUTH_RATE_POLICIES: Record<AuthRateAction, RatePolicy> = {
  login: {
    identity: { limit: 5, windowMs: 15 * 60_000 },
    ip: { limit: 30, windowMs: 15 * 60_000 },
  },
  register: {
    identity: { limit: 3, windowMs: 60 * 60_000 },
    ip: { limit: 5, windowMs: 60 * 60_000 },
  },
  passwordReset: {
    identity: { limit: 3, windowMs: 15 * 60_000 },
    ip: { limit: 10, windowMs: 60 * 60_000 },
  },
  verificationResend: {
    identity: { limit: 3, windowMs: 15 * 60_000 },
    ip: { limit: 10, windowMs: 60 * 60_000 },
  },
  loginOtpSend: {
    identity: { limit: 3, windowMs: 15 * 60_000 },
    ip: { limit: 10, windowMs: 60 * 60_000 },
  },
  loginOtpVerify: {
    identity: { limit: 20, windowMs: 15 * 60_000 },
    ip: { limit: 50, windowMs: 60 * 60_000 },
  },
}

function hmac(scope: string, value: string, pepper: string) {
  return createHmac("sha256", pepper).update(`${scope}\0${value}`).digest("hex")
}

export function hashIdentifier(kind: "email" | "ip", value: string, pepper: string) {
  return hmac(`rate-limit:${kind}`, value.trim().toLowerCase(), pepper)
}

export function hashAccountToken(rawToken: string, purpose: AccountTokenPurpose, pepper: string) {
  return hmac(`account-token:${purpose}`, rawToken, pepper)
}

export function createAccountToken(purpose: AccountTokenPurpose, pepper: string) {
  const raw = randomBytes(32).toString("base64url")
  return { raw, hash: hashAccountToken(raw, purpose, pepper) }
}

export function isTokenExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime()
}

export function checkRateWindow(
  timestamps: number[],
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const windowStart = now - windowMs
  const recent = timestamps.filter((timestamp) => timestamp > windowStart).sort((a, b) => a - b)

  if (recent.length < limit) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: limit - recent.length,
    }
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1_000)),
    remaining: 0,
  }
}

export function evaluateAuthRateLimit({
  action,
  identityTimestamps,
  ipTimestamps = [],
  now = Date.now(),
}: {
  action: AuthRateAction
  identityTimestamps: number[]
  ipTimestamps?: number[]
  now?: number
}) {
  const policy = AUTH_RATE_POLICIES[action]
  const identity = checkRateWindow(
    identityTimestamps,
    policy.identity.limit,
    policy.identity.windowMs,
    now,
  )
  const ip = policy.ip
    ? checkRateWindow(ipTimestamps, policy.ip.limit, policy.ip.windowMs, now)
    : { allowed: true, retryAfterSeconds: 0, remaining: Number.POSITIVE_INFINITY }

  return {
    allowed: identity.allowed && ip.allowed,
    retryAfterSeconds: Math.max(identity.retryAfterSeconds, ip.retryAfterSeconds),
    remaining: Math.max(0, Math.min(identity.remaining, ip.remaining)),
  }
}
