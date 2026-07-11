import { type NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

const intlMiddleware = createMiddleware(routing)

const pathAliases = {
  "/login": "/id/masuk",
  "/signin": "/id/masuk",
  "/register": "/id/daftar",
  "/signup": "/id/daftar",
} as const

export default function proxy(request: NextRequest) {
  const target = pathAliases[request.nextUrl.pathname as keyof typeof pathAliases]
  if (target) {
    return NextResponse.redirect(new URL(target, request.url))
  }

  return intlMiddleware(request)
}

export const config = {
  // Match all paths except API, Next internals, files with an extension, and
  // metadata image routes (opengraph-image / twitter-image) — the latter must
  // serve directly so social scrapers don't hit a locale redirect.
  matcher: ["/((?!api|_next|_vercel|.*\\..*|.*opengraph-image|.*twitter-image).*)"],
}
