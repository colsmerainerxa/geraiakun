import assert from "node:assert/strict"
import test from "node:test"
import {
  getTurnstileConfig,
  TURNSTILE_TEST_SECRET_KEY,
  TURNSTILE_TEST_SITE_KEY,
  verifyTurnstile,
} from "../src/lib/server/turnstile"

test("rejects a missing challenge without calling Siteverify", async () => {
  let calls = 0
  const result = await verifyTurnstile({
    token: "",
    secretKey: TURNSTILE_TEST_SECRET_KEY,
    expectedAction: "register",
    fetchImpl: async () => {
      calls += 1
      return new Response()
    },
  })

  assert.deepEqual(result, { ok: false, reason: "missing-token" })
  assert.equal(calls, 0)
})

test("accepts a verified token with the expected action and hostname", async () => {
  const result = await verifyTurnstile({
    token: "valid-token",
    secretKey: TURNSTILE_TEST_SECRET_KEY,
    expectedAction: "register",
    expectedHostnames: ["localhost"],
    fetchImpl: async () =>
      Response.json({ success: true, action: "register", hostname: "localhost" }),
  })

  assert.deepEqual(result, { ok: true })
})

test("accepts Cloudflare's metadata-only response for the non-production test secret", async () => {
  const result = await verifyTurnstile({
    token: "XXXX.DUMMY.TOKEN.XXXX",
    secretKey: TURNSTILE_TEST_SECRET_KEY,
    expectedAction: "register",
    expectedHostnames: ["localhost"],
    fetchImpl: async () =>
      Response.json({
        success: true,
        hostname: "example.com",
        metadata: { result_with_testing_key: true },
      }),
  })

  assert.deepEqual(result, { ok: true })
})

test("rejects failed, mismatched, and replayed challenge results", async () => {
  const base = {
    token: "challenge-token",
    secretKey: TURNSTILE_TEST_SECRET_KEY,
    expectedAction: "password_reset",
  } as const

  assert.deepEqual(
    await verifyTurnstile({
      ...base,
      fetchImpl: async () =>
        Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] }),
    }),
    { ok: false, reason: "siteverify-failed" },
  )
  assert.deepEqual(
    await verifyTurnstile({
      ...base,
      fetchImpl: async () =>
        Response.json({ success: true, action: "register", hostname: "localhost" }),
    }),
    { ok: false, reason: "action-mismatch" },
  )
  assert.deepEqual(
    await verifyTurnstile({
      ...base,
      expectedHostnames: ["geraiakun.id"],
      fetchImpl: async () =>
        Response.json({ success: true, action: "password_reset", hostname: "attacker.example" }),
    }),
    { ok: false, reason: "hostname-mismatch" },
  )
})

test("fails closed when Siteverify times out", async () => {
  const result = await verifyTurnstile({
    token: "challenge-token",
    secretKey: TURNSTILE_TEST_SECRET_KEY,
    expectedAction: "register",
    fetchImpl: async () => {
      throw new DOMException("Timed out", "AbortError")
    },
  })

  assert.deepEqual(result, { ok: false, reason: "timeout" })
})

test("uses documented test keys only outside production", () => {
  assert.deepEqual(getTurnstileConfig({}, "development"), {
    siteKey: TURNSTILE_TEST_SITE_KEY,
    secretKey: TURNSTILE_TEST_SECRET_KEY,
    expectedHostnames: [],
  })
  assert.throws(() => getTurnstileConfig({}, "production"), /TURNSTILE/i)
  assert.throws(
    () =>
      getTurnstileConfig(
        {
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
          TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET_KEY,
          TURNSTILE_ALLOWED_HOSTNAMES: "geraiakun.id",
        },
        "production",
      ),
    /test keys/i,
  )
})
