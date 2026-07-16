import { randomBytes } from "node:crypto"

export function createContentSecurityPolicyNonce() {
  return randomBytes(18).toString("base64")
}

export function buildContentSecurityPolicy(nonce: string, nodeEnv: string) {
  const directives = [
    "default-src 'self'",
    [
      "script-src",
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(nodeEnv === "development" ? ["'unsafe-eval'"] : []),
      "https://challenges.cloudflare.com",
    ].join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://images.unsplash.com https://api.dicebear.com",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com https://*.challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com https://*.challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(nodeEnv === "production" ? ["upgrade-insecure-requests"] : []),
  ]

  return directives.join("; ")
}
