import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import {
  buildContentSecurityPolicy,
  createContentSecurityPolicyNonce,
} from "./lib/server/content-security-policy"

const intlMiddleware = createMiddleware(routing)

const pathAliases = {
  "/login": "/id/masuk",
  "/signin": "/id/masuk",
  "/register": "/id/daftar",
  "/signup": "/id/daftar",
} as const

export default function proxy(request: NextRequest) {
  const nonce = createContentSecurityPolicyNonce()
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, process.env.NODE_ENV)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy)
  const securedRequest = new NextRequest(request, { headers: requestHeaders })
  const target = pathAliases[request.nextUrl.pathname as keyof typeof pathAliases]
  let response: NextResponse

  if (target) {
    response = NextResponse.redirect(new URL(target, request.url))
  } else {
    response = intlMiddleware(securedRequest)
  }

  response.headers.set("Content-Security-Policy", contentSecurityPolicy)
  return response
}

export const config = {
  // Match all paths except API, Next internals, files with an extension, and
  // metadata image routes (opengraph-image / twitter-image) — the latter must
  // serve directly so social scrapers don't hit a locale redirect.
  matcher: ["/((?!api|_next|_vercel|.*\\..*|.*opengraph-image|.*twitter-image).*)"],
}
