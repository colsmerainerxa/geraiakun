import assert from "node:assert/strict"
import test from "node:test"
import {
  hasTrustedRequestOrigin,
  rejectUntrustedRequestOrigin,
} from "../src/lib/server/request-security"

test("accepts only the configured application origin", () => {
  assert.equal(
    hasTrustedRequestOrigin(
      new Request("https://geraiakun.id/api/account/profile", {
        method: "PATCH",
        headers: { Origin: "https://geraiakun.id" },
      }),
      "https://geraiakun.id",
    ),
    true,
  )
  assert.equal(
    hasTrustedRequestOrigin(
      new Request("https://geraiakun.id/api/account/profile", {
        method: "PATCH",
        headers: { Origin: "https://evil.example" },
      }),
      "https://geraiakun.id",
    ),
    false,
  )
})

test("fails closed for missing or malformed origins", () => {
  assert.equal(
    hasTrustedRequestOrigin(
      new Request("https://geraiakun.id/api/account/profile", { method: "PATCH" }),
      "https://geraiakun.id",
    ),
    false,
  )
  assert.equal(
    hasTrustedRequestOrigin(
      new Request("https://geraiakun.id/api/account/profile", {
        method: "PATCH",
        headers: { Origin: "not-a-url" },
      }),
      "https://geraiakun.id",
    ),
    false,
  )
})

test("returns one private forbidden response for an untrusted origin", async () => {
  const response = rejectUntrustedRequestOrigin(
    new Request("https://geraiakun.id/api/account/profile", {
      method: "PATCH",
      headers: { origin: "https://evil.example" },
    }),
    "https://geraiakun.id",
  )

  assert.ok(response)
  assert.equal(response.status, 403)
  assert.equal(response.headers.get("cache-control"), "private, no-store")
  assert.deepEqual(await response.json(), { error: "Forbidden origin" })
})

test("returns null for the configured application origin", () => {
  const response = rejectUntrustedRequestOrigin(
    new Request("https://geraiakun.id/api/account/profile", {
      method: "PATCH",
      headers: { origin: "https://geraiakun.id" },
    }),
    "https://geraiakun.id",
  )

  assert.equal(response, null)
})
