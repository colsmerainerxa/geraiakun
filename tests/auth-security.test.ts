import assert from "node:assert/strict"
import test from "node:test"
import {
  AUTH_RATE_POLICIES,
  checkRateWindow,
  createAccountToken,
  evaluateAuthRateLimit,
  hashAccountToken,
  hashIdentifier,
  isTokenExpired,
} from "../src/lib/server/auth-security"

const pepper = "test-pepper-with-at-least-thirty-two-characters"

test("hashes rate-limit identifiers without retaining raw personal data", () => {
  const email = "customer@example.com"
  const ip = "203.0.113.8"
  const emailHash = hashIdentifier("email", email, pepper)
  const ipHash = hashIdentifier("ip", ip, pepper)

  assert.equal(emailHash.length, 64)
  assert.equal(ipHash.length, 64)
  assert.notEqual(emailHash, ipHash)
  assert.equal(emailHash.includes(email), false)
  assert.equal(ipHash.includes(ip), false)
  assert.equal(hashIdentifier("email", email, pepper), emailHash)
})

test("creates purpose-bound account tokens with at least 256 bits of entropy", () => {
  const token = createAccountToken("EMAIL_VERIFY", pepper)

  assert.ok(Buffer.from(token.raw, "base64url").byteLength >= 32)
  assert.notEqual(token.raw, token.hash)
  assert.equal(token.hash, hashAccountToken(token.raw, "EMAIL_VERIFY", pepper))
  assert.notEqual(token.hash, hashAccountToken(token.raw, "PASSWORD_RESET", pepper))
  assert.notEqual(token.hash, hashAccountToken(token.raw, "STAFF_INVITE", pepper))
  assert.notEqual(token.hash, hashAccountToken(token.raw, "LOGIN_GRANT", pepper))
})

test("detects token expiry at the boundary", () => {
  const now = new Date("2026-07-15T12:00:00.000Z")

  assert.equal(isTokenExpired(new Date("2026-07-15T12:00:00.001Z"), now), false)
  assert.equal(isTokenExpired(new Date("2026-07-15T12:00:00.000Z"), now), true)
})

test("returns deterministic retry metadata for a full rate window", () => {
  const now = Date.parse("2026-07-15T12:00:00.000Z")
  const result = checkRateWindow([now - 1_000, now - 2_000], 2, 60_000, now)

  assert.deepEqual(result, { allowed: false, retryAfterSeconds: 58, remaining: 0 })
  assert.deepEqual(checkRateWindow([now - 61_000], 2, 60_000, now), {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: 2,
  })
})

test("defines the approved durable auth limits", () => {
  assert.deepEqual(AUTH_RATE_POLICIES.login, {
    identity: { limit: 5, windowMs: 15 * 60_000 },
    ip: { limit: 30, windowMs: 15 * 60_000 },
  })
  assert.deepEqual(AUTH_RATE_POLICIES.register.ip, { limit: 5, windowMs: 60 * 60_000 })
  assert.deepEqual(AUTH_RATE_POLICIES.passwordReset.identity, {
    limit: 3,
    windowMs: 15 * 60_000,
  })
  assert.deepEqual(AUTH_RATE_POLICIES.verificationResend.ip, {
    limit: 10,
    windowMs: 60 * 60_000,
  })
  assert.deepEqual(AUTH_RATE_POLICIES.loginOtpSend, {
    identity: { limit: 3, windowMs: 15 * 60_000 },
    ip: { limit: 10, windowMs: 60 * 60_000 },
  })
  assert.deepEqual(AUTH_RATE_POLICIES.loginOtpVerify, {
    identity: { limit: 20, windowMs: 15 * 60_000 },
    ip: { limit: 50, windowMs: 60 * 60_000 },
  })
})

test("enforces both identity and IP limits using the longest retry", () => {
  const now = Date.parse("2026-07-15T12:00:00.000Z")
  const result = evaluateAuthRateLimit({
    action: "passwordReset",
    identityTimestamps: [now - 1_000, now - 2_000, now - 3_000],
    ipTimestamps: Array.from({ length: 10 }, (_, index) => now - (index + 1) * 1_000),
    now,
  })

  assert.deepEqual(result, { allowed: false, retryAfterSeconds: 3_590, remaining: 0 })
})
