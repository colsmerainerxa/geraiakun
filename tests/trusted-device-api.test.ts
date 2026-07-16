import assert from "node:assert/strict"
import test from "node:test"
import { parseDeviceMutation } from "../src/lib/server/trusted-device-policy"

test("device mutation accepts only one-device or all-device revocation", () => {
  assert.deepEqual(parseDeviceMutation({ mode: "one", deviceId: "device-id" }), {
    mode: "one",
    deviceId: "device-id",
  })
  assert.deepEqual(parseDeviceMutation({ mode: "all" }), { mode: "all" })
  assert.throws(() => parseDeviceMutation({ mode: "one" }))
  assert.throws(() => parseDeviceMutation({ mode: "all", deviceId: "unexpected" }))
  assert.throws(() => parseDeviceMutation({ mode: "one", deviceId: "" }))
})
