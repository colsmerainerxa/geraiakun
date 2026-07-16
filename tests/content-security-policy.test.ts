import assert from "node:assert/strict"
import test from "node:test"
import {
  buildContentSecurityPolicy,
  createContentSecurityPolicyNonce,
} from "../src/lib/server/content-security-policy"

test("builds a locked-down production policy around the supplied nonce", () => {
  const policy = buildContentSecurityPolicy("nonce-value", "production")

  assert.match(policy, /default-src 'self'/)
  assert.match(policy, /script-src[^;]*'nonce-nonce-value'/)
  assert.match(policy, /script-src[^;]*'strict-dynamic'/)
  assert.match(policy, /script-src[^;]*https:\/\/challenges\.cloudflare\.com/)
  assert.match(policy, /style-src 'self' 'unsafe-inline'/)
  assert.match(
    policy,
    /img-src 'self' blob: data: https:\/\/images\.unsplash\.com https:\/\/api\.dicebear\.com/,
  )
  assert.match(policy, /connect-src[^;]*https:\/\/challenges\.cloudflare\.com/)
  assert.match(policy, /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/)
  assert.match(policy, /object-src 'none'/)
  assert.match(policy, /base-uri 'self'/)
  assert.match(policy, /form-action 'self'/)
  assert.match(policy, /frame-ancestors 'none'/)
  assert.match(policy, /upgrade-insecure-requests/)
  assert.doesNotMatch(policy, /'unsafe-eval'/)
  assert.doesNotMatch(policy, /[\r\n]/)
})

test("allows Next.js evaluation only in development", () => {
  const policy = buildContentSecurityPolicy("dev-nonce", "development")

  assert.match(policy, /script-src[^;]*'unsafe-eval'/)
  assert.doesNotMatch(policy, /upgrade-insecure-requests/)
})

test("creates unpredictable nonces with sufficient entropy", () => {
  const first = createContentSecurityPolicyNonce()
  const second = createContentSecurityPolicyNonce()

  assert.notEqual(first, second)
  assert.ok(Buffer.from(first, "base64").byteLength >= 16)
  assert.ok(Buffer.from(second, "base64").byteLength >= 16)
})
