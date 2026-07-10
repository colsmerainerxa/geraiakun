import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { backendFlags } from "@/lib/server/env"
import { prisma } from "@/lib/server/prisma"
import { ticketPriorityToDb, ticketTypeToDb } from "@/lib/server/status"

const postSchema = z.object({
  type: z.enum(["garansi", "pembayaran", "akun", "lainnya"]),
  subject: z.string().min(1),
  description: z.string().min(1),
  invoice: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  priority: z.enum(["rendah", "normal", "tinggi"]),
  customerName: z.string().min(1),
  customerEmail: z.string().min(1),
  whatsapp: z.string().min(1),
})

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

  const parsed = postSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }
  const { type, subject, description, invoice, productId, productName, priority, customerName, customerEmail, whatsapp } = parsed.data

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
