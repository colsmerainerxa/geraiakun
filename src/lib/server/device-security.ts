import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto"
import { UAParser } from "ua-parser-js"

function hmac(scope: string, value: string, pepper: string) {
  return createHmac("sha256", pepper).update(`${scope}\0${value}`).digest("hex")
}

function normalizedUserAgent(userAgent: string) {
  return userAgent.trim().replace(/\s+/g, " ").slice(0, 1_024)
}

export function createBrowserSecret() {
  return randomBytes(32).toString("base64url")
}

export function createLoginOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

export function hashTrustedDevice(userId: string, secret: string, pepper: string) {
  return hmac(`trusted-device:${userId}`, secret, pepper)
}

export function hashUserAgent(userAgent: string, pepper: string) {
  return hmac("trusted-device:user-agent", normalizedUserAgent(userAgent), pepper)
}

export function hashLoginOtp(challengeId: string, code: string, pepper: string) {
  return hmac(`login-otp:${challengeId}`, code, pepper)
}

export function matchesLoginOtp(
  expectedHash: string,
  challengeId: string,
  code: string,
  pepper: string,
) {
  const actualHash = hashLoginOtp(challengeId, code, pepper)
  const expected = Buffer.from(expectedHash, "hex")
  const actual = Buffer.from(actualHash, "hex")

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function deviceLabel(userAgent: string) {
  const parsed = new UAParser(normalizedUserAgent(userAgent)).getResult()
  const browser = parsed.browser.name || "Unknown browser"
  const os = parsed.os.name || "Unknown OS"

  return `${browser} on ${os}`.slice(0, 80)
}
