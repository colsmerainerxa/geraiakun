import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { auth } from "@/auth"
import { parseProfilePatch } from "@/lib/server/account-profile"
import { backendFlags, serverEnv } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { rejectUntrustedRequestOrigin } from "@/lib/server/request-security"

export const runtime = "nodejs"

const privateHeaders = { "Cache-Control": "private, no-store" }

type ProfileRecord = {
  name: string | null
  email: string | null
  image: string | null
  emailVerified: Date | null
  profile: {
    whatsapp: string | null
    notifyOrderUpdates: boolean
    notifyPromos: boolean
    notifyTicketReplies: boolean
    notifyNewsletter: boolean
  } | null
}

function toAccountProfile(user: ProfileRecord) {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    image: user.image ?? "",
    emailVerified: Boolean(user.emailVerified),
    whatsapp: user.profile?.whatsapp ?? "",
    notifications: {
      orderUpdates: user.profile?.notifyOrderUpdates ?? true,
      promos: user.profile?.notifyPromos ?? true,
      ticketReplies: user.profile?.notifyTicketReplies ?? true,
      newsletter: user.profile?.notifyNewsletter ?? false,
    },
  }
}

const accountProfileSelect = {
  name: true,
  email: true,
  image: true,
  emailVerified: true,
  profile: {
    select: {
      whatsapp: true,
      notifyOrderUpdates: true,
      notifyPromos: true,
      notifyTicketReplies: true,
      notifyNewsletter: true,
    },
  },
} as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: privateHeaders })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json(
      {
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image ?? "",
        emailVerified: false,
        whatsapp: "",
        notifications: {
          orderUpdates: true,
          promos: true,
          ticketReplies: true,
          newsletter: false,
        },
      },
      { headers: privateHeaders },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: accountProfileSelect,
  })
  if (!user) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404, headers: privateHeaders },
    )
  }

  return NextResponse.json(toAccountProfile(user), { headers: privateHeaders })
}

export async function PATCH(request: Request) {
  const originError = rejectUntrustedRequestOrigin(request, serverEnv.APP_URL)
  if (originError) return originError
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: privateHeaders })
  }
  if (!backendFlags.databaseConfigured) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503, headers: privateHeaders },
    )
  }

  try {
    const patch = parseProfilePatch(await request.json())
    const profileData = {
      ...(patch.whatsapp !== undefined ? { whatsapp: patch.whatsapp } : {}),
      ...(patch.notifications?.orderUpdates !== undefined
        ? { notifyOrderUpdates: patch.notifications.orderUpdates }
        : {}),
      ...(patch.notifications?.promos !== undefined
        ? { notifyPromos: patch.notifications.promos }
        : {}),
      ...(patch.notifications?.ticketReplies !== undefined
        ? { notifyTicketReplies: patch.notifications.ticketReplies }
        : {}),
      ...(patch.notifications?.newsletter !== undefined
        ? { notifyNewsletter: patch.notifications.newsletter }
        : {}),
    }

    const user = await prisma.$transaction(async (tx) => {
      if (patch.name !== undefined) {
        await tx.user.update({ where: { id: session.user.id }, data: { name: patch.name } })
      }
      if (Object.keys(profileData).length > 0) {
        await tx.customerProfile.upsert({
          where: { userId: session.user.id },
          create: { userId: session.user.id, ...profileData },
          update: profileData,
        })
      }
      return tx.user.findUnique({
        where: { id: session.user.id },
        select: accountProfileSelect,
      })
    })

    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404, headers: privateHeaders },
      )
    }
    return NextResponse.json(toAccountProfile(user), { headers: privateHeaders })
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid profile input" },
        { status: 400, headers: privateHeaders },
      )
    }
    console.error("Profile update failed", error)
    return NextResponse.json(
      { error: "Profile update failed" },
      { status: 500, headers: privateHeaders },
    )
  }
}
