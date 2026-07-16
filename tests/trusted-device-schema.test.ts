import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("schema contains trusted devices, OTP challenges, and login grants", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8")

  assert.match(schema, /LOGIN_GRANT/)
  assert.match(schema, /LOGIN_OTP_SEND/)
  assert.match(schema, /LOGIN_OTP_VERIFY/)
  assert.match(schema, /model TrustedDevice/)
  assert.match(schema, /@@unique\(\[userId, deviceHash\]\)/)
  assert.match(schema, /model LoginOtpChallenge/)
})
