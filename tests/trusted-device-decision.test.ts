import assert from "node:assert/strict"
import test from "node:test"
import { deviceIsTrusted } from "../src/lib/server/trusted-devices"

const now = new Date("2026-07-16T00:00:00.000Z")
const active = {
  expiresAt: new Date(now.getTime() + 1),
  revokedAt: null,
  userAgentHash: "matching-user-agent",
}

test("only an active matching device is trusted", () => {
  assert.equal(deviceIsTrusted(active, "matching-user-agent", now), true)
  assert.equal(deviceIsTrusted({ ...active, expiresAt: now }, "matching-user-agent", now), false)
  assert.equal(deviceIsTrusted({ ...active, revokedAt: now }, "matching-user-agent", now), false)
  assert.equal(deviceIsTrusted(active, "different-user-agent", now), false)
})
