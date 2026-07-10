import { NextResponse } from "next/server"
import { getCatalogCategories } from "@/lib/server/catalog"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(await getCatalogCategories())
}
