import { z } from "zod"

const fallbackDatabaseUrl =
  "postgresql://geraiakun:geraiakun@localhost:5432/geraiakun?schema=public"

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z.string().optional(),
  CREDENTIAL_ENCRYPTION_KEY: z.string().min(16).optional(),
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success && process.env.NODE_ENV !== "production") {
  console.warn("Invalid optional backend env:", parsed.error.flatten().fieldErrors)
}

const raw = parsed.success ? parsed.data : {}

function isFilled(value: string | undefined) {
  return Boolean(value && !value.includes("USER:PASSWORD@HOST") && !value.includes("replace-with"))
}

export const serverEnv = {
  DATABASE_URL: raw.DATABASE_URL ?? fallbackDatabaseUrl,
  AUTH_SECRET: (() => {
    const fallback = "geraiakun-dev-auth-secret-change-me"
    if (raw.AUTH_SECRET) return raw.AUTH_SECRET
    if (raw.NEXTAUTH_SECRET) return raw.NEXTAUTH_SECRET
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production")
    }
    console.warn("AUTH_SECRET not set — using insecure dev fallback")
    return fallback
  })(),
  AUTH_GOOGLE_ID: raw.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: raw.AUTH_GOOGLE_SECRET,
  MIDTRANS_SERVER_KEY: raw.MIDTRANS_SERVER_KEY,
  MIDTRANS_CLIENT_KEY: raw.MIDTRANS_CLIENT_KEY,
  MIDTRANS_IS_PRODUCTION: raw.MIDTRANS_IS_PRODUCTION === "true",
  CREDENTIAL_ENCRYPTION_KEY: (() => {
    const fallback = "geraiakun-dev-credential-key-change-me"
    if (raw.CREDENTIAL_ENCRYPTION_KEY) return raw.CREDENTIAL_ENCRYPTION_KEY
    if (process.env.NODE_ENV === "production") {
      throw new Error("CREDENTIAL_ENCRYPTION_KEY must be set in production")
    }
    console.warn("CREDENTIAL_ENCRYPTION_KEY not set — using insecure dev fallback")
    return fallback
  })(),
  APP_URL: raw.APP_URL ?? raw.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000",
}

export const backendFlags = {
  databaseConfigured: isFilled(raw.DATABASE_URL),
  googleConfigured: isFilled(raw.AUTH_GOOGLE_ID) && isFilled(raw.AUTH_GOOGLE_SECRET),
  midtransConfigured: isFilled(raw.MIDTRANS_SERVER_KEY) && isFilled(raw.MIDTRANS_CLIENT_KEY),
}

export function requireConfiguredBackend(feature: string) {
  if (!backendFlags.databaseConfigured) {
    throw new Error(`${feature} needs DATABASE_URL to be configured.`)
  }
}
