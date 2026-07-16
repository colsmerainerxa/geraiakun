import assert from "node:assert/strict"
import test from "node:test"
import {
  createBrowserSecret,
  createLoginOtp,
  deviceLabel,
  hashLoginOtp,
  hashTrustedDevice,
  hashUserAgent,
  matchesLoginOtp,
} from "../src/lib/server/device-security"

const pepper = "test-pepper-with-at-least-thirty-two-characters"

test("creates browser secrets with 256 bits of entropy", () => {
  const secret = createBrowserSecret()

  assert.equal(Buffer.from(secret, "base64url").byteLength, 32)
  assert.notEqual(createBrowserSecret(), secret)
})

test("scopes trusted-device hashes to the user", () => {
  const secret = "browser-secret"
  const first = hashTrustedDevice("user-a", secret, pepper)

  assert.equal(first.length, 64)
  assert.equal(hashTrustedDevice("user-a", secret, pepper), first)
  assert.notEqual(hashTrustedDevice("user-b", secret, pepper), first)
  assert.equal(first.includes(secret), false)
})

test("creates and verifies six-digit login OTP codes", () => {
  const code = createLoginOtp()
  const challengeId = "challenge-id"
  const hash = hashLoginOtp(challengeId, code, pepper)

  assert.match(code, /^\d{6}$/)
  assert.equal(matchesLoginOtp(hash, challengeId, code, pepper), true)
  assert.equal(matchesLoginOtp(hash, challengeId, "000000", pepper), code === "000000")
  assert.notEqual(hashLoginOtp("other-challenge", code, pepper), hash)
})

test("hashes normalized user agents and creates a safe short label", () => {
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
  const hash = hashUserAgent(ua, pepper)
  const label = deviceLabel(ua)

  assert.equal(hash.length, 64)
  assert.equal(hashUserAgent(`  ${ua}  `, pepper), hash)
  assert.match(label, /Chrome.*Windows/i)
  assert.ok(label.length <= 80)
  assert.equal(label.includes("Mozilla"), false)
})
