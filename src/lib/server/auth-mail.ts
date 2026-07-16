import nodemailer from "nodemailer"
import type { AccountTokenPurpose } from "./auth-security"

type MailEnvironment = Record<string, string | undefined>

export type AuthMailMessage = {
  subject: string
  text: string
  html: string
  url?: string
}

type MailConfig =
  | { mode: "ethereal"; previewEnabled: boolean }
  | {
      mode: "smtp"
      host: string
      port: number
      secure: boolean
      user: string
      pass: string
      from: string
      previewEnabled: false
    }

export function resolveMailConfig(
  env: MailEnvironment = process.env,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): MailConfig {
  const mode = env.EMAIL_TRANSPORT ?? (nodeEnv === "production" ? "smtp" : "ethereal")
  if (mode === "ethereal") {
    if (nodeEnv === "production") throw new Error("Ethereal is not allowed in production")
    return { mode: "ethereal", previewEnabled: env.EMAIL_PREVIEW_ENABLED !== "false" }
  }
  if (mode !== "smtp") throw new Error("Unsupported account email transport")

  const host = env.SMTP_HOST?.trim()
  const user = env.SMTP_USER?.trim()
  const pass = env.SMTP_PASS
  const from = env.SMTP_FROM?.trim()
  const port = Number(env.SMTP_PORT ?? "587")
  if (!host || !user || !pass || !from || !Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP host, port, user, password, and sender must be configured")
  }
  return {
    mode: "smtp",
    host,
    port,
    secure: env.SMTP_SECURE === "true",
    user,
    pass,
    from,
    previewEnabled: false,
  }
}

function applicationOrigin(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error("Invalid application URL")
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Invalid application URL")
  }
  return url.origin
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }
    return entities[character]
  })
}

export function buildAuthEmail({
  purpose,
  locale,
  name,
  rawToken,
  appUrl,
}: {
  purpose: Exclude<AccountTokenPurpose, "LOGIN_GRANT">
  locale: "id" | "en"
  name: string | null | undefined
  rawToken: string
  appUrl: string
}) {
  const isEn = locale === "en"
  const path = purpose === "EMAIL_VERIFY" ? "verifikasi-email" : "reset-sandi"
  const url = new URL(`/${locale}/${path}`, applicationOrigin(appUrl))
  url.searchParams.set("token", rawToken)
  const displayName = name?.trim() || (isEn ? "there" : "Pelanggan")

  if (purpose === "EMAIL_VERIFY") {
    const subject = isEn ? "Verify your geraiakun email" : "Verifikasi email geraiakun"
    const heading = isEn ? "Verify email" : "Verifikasi email"
    const expiry = isEn ? "This link expires in 60 minutes." : "Tautan ini berlaku selama 60 menit."
    const text = `${isEn ? "Hello" : "Halo"} ${displayName},\n\n${heading}: ${url.toString()}\n\n${expiry}`
    return {
      subject,
      url: url.toString(),
      text,
      html: `<p>${isEn ? "Hello" : "Halo"} ${escapeHtml(displayName)},</p><p><a href="${escapeHtml(url.toString())}">${heading}</a></p><p>${expiry}</p>`,
    }
  }

  if (purpose === "STAFF_INVITE") {
    const subject = isEn ? "Your geraiakun staff invitation" : "Undangan staf geraiakun"
    const heading = isEn ? "Set staff password" : "Atur kata sandi staf"
    const expiry = isEn ? "This link expires in 60 minutes." : "Tautan ini berlaku selama 60 menit."
    const ownership = isEn
      ? "Setting your password also verifies your email address."
      : "Mengatur kata sandi juga memverifikasi email kamu."
    const text = `${isEn ? "Hello" : "Halo"} ${displayName},\n\n${heading}: ${url.toString()}\n\n${ownership} ${expiry}`
    return {
      subject,
      url: url.toString(),
      text,
      html: `<p>${isEn ? "Hello" : "Halo"} ${escapeHtml(displayName)},</p><p><a href="${escapeHtml(url.toString())}">${heading}</a></p><p>${ownership} ${expiry}</p>`,
    }
  }

  const subject = isEn ? "Reset your geraiakun password" : "Atur ulang kata sandi geraiakun"
  const heading = isEn ? "Reset password" : "Atur ulang kata sandi"
  const expiry = isEn ? "This link expires in 30 minutes." : "Tautan ini berlaku selama 30 menit."
  const text = `${isEn ? "Hello" : "Halo"} ${displayName},\n\n${heading}: ${url.toString()}\n\n${expiry}`
  return {
    subject,
    url: url.toString(),
    text,
    html: `<p>${isEn ? "Hello" : "Halo"} ${escapeHtml(displayName)},</p><p><a href="${escapeHtml(url.toString())}">${heading}</a></p><p>${expiry}</p>`,
  }
}

export function buildLoginOtpEmail({
  locale,
  name,
  code,
}: {
  locale: "id" | "en"
  name: string | null | undefined
  code: string
}): AuthMailMessage {
  const isEn = locale === "en"
  const displayName = name?.trim() || (isEn ? "there" : "Pelanggan")
  const subject = isEn ? "Your geraiakun login code" : "Kode login geraiakun"
  const greeting = isEn ? "Hello" : "Halo"
  const instruction = isEn
    ? "Use this code to finish signing in to geraiakun:"
    : "Gunakan kode ini untuk menyelesaikan login ke geraiakun:"
  const expiry = isEn
    ? "This code expires in 10 minutes. If you did not try to sign in, ignore this email."
    : "Kode ini berlaku selama 10 menit. Jika kamu tidak mencoba login, abaikan email ini."

  return {
    subject,
    text: `${greeting} ${displayName},\n\n${instruction}\n\n${code}\n\n${expiry}`,
    html: `<p>${greeting} ${escapeHtml(displayName)},</p><p>${instruction}</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(code)}</p><p>${expiry}</p>`,
  }
}

type ReadyTransport = {
  transporter: nodemailer.Transporter
  from: string
  ethereal: boolean
}

let etherealTransport: Promise<ReadyTransport> | undefined
let smtpTransport: Promise<ReadyTransport> | undefined

async function createReadyTransport(config: MailConfig): Promise<ReadyTransport> {
  if (config.mode === "ethereal") {
    const account = await nodemailer.createTestAccount()
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    })
    await transporter.verify()
    return { transporter, from: `geraiakun <${account.user}>`, ethereal: true }
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })
  await transporter.verify()
  return { transporter, from: config.from, ethereal: false }
}

export async function sendAuthEmail({
  to,
  message,
  env = process.env,
  nodeEnv = process.env.NODE_ENV,
}: {
  to: string
  message: AuthMailMessage
  env?: MailEnvironment
  nodeEnv?: string
}) {
  const config = resolveMailConfig(env, nodeEnv)
  let readyTransport: Promise<ReadyTransport>
  if (config.mode === "ethereal") {
    if (!etherealTransport) etherealTransport = createReadyTransport(config)
    readyTransport = etherealTransport
  } else {
    if (!smtpTransport) smtpTransport = createReadyTransport(config)
    readyTransport = smtpTransport
  }
  const ready = await readyTransport
  const info = await ready.transporter.sendMail({
    from: ready.from,
    to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  })
  const preview =
    ready.ethereal && config.previewEnabled ? nodemailer.getTestMessageUrl(info) : false
  return { messageId: info.messageId, previewUrl: preview || null }
}
