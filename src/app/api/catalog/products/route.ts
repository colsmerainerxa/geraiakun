import { NextResponse } from "next/server"
import type { ProductQuery } from "@/lib/mock/fake-api"
import { getCatalogProducts } from "@/lib/server/catalog"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query: ProductQuery = {
    category: (url.searchParams.get("category") as ProductQuery["category"]) ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    sort: (url.searchParams.get("sort") as ProductQuery["sort"]) ?? undefined,
    minPrice: url.searchParams.get("minPrice")
      ? Number(url.searchParams.get("minPrice"))
      : undefined,
    maxPrice: url.searchParams.get("maxPrice")
      ? Number(url.searchParams.get("maxPrice"))
      : undefined,
    badges: url.searchParams.get("badges")?.split(",").filter(Boolean),
    accountType: (url.searchParams.get("accountType") as ProductQuery["accountType"]) ?? undefined,
    duration: (url.searchParams.get("duration") as ProductQuery["duration"]) ?? undefined,
  }
  return NextResponse.json(await getCatalogProducts(query))
}
