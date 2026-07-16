import { buildAuthEmail, sendAuthEmail } from "@/lib/server/auth-mail"
import { createAccountToken } from "@/lib/server/auth-security"
import { serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"

export async function createStaffInvite({ name, email }: { name: string; email: string }) {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedName = name.trim().replace(/\s+/g, " ")
  const token = createAccountToken("STAFF_INVITE", serverEnv.AUTH_TOKEN_PEPPER)
  const expiresAt = new Date(Date.now() + 60 * 60_000)

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        role: "ADMIN",
        adminStaff: { create: { status: "invited" } },
      },
    })
    await tx.accountToken.create({
      data: {
        email: normalizedEmail,
        purpose: "STAFF_INVITE",
        tokenHash: token.hash,
        expiresAt,
      },
    })
    return created
  })

  const delivery = await sendAuthEmail({
    to: normalizedEmail,
    message: buildAuthEmail({
      purpose: "STAFF_INVITE",
      locale: "id",
      name: normalizedName,
      rawToken: token.raw,
      appUrl: serverEnv.APP_URL,
    }),
  })

  return { user, previewUrl: delivery.previewUrl }
}
