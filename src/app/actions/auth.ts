"use server"

import { headers } from "next/headers"
import { ZodError } from "zod"
import {
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  consumeStaffInviteToken,
  issueAccountToken,
  issueLoginGrant,
} from "@/lib/server/account-tokens"
import {
  type CredentialLoginInput,
  credentialLoginDecision,
  type LoginOtpResendInput,
  type LoginOtpVerificationInput,
  maskEmail,
  type PasswordResetInput,
  parseCredentialLogin,
  parseLoginOtpResend,
  parseLoginOtpVerification,
  parsePasswordReset,
  parseRecoveryRequest,
  parseRegistration,
  publicRecoveryResult,
  type RecoveryRequestInput,
  type RegistrationInput,
} from "@/lib/server/auth-flows"
import { buildAuthEmail, buildLoginOtpEmail, sendAuthEmail } from "@/lib/server/auth-mail"
import {
  claimAuthRateLimit,
  clearLoginFailures,
  getTrustedClientIp,
} from "@/lib/server/auth-rate-limit"
import { createAccountToken } from "@/lib/server/auth-security"
import { hashTrustedDevice, hashUserAgent } from "@/lib/server/device-security"
import { backendFlags, serverEnv } from "@/lib/server/env"
import {
  consumeLoginOtpChallenge,
  createLoginOtpChallenge,
  resendLoginOtpChallenge,
  verifyLoginOtpChallenge,
} from "@/lib/server/login-otp"
import { hashPassword, verifyPassword } from "@/lib/server/password"
import { prisma } from "@/lib/server/prisma"
import {
  findTrustedDevice,
  getBrowserSecret,
  getOrCreateBrowserSecret,
  trustCurrentBrowser,
} from "@/lib/server/trusted-devices"
import { getTurnstileConfig, verifyTurnstile } from "@/lib/server/turnstile"

type Locale = "id" | "en"

function invalidMessage(locale: Locale) {
  return locale === "en" ? "The submitted data is not valid." : "Data yang dikirim belum valid."
}

function challengeMessage(locale: Locale) {
  return locale === "en"
    ? "Security verification failed. Please try again."
    : "Verifikasi keamanan gagal. Silakan coba lagi."
}

function rateLimited(locale: Locale, retryAfterSeconds: number) {
  return {
    ok: false as const,
    code: "rate-limited" as const,
    retryAfterSeconds,
    message:
      locale === "en"
        ? `Too many attempts. Try again in ${retryAfterSeconds} seconds.`
        : `Terlalu banyak percobaan. Coba lagi dalam ${retryAfterSeconds} detik.`,
  }
}

async function requestContext() {
  const requestHeaders = await headers()
  return {
    ip: getTrustedClientIp(requestHeaders),
    userAgent: requestHeaders.get("user-agent") ?? "Unknown user agent",
  }
}

function loginMessage(locale: Locale, code: string) {
  const messages = {
    id: {
      "invalid-credentials": "Email atau kata sandi tidak sesuai.",
      "email-unverified": "Verifikasi email sebelum masuk.",
      "account-suspended": "Akun ini dinonaktifkan. Hubungi administrator.",
      "mail-unavailable": "Kode login belum dapat dikirim. Coba lagi nanti.",
      "invalid-code": "Kode verifikasi tidak valid.",
      expired: "Kode verifikasi sudah kedaluwarsa.",
      exhausted: "Batas percobaan kode sudah tercapai. Mulai login kembali.",
      "device-mismatch": "Sesi verifikasi tidak cocok dengan perangkat ini.",
      cooldown: "Tunggu sebelum meminta kode baru.",
      "invalid-challenge": "Sesi verifikasi tidak valid. Mulai login kembali.",
    },
    en: {
      "invalid-credentials": "Incorrect email or password.",
      "email-unverified": "Verify your email before signing in.",
      "account-suspended": "This account is disabled. Contact an administrator.",
      "mail-unavailable": "The login code could not be sent. Try again later.",
      "invalid-code": "The verification code is invalid.",
      expired: "The verification code has expired.",
      exhausted: "The code attempt limit was reached. Start signing in again.",
      "device-mismatch": "This verification session does not match this device.",
      cooldown: "Wait before requesting a new code.",
      "invalid-challenge": "The verification session is invalid. Start signing in again.",
    },
  } as const
  return messages[locale][code as keyof (typeof messages)["id"]] ?? invalidMessage(locale)
}

