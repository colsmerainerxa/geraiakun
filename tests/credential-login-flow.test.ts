import assert from "node:assert/strict"
import test from "node:test"
import {
  maskEmail,
  parseCredentialLogin,
  parseLoginOtpResend,
  parseLoginOtpVerification,
} from "../src/lib/server/auth-flows"

test("credential login input is strict and normalized", () => {
  assert.deepEqual(
    parseCredentialLogin({
      email: " A@Example.com ",
      password: "Secure123",
      locale: "id",
    }),
    { email: "a@example.com", password: "Secure123", locale: "id" },
  )
  assert.throws(() =>
    parseCredentialLogin({
      email: "a@example.com",
      password: "Secure123",
      locale: "id",
      remember: true,
    }),
  )
})

test("OTP inputs require an opaque challenge and exactly six digits", () => {
  const challengeId = "0f47d750-f28b-4a2e-a043-fd238ff478e1"

  assert.deepEqual(parseLoginOtpVerification({ challengeId, code: "042731" }), {
    challengeId,
    code: "042731",
  })
  assert.deepEqual(parseLoginOtpResend({ challengeId }), { challengeId })
  assert.throws(() => parseLoginOtpVerification({ challengeId, code: "12345" }))
  assert.throws(() => parseLoginOtpVerification({ challengeId: "x", code: "123456" }))
})

test("email masking preserves only enough context for the owner", () => {
  assert.equal(maskEmail("customer@example.com"), "c******r@example.com")
  assert.equal(maskEmail("ab@example.com"), "a*@example.com")
})
