import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/prisma"

export const runtime = "nodejs"

export async function GET() {
  const flashSales = await prisma.flashSale.findMany({
    where: {
      active: true,
      endsAt: { gt: new Date() },
    },
    include: {
      product: true,
      variant: true,
    },
  })
  return NextResponse.json(flashSales)
}
