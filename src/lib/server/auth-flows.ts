import { z } from "zod"

export const authPasswordSchema = z
  .string()
  .min(12, "Password must contain at least 12 characters")
  .max(128, "Password must contain at most 128 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number")

const localeSchema = z.enum(["id", "en"])
const emailSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email())
const challengeSchema = z.string().min(1, "Security challenge is required").max(2_048)

const registrationSchema = z.strictObject({
  name: z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(2).max(80)),
  email: emailSchema,
  password: authPasswordSchema,
  turnstileToken: challengeSchema,
  locale: localeSchema,
})

const recoveryRequestSchema = z.strictObject({
  email: emailSchema,
  turnstileToken: challengeSchema,
  locale: localeSchema,
})

const passwordResetSchema = z.strictObject({
  token: z.string().min(12, "Account token is required").max(512),
  password: authPasswordSchema,
})

const loginGrantCredentialsSchema = z.strictObject({
  grant: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
})

const credentialLoginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1).max(128),
  locale: localeSchema,
})

const loginOtpVerificationSchema = z.strictObject({
  challengeId: z.uuid(),
  code: z.string().regex(/^\d{6}$/),
})

const loginOtpResendSchema = z.strictObject({
  challengeId: z.uuid(),
})

export type RegistrationInput = z.input<typeof registrationSchema>
export type RecoveryRequestInput = z.input<typeof recoveryRequestSchema>
export type PasswordResetInput = z.input<typeof passwordResetSchema>
export type CredentialLoginInput = z.input<typeof credentialLoginSchema>
export type LoginOtpVerificationInput = z.input<typeof loginOtpVerificationSchema>
export type LoginOtpResendInput = z.input<typeof loginOtpResendSchema>

export function parseRegistration(input: unknown) {
  return registrationSchema.parse(input)
}

export function parseRecoveryRequest(input: unknown) {
  return recoveryRequestSchema.parse(input)
}

export function parsePasswordReset(input: unknown) {
  return passwordResetSchema.parse(input)
}

export function parseLoginGrantCredentials(input: unknown) {
  return loginGrantCredentialsSchema.parse(input)
}

export function parseCredentialLogin(input: unknown) {
  return credentialLoginSchema.parse(input)
}

export function parseLoginOtpVerification(input: unknown) {
  return loginOtpVerificationSchema.parse(input)
}

export function parseLoginOtpResend(input: unknown) {
  return loginOtpResendSchema.parse(input)
}

export function maskEmail(email: string) {
  const [local, domain] = email.trim().toLowerCase().split("@")
  if (!local || !domain) return "***"
  if (local.length === 1) return `*@${domain}`
  if (local.length === 2) return `${local[0]}*@${domain}`
  return `${local[0]}${"*".repeat(local.length - 2)}${local.at(-1)}@${domain}`
}

export function credentialLoginDecision({
  passwordValid,
  emailVerified,
  accountEnabled = true,
}: {
  passwordValid: boolean
  emailVerified: boolean
  accountEnabled?: boolean
}) {
  if (!passwordValid) return "invalid" as const
  if (!emailVerified) return "unverified" as const
  if (!accountEnabled) return "suspended" as const
  return "allow" as const
}

export function publicRecoveryResult(locale: "id" | "en") {
  return locale === "en"
    ? {
        ok: true as const,
        code: "recovery-sent" as const,
        message: "If the account is available, a link will be sent.",
      }
    : {
        ok: true as const,
        code: "recovery-sent" as const,
        message: "Jika akun tersedia, tautan akan dikirim.",
      }
}

export function sessionIsCurrent(tokenVersion: number | undefined, databaseVersion: number) {
  return (tokenVersion ?? 0) === databaseVersion
}