export async function beginCredentialLogin(input: CredentialLoginInput) {
  let data: ReturnType<typeof parseCredentialLogin>
  try {
    data = parseCredentialLogin(input)
  } catch {
    const locale = input && typeof input === "object" && input.locale === "en" ? "en" : "id"
    return {
      ok: false as const,
      code: "invalid-credentials" as const,
      message: loginMessage(locale, "invalid-credentials"),
    }
  }

  if (!backendFlags.databaseConfigured) {
    return {
      ok: false as const,
      code: "invalid-credentials" as const,
      message: loginMessage(data.locale, "invalid-credentials"),
    }
  }

  const { ip, userAgent } = await requestContext()
  const limit = await claimAuthRateLimit({ action: "login", identity: data.email, ip })
  if (!limit.allowed) return rateLimited(data.locale, limit.retryAfterSeconds)

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { adminStaff: { select: { status: true } } },
  })
  const passwordValid = await verifyPassword(data.password, user?.passwordHash)
  const decision = credentialLoginDecision({
    passwordValid: Boolean(user && passwordValid),
    emailVerified: Boolean(user?.emailVerified),
    accountEnabled: user?.role !== "ADMIN" || user.adminStaff?.status === "active",
  })

  if (!user || decision === "invalid") {
    return {
      ok: false as const,
      code: "invalid-credentials" as const,
      message: loginMessage(data.locale, "invalid-credentials"),
    }
  }
  if (decision === "unverified") {
    return {
      ok: false as const,
      code: "email-unverified" as const,
      message: loginMessage(data.locale, "email-unverified"),
    }
  }
  if (decision === "suspended") {
    return {
      ok: false as const,
      code: "account-suspended" as const,
      message: loginMessage(data.locale, "account-suspended"),
    }
  }

  const secret = await getOrCreateBrowserSecret()
  const trusted = await findTrustedDevice(user.id, secret, userAgent)
  if (trusted) {
    const grant = await issueLoginGrant(data.email)
    await clearLoginFailures(data.email)
    return { ok: true as const, state: "grant" as const, grant: grant.rawToken }
  }

  const sendLimit = await claimAuthRateLimit({
    action: "loginOtpSend",
    identity: data.email,
    ip,
  })
  if (!sendLimit.allowed) return rateLimited(data.locale, sendLimit.retryAfterSeconds)

  const deviceHash = hashTrustedDevice(user.id, secret, serverEnv.AUTH_TOKEN_PEPPER)
  const userAgentHash = hashUserAgent(userAgent, serverEnv.AUTH_TOKEN_PEPPER)
  const challenge = await createLoginOtpChallenge({
    userId: user.id,
    deviceHash,
    userAgentHash,
    locale: data.locale,
  })

  try {
    const delivery = await sendAuthEmail({
      to: data.email,
      message: buildLoginOtpEmail({
        locale: data.locale,
        name: user.name,
        code: challenge.code,
      }),
    })
    return {
      ok: true as const,
      state: "otp" as const,
      challengeId: challenge.challengeId,
      maskedEmail: maskEmail(data.email),
      expiresAt: challenge.expiresAt.toISOString(),
      resendAt: challenge.resendAt.toISOString(),
      previewUrl: delivery.previewUrl,
    }
  } catch {
    await consumeLoginOtpChallenge(challenge.challengeId)
    console.error("Login OTP email delivery failed")
    return {
      ok: false as const,
      code: "mail-unavailable" as const,
      message: loginMessage(data.locale, "mail-unavailable"),
    }
  }
}

