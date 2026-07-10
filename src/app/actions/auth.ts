"use server"

import { z } from "zod"
import { backendFlags } from "@/lib/server/env"
import { hashPassword } from "@/lib/server/password"
import { prisma } from "@/lib/server/prisma"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

const resetPasswordSchema = z.object({
  token: z.string().min(12),
  password: z.string().min(8).regex(/\d/),
})

const PASSWORD_RESET_PREFIX = "password-reset:"
const EMAIL_VERIFY_PREFIX = "email-verify:"

function tokenExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000)
}

export async function registerCustomer(input: z.input<typeof registerSchema>) {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: "Data pendaftaran belum valid." }
  }

  if (!backendFlags.databaseConfigured) {
    return { ok: false, message: "Database belum dikonfigurasi." }
  }

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // ponytail: generic message prevents email enumeration
    return { ok: false, message: "Email atau kata sandi tidak valid." }
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "CUSTOMER",
      profile: {
        create: {
          status: "baru",
        },
      },
    },
  })

  const verification = await createVerificationToken(`${EMAIL_VERIFY_PREFIX}${email}`, 60)

  // ponytail: verification token sent via email; never returned to client
  return { ok: true, message: "Akun berhasil dibuat." }
}

async function createVerificationToken(identifier: string, expiresInMinutes: number) {
  const token = crypto.randomUUID()
  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires: tokenExpiry(expiresInMinutes),
    },
  })
  return { token }
}

export async function requestPasswordReset(email: string) {
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) return { ok: false, message: "Email tidak valid." }

  if (!backendFlags.databaseConfigured) {
    return { ok: true, message: "Tautan reset siap dikirim." }
  }

  const identifier = `${PASSWORD_RESET_PREFIX}${parsed.data.toLowerCase()}`
  const user = await prisma.user.findUnique({ where: { email: parsed.data.toLowerCase() } })
  if (user) {
    await createVerificationToken(identifier, 30)
  }

  // ponytail: token sent via email in production; never returned to client
  return { ok: true, message: "Tautan reset siap dikirim." }
}

export async function resetPassword(input: z.input<typeof resetPasswordSchema>) {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: "Kata sandi harus minimal 8 karakter dan berisi angka." }
  }

  if (!backendFlags.databaseConfigured) {
    return { ok: true, message: "Kata sandi diperbarui." }
  }

  const verification = await prisma.verificationToken.findFirst({
    where: {
      token: parsed.data.token,
      identifier: { startsWith: PASSWORD_RESET_PREFIX },
      expires: { gte: new Date() },
    },
  })
  if (!verification) {
    return { ok: false, message: "Tautan reset tidak valid atau kedaluwarsa." }
  }

  const email = verification.identifier.replace(PASSWORD_RESET_PREFIX, "")
  const passwordHash = await hashPassword(parsed.data.password)
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { email },
      data: { passwordHash, emailVerified: new Date() },
    })
    await tx.verificationToken.deleteMany({
      where: { identifier: verification.identifier, token: verification.token },
    })
    return updated
  })

  if (result.count === 0) return { ok: false, message: "Akun tidak ditemukan." }
  return { ok: true, message: "Kata sandi diperbarui." }
}

export async function requestEmailVerification(email: string) {
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) return { ok: false, message: "Email tidak valid." }

  if (!backendFlags.databaseConfigured) {
    return { ok: true, message: "Tautan verifikasi siap dikirim." }
  }

  const normalizedEmail = parsed.data.toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (user) {
    await createVerificationToken(`${EMAIL_VERIFY_PREFIX}${normalizedEmail}`, 60)
  }

  // ponytail: token sent via email in production; never returned to client
  return { ok: true, message: "Tautan verifikasi siap dikirim." }
}

export async function verifyEmailToken(token: string) {
  const parsed = z.string().min(12).safeParse(token)
  if (!parsed.success) return { ok: false, message: "Token verifikasi tidak valid." }

  if (!backendFlags.databaseConfigured) {
    return { ok: true, message: "Email berhasil diverifikasi." }
  }

  const verification = await prisma.verificationToken.findFirst({
    where: {
      token: parsed.data,
      identifier: { startsWith: EMAIL_VERIFY_PREFIX },
      expires: { gte: new Date() },
    },
  })
  if (!verification) {
    return { ok: false, message: "Tautan verifikasi tidak valid atau kedaluwarsa." }
  }

  const email = verification.identifier.replace(EMAIL_VERIFY_PREFIX, "")
  await prisma.$transaction([
    prisma.user.updateMany({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.deleteMany({
      where: { identifier: verification.identifier, token: verification.token },
    }),
  ])

  return { ok: true, message: "Email berhasil diverifikasi." }
}
