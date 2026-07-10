import { NextResponse } from "next/server"
import { getCatalogProduct } from "@/lib/server/catalog"

export const runtime = "nodejs"

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const product = await getCatalogProduct(slug)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(product)
}
