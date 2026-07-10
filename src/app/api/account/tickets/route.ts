import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { ticketPriorityToDb, ticketTypeToDb } from "@/lib/server/status"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json([])
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(tickets)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { type, subject, description, invoice, productId, productName, priority, customerName, customerEmail, whatsapp } = body

  if (!type || !subject || !description || !priority || !customerName || !customerEmail || !whatsapp) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const code = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

  if (!backendFlags.databaseConfigured) {
    return NextResponse.json({ code })
  }

  const ticket = await prisma.ticket.create({
    data: {
      code,
      userId: session.user.id,
      type: ticketTypeToDb[type as keyof typeof ticketTypeToDb],
      subject,
      description,
      invoice: invoice || null,
      productId: productId || null,
      productName: productName || null,
      priority: ticketPriorityToDb[priority as keyof typeof ticketPriorityToDb],
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      whatsapp,
      messages: [
        {
          id: crypto.randomUUID(),
          author: customerName,
          role: "pelanggan",
          message: description,
          date: new Date().toISOString(),
        },
      ],
    },
  })

  return NextResponse.json({ code: ticket.code })
}