export async function verifyCredentialLoginOtp(
  input: LoginOtpVerificationInput & { locale?: Locale },
) {
  const locale = input.locale === "en" ? "en" : "id"
  let data: ReturnType<typeof parseLoginOtpVerification>
  try {
    data = parseLoginOtpVerification({ challengeId: input.challengeId, code: input.code })
  } catch {
    return {
      ok: false as const,
      code: "invalid-code" as const,
      message: loginMessage(locale, "invalid-code"),
    }
  }

  const { ip, userAgent } = await requestContext()
  const challenge = await prisma.loginOtpChallenge.findUnique({
    where: { id: data.challengeId },
    include: { user: { include: { adminStaff: { select: { status: true } } } } },
  })
  const identity = challenge?.user.email ?? data.challengeId
  const limit = await claimAuthRateLimit({ action: "loginOtpVerify", identity, ip })
  if (!limit.allowed) return rateLimited(locale, limit.retryAfterSeconds)

  const secret = await getBrowserSecret()
  if (!challenge || !secret) {
    return {
      ok: false as const,
      code: "invalid-code" as const,
      message: loginMessage(locale, "invalid-code"),
    }
  }
  const accountEnabled =
    challenge.user.role !== "ADMIN" || challenge.user.adminStaff?.status === "active"
  if (!challenge.user.emailVerified || !accountEnabled || !challenge.user.email) {
    await consumeLoginOtpChallenge(challenge.id)
    return {
      ok: false as const,
      code: "invalid-code" as const,
      message: loginMessage(locale, "invalid-code"),
    }
  }

  const deviceHash = hashTrustedDevice(challenge.userId, secret, serverEnv.AUTH_TOKEN_PEPPER)
  const userAgentHash = hashUserAgent(userAgent, serverEnv.AUTH_TOKEN_PEPPER)
  const verified = await verifyLoginOtpChallenge({
    challengeId: challenge.id,
    code: data.code,
    deviceHash,
    userAgentHash,
  })
  if (!verified.ok) {
    const code =
      verified.reason === "expired"
        ? "expired"
        : verified.reason === "exhausted"
          ? "exhausted"
          : verified.reason === "mismatch"
            ? "device-mismatch"
            : "invalid-code"
    return { ok: false as const, code, message: loginMessage(locale, code) }
  }

  await trustCurrentBrowser(challenge.userId, secret, userAgent)
  const grant = await issueLoginGrant(challenge.user.email)
  await clearLoginFailures(challenge.user.email)
  return { ok: true as const, grant: grant.rawToken }
}

