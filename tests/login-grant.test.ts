import assert from "node:assert/strict"
import test from "node:test"
import { parseLoginGrantCredentials } from "../src/lib/server/auth-flows"
import { createAccountToken, hashAccountToken } from "../src/lib/server/auth-security"

const pepper = "test-pepper-with-at-least-thirty-two-characters"

test("credentials input accepts only a login grant", () => {
  const grant = "a".repeat(43)

  assert.deepEqual(parseLoginGrantCredentials({ grant }), { grant })
  assert.throws(() => parseLoginGrantCredentials({ email: "a@example.com", password: "Secure123" }))
  assert.throws(() => parseLoginGrantCredentials({ grant, email: "a@example.com" }))
})

test("LOGIN_GRANT is purpose-bound", () => {
  const grant = createAccountToken("LOGIN_GRANT", pepper)

  assert.notEqual(grant.hash, hashAccountToken(grant.raw, "PASSWORD_RESET", pepper))
  assert.notEqual(grant.hash, hashAccountToken(grant.raw, "EMAIL_VERIFY", pepper))
})
