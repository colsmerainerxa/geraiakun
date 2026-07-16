import assert from "node:assert/strict"
import test from "node:test"
import { parseProfilePatch } from "../src/lib/server/account-profile"

test("normalizes the editable profile fields", () => {
  assert.deepEqual(
    parseProfilePatch({
      name: "  Aan   First  ",
      whatsapp: "0812 3456-7890",
    }),
    {
      name: "Aan First",
      whatsapp: "081234567890",
    },
  )
})

test("preserves an international phone prefix", () => {
  assert.deepEqual(parseProfilePatch({ whatsapp: "+62 812-3456-7890" }), {
    whatsapp: "+6281234567890",
  })
})

test("supports explicitly clearing WhatsApp", () => {
  assert.deepEqual(parseProfilePatch({ whatsapp: null }), { whatsapp: null })
  assert.deepEqual(parseProfilePatch({ whatsapp: "  " }), { whatsapp: null })
})

test("parses account-scoped notification preferences", () => {
  assert.deepEqual(
    parseProfilePatch({
      notifications: {
        orderUpdates: false,
        promos: true,
        ticketReplies: false,
        newsletter: true,
      },
    }),
    {
      notifications: {
        orderUpdates: false,
        promos: true,
        ticketReplies: false,
        newsletter: true,
      },
    },
  )
})

test("rejects invalid and misleading profile payloads", () => {
  assert.throws(() => parseProfilePatch({}), /editable field/i)
  assert.throws(() => parseProfilePatch({ whatsapp: "123" }), /WhatsApp/i)
  assert.throws(() => parseProfilePatch({ whatsapp: "0812<script>" }), /WhatsApp/i)
  assert.throws(() => parseProfilePatch({ name: " A " }), /name/i)
  assert.throws(() => parseProfilePatch({ role: "ADMIN" }), /unrecognized/i)
})
