import assert from "node:assert/strict"
import test from "node:test"
import {
  credentialLoginDecision,
  parsePasswordReset,
  parseRecoveryRequest,
  parseRegistration,
  publicRecoveryResult,
  sessionIsCurrent,
} from "../src/lib/server/auth-flows"

test("registration requires a consistent strong password and challenge", () => {
  assert.deepEqual(
    parseRegistration({
      name: "  Aan First ",
      email: " AAN@Example.com ",
      password: "Secure123456",
      turnstileToken: "challenge",
      locale: "id",
    }),
    {
      name: "Aan First",
      email: "aan@example.com",
      password: "Secure123456",
      turnstileToken: "challenge",
      locale: "id",
    },
  )
  assert.throws(
    () =>
      parseRegistration({
        name: "Aan First",
        email: "aan@example.com",
        password: "short1",
        turnstileToken: "challenge",
        locale: "id",
      }),
    /password/i,
  )
  assert.throws(
    () =>
      parseRegistration({
        name: "Aan First",
        email: "aan@example.com",
        password: "Secure12345",
        turnstileToken: "challenge",
        locale: "id",
      }),
    /password/i,
  )
  assert.throws(
    () =>
      parseRegistration({
        name: "Aan First",
        email: "aan@example.com",
        password: "Secure123456",
        turnstileToken: "",
        locale: "id",
      }),
    /challenge/i,
  )
})

test("password reset uses the same policy and never accepts a missing token", () => {
  assert.deepEqual(parsePasswordReset({ token: "account-token", password: "Secure123456" }), {
    token: "account-token",
    password: "Secure123456",
  })
  assert.throws(() => parsePasswordReset({ token: "", password: "Secure123456" }), /token/i)
  assert.throws(
    () => parsePasswordReset({ token: "account-token", password: "Secure12345" }),
    /password/i,
  )
  assert.throws(
    () => parsePasswordReset({ token: "account-token", password: "allletters" }),
    /password/i,
  )
})

test("credential decisions reveal verification only after a valid password", () => {
  assert.equal(credentialLoginDecision({ passwordValid: false, emailVerified: false }), "invalid")
  assert.equal(credentialLoginDecision({ passwordValid: true, emailVerified: false }), "unverified")
  assert.equal(
    credentialLoginDecision({
      passwordValid: true,
      emailVerified: true,
      accountEnabled: false,
    }),
    "suspended",
  )
  assert.equal(credentialLoginDecision({ passwordValid: true, emailVerified: true }), "allow")
})

test("recovery requests normalize email and always return the same public result", () => {
  assert.deepEqual(
    parseRecoveryRequest({
      email: " Customer@Example.com ",
      turnstileToken: "challenge",
      locale: "en",
    }),
    { email: "customer@example.com", turnstileToken: "challenge", locale: "en" },
  )
  assert.deepEqual(publicRecoveryResult("id"), {
    ok: true,
    code: "recovery-sent",
    message: "Jika akun tersedia, tautan akan dikirim.",
  })
  assert.deepEqual(publicRecoveryResult("en"), {
    ok: true,
    code: "recovery-sent",
    message: "If the account is available, a link will be sent.",
  })
})

test("session version mismatch invalidates an older JWT", () => {
  assert.equal(sessionIsCurrent(2, 2), true)
  assert.equal(sessionIsCurrent(1, 2), false)
  assert.equal(sessionIsCurrent(undefined, 0), true)
})