export async function resendCredentialLoginOtp(input: LoginOtpResendInput & { locale?: Locale }) {
  const locale = input.locale === "en" ? "en" : "id"
  let data: ReturnType<typeof parseLoginOtpResend>
  try {
    data = parseLoginOtpResend({ challengeId: input.challengeId })
  } catch {
    return {
      ok: false as const,
      code: "invalid-challenge" as const,
      message: loginMessage(locale, "invalid-challenge"),
    }
  }

  const { ip, userAgent } = await requestContext()
  const challenge = await prisma.loginOtpChallenge.findUnique({
    where: { id: data.challengeId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!challenge?.user.email) {
    return {
      ok: false as const,
      code: "invalid-challenge" as const,
      message: loginMessage(locale, "invalid-challenge"),
    }
  }

  const limit = await claimAuthRateLimit({
    action: "loginOtpSend",
    identity: challenge.user.email,
    ip,
  })
  if (!limit.allowed) return rateLimited(locale, limit.retryAfterSeconds)

  const secret = await getBrowserSecret()
  if (!secret) {
    return {
      ok: false as const,
      code: "invalid-challenge" as const,
      message: loginMessage(locale, "invalid-challenge"),
    }
  }
  const deviceHash = hashTrustedDevice(challenge.userId, secret, serverEnv.AUTH_TOKEN_PEPPER)
  const userAgentHash = hashUserAgent(userAgent, serverEnv.AUTH_TOKEN_PEPPER)
  const resent = await resendLoginOtpChallenge({
    challengeId: challenge.id,
    deviceHash,
    userAgentHash,
  })
  if (!resent.ok) {
    const code = resent.reason === "cooldown" ? "cooldown" : "invalid-challenge"
    return {
      ok: false as const,
      code,
      message: loginMessage(locale, code),
      ...(resent.reason === "cooldown"
        ? {
            retryAfterSeconds: Math.max(
              1,
              Math.ceil((resent.resendAt.getTime() - Date.now()) / 1_000),
            ),
          }
        : {}),
    }
  }

  try {
    const delivery = await sendAuthEmail({
      to: challenge.user.email,
      message: buildLoginOtpEmail({
        locale: challenge.locale === "en" ? "en" : "id",
        name: challenge.user.name,
        code: resent.code,
      }),
    })
    return {
      ok: true as const,
      expiresAt: resent.expiresAt.toISOString(),
      resendAt: resent.resendAt.toISOString(),
      previewUrl: delivery.previewUrl,
    }
  } catch {
    await consumeLoginOtpChallenge(challenge.id)
    console.error("Login OTP resend delivery failed")
    return {
      ok: false as const,
      code: "mail-unavailable" as const,
      message: loginMessage(locale, "mail-unavailable"),
    }
  }
}

async function validateChallenge(
  token: string,
  action: "register" | "password_reset" | "verification_resend",
  ip: string | null,
) {
  const config = getTurnstileConfig()
  return verifyTurnstile({
    token,
    secretKey: config.secretKey,
    expectedAction: action,
    expectedHostnames: config.expectedHostnames,
    remoteIp: ip,
  })
}

export async function registerCustomer(input: RegistrationInput) {
  let data: ReturnType<typeof parseRegistration>
  try {
    data = parseRegistration(input)
  } catch {
    const locale = input && typeof input === "object" && input.locale === "en" ? "en" : "id"
    return { ok: false as const, code: "invalid-input" as const, message: invalidMessage(locale) }
  }
  if (!backendFlags.databaseConfigured) {
    return {
      ok: false as const,
      code: "unavailable" as const,
      message: invalidMessage(data.locale),
    }
  }

  const { ip } = await requestContext()
  const challenge = await validateChallenge(data.turnstileToken, "register", ip)
  if (!challenge.ok) {
    return {
      ok: false as const,
      code: "challenge-failed" as const,
      message: challengeMessage(data.locale),
    }
  }
  const limit = await claimAuthRateLimit({ action: "register", identity: data.email, ip })
  if (!limit.allowed) return rateLimited(data.locale, limit.retryAfterSeconds)

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  })
  if (existing) {
    return {
      ok: true as const,
      code: "verification-sent" as const,
      message:
        data.locale === "en"
          ? "If the address can be registered, a verification link will be sent."
          : "Jika alamat dapat didaftarkan, tautan verifikasi akan dikirim.",
      previewUrl: null,
    }
  }

  const token = createAccountToken("EMAIL_VERIFY", serverEnv.AUTH_TOKEN_PEPPER)
  const expiresAt = new Date(Date.now() + 60 * 60_000)
  await prisma.$transaction([
    prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: "CUSTOMER",
        profile: { create: { status: "baru" } },
      },
    }),
    prisma.accountToken.create({
      data: {
        email: data.email,
        purpose: "EMAIL_VERIFY",
        tokenHash: token.hash,
        expiresAt,
      },
    }),
  ])

  try {
    const delivery = await sendAuthEmail({
      to: data.email,
      message: buildAuthEmail({
        purpose: "EMAIL_VERIFY",
        locale: data.locale,
        name: data.name,
        rawToken: token.raw,
        appUrl: serverEnv.APP_URL,
      }),
    })
    return {
      ok: true as const,
      code: "verification-sent" as const,
      message:
        data.locale === "en"
          ? "Check your email to verify the account."
          : "Periksa email untuk memverifikasi akun.",
      previewUrl: delivery.previewUrl,
    }
  } catch {
    console.error("Verification email delivery failed")
    return {
      ok: false as const,
      code: "mail-unavailable" as const,
      message:
        data.locale === "en"
          ? "The account was created, but email delivery is temporarily unavailable."
          : "Akun dibuat, tetapi pengiriman email sedang tidak tersedia.",
    }
  }
}

export async function requestPasswordReset(input: RecoveryRequestInput) {
  return requestRecovery(input, "PASSWORD_RESET")
}

