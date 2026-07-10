import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const reseller = await prisma.reseller.findUnique({
    where: { userId: session.user.id },
  })

  if (!reseller) {
    return NextResponse.json({ error: "Not a reseller" }, { status: 404 })
  }

  return NextResponse.json(reseller)
}
