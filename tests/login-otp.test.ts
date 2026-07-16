import assert from "node:assert/strict"
import test from "node:test"
import { challengeDecision } from "../src/lib/server/login-otp"

const now = new Date("2026-07-16T00:00:00.000Z")
const activeChallenge = {
  consumedAt: null,
  expiresAt: new Date(now.getTime() + 60_000),
  failedAttempts: 0,
  deviceHash: "device-hash",
  userAgentHash: "ua-hash",
}
const matchingContext = { deviceHash: "device-hash", userAgentHash: "ua-hash" }

test("challenge policy rejects expiry, mismatch, consumption, and five failures", () => {
  assert.equal(challengeDecision(activeChallenge, matchingContext, now), "allow")
  assert.equal(
    challengeDecision({ ...activeChallenge, failedAttempts: 5 }, matchingContext, now),
    "exhausted",
  )
  assert.equal(
    challengeDecision({ ...activeChallenge, expiresAt: now }, matchingContext, now),
    "expired",
  )
  assert.equal(
    challengeDecision(activeChallenge, { ...matchingContext, deviceHash: "other" }, now),
    "mismatch",
  )
  assert.equal(
    challengeDecision({ ...activeChallenge, consumedAt: now }, matchingContext, now),
    "invalid",
  )
})