export async function requestEmailVerification(input: RecoveryRequestInput) {
  return requestRecovery(input, "EMAIL_VERIFY")
}

async function requestRecovery(
  input: RecoveryRequestInput,
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET",
) {
  let data: ReturnType<typeof parseRecoveryRequest>
  try {
    data = parseRecoveryRequest(input)
  } catch {
    const locale = input && typeof input === "object" && input.locale === "en" ? "en" : "id"
    return { ok: false as const, code: "invalid-input" as const, message: invalidMessage(locale) }
  }
  const { ip } = await requestContext()
  const action = purpose === "EMAIL_VERIFY" ? "verificationResend" : "passwordReset"
  const challenge = await validateChallenge(
    data.turnstileToken,
    purpose === "EMAIL_VERIFY" ? "verification_resend" : "password_reset",
    ip,
  )
  if (!challenge.ok) {
    return {
      ok: false as const,
      code: "challenge-failed" as const,
      message: challengeMessage(data.locale),
    }
  }
  const limit = await claimAuthRateLimit({ action, identity: data.email, ip })
  if (!limit.allowed) return rateLimited(data.locale, limit.retryAfterSeconds)

  const user = backendFlags.databaseConfigured
    ? await prisma.user.findUnique({
        where: { email: data.email },
        select: { name: true, passwordHash: true, emailVerified: true },
      })
    : null
  const eligible =
    user && (purpose === "EMAIL_VERIFY" ? !user.emailVerified : Boolean(user.passwordHash))

  let previewUrl: string | null = null
  if (eligible) {
    try {
      const issued = await issueAccountToken({
        email: data.email,
        purpose,
        expiresInMinutes: purpose === "EMAIL_VERIFY" ? 60 : 30,
      })
      const delivery = await sendAuthEmail({
        to: data.email,
        message: buildAuthEmail({
          purpose,
          locale: data.locale,
          name: user.name,
          rawToken: issued.rawToken,
          appUrl: serverEnv.APP_URL,
        }),
      })
      previewUrl = delivery.previewUrl
    } catch {
      console.error("Account recovery email delivery failed")
    }
  }

  return { ...publicRecoveryResult(data.locale), previewUrl }
}

export async function resetPassword(input: PasswordResetInput & { locale?: Locale }) {
  const locale = input.locale === "en" ? "en" : "id"
  try {
    const data = parsePasswordReset({ token: input.token, password: input.password })
    const passwordHash = await hashPassword(data.password)
    const consumed =
      (await consumePasswordResetToken(data.token, passwordHash)) ||
      (await consumeStaffInviteToken(data.token, passwordHash))
    if (!consumed) {
      return {
        ok: false as const,
        code: "invalid-token" as const,
        message:
          locale === "en"
            ? "The reset link is invalid or expired."
            : "Tautan reset tidak valid atau kedaluwarsa.",
      }
    }
    return {
      ok: true as const,
      code: "password-reset" as const,
      message: locale === "en" ? "Password updated." : "Kata sandi diperbarui.",
    }
  } catch (error) {
    const invalid = error instanceof ZodError
    if (!invalid) console.error("Password reset failed")
    return { ok: false as const, code: "invalid-input" as const, message: invalidMessage(locale) }
  }
}

export async function verifyEmailToken(token: string, locale: Locale = "id") {
  if (typeof token !== "string" || token.length < 12) {
    return { ok: false as const, code: "invalid-token" as const, message: invalidMessage(locale) }
  }
  try {
    const consumed = await consumeEmailVerificationToken(token)
    if (!consumed) {
      return {
        ok: false as const,
        code: "invalid-token" as const,
        message:
          locale === "en"
            ? "The verification link is invalid or expired."
            : "Tautan verifikasi tidak valid atau kedaluwarsa.",
      }
    }
    return {
      ok: true as const,
      code: "email-verified" as const,
      message: locale === "en" ? "Email verified." : "Email berhasil diverifikasi.",
    }
  } catch {
    console.error("Email verification failed")
    return { ok: false as const, code: "unavailable" as const, message: invalidMessage(locale) }
  }
}
