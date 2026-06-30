import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

export default createMiddleware(routing)

export const config = {
  // Match all paths except API, Next internals, files with an extension, and
  // metadata image routes (opengraph-image / twitter-image) � the latter must
  // serve directly so social scrapers don't hit a locale redirect.
  matcher: ["/((?!api|_next|_vercel|.*\\..*|.*opengraph-image|.*twitter-image).*)"],
}
