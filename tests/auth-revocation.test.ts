import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import type { Prisma } from "../src/generated/prisma/client"
import { revokeAllUserAuth } from "../src/lib/server/trusted-devices"

test("global auth revocation invalidates every auth artifact exactly once", async () => {
  const calls: Array<{ target: string; args: unknown }> = []
  const tx = {
    user: {
      findUnique: async (args: unknown) => {
        calls.push({ target: "user.findUnique", args })
        return { email: "customer@example.com" }
      },
      update: async (args: unknown) => calls.push({ target: "user.update", args }),
    },
    trustedDevice: {
      updateMany: async (args: unknown) => calls.push({ target: "device.updateMany", args }),
    },
    loginOtpChallenge: {
      updateMany: async (args: unknown) => calls.push({ target: "challenge.updateMany", args }),
    },
    accountToken: {
      updateMany: async (args: unknown) => calls.push({ target: "token.updateMany", args }),
    },
  } as unknown as Prisma.TransactionClient
  const now = new Date("2026-07-16T00:00:00.000Z")

  await revokeAllUserAuth(tx, "user-id", now)

  assert.equal(calls.filter((call) => call.target === "user.update").length, 1)
  assert.deepEqual(calls.find((call) => call.target === "user.update")?.args, {
    where: { id: "user-id" },
    data: { sessionVersion: { increment: 1 } },
  })
  assert.equal(
    calls.some((call) => call.target === "device.updateMany"),
    true,
  )
  assert.equal(
    calls.some((call) => call.target === "challenge.updateMany"),
    true,
  )
  assert.equal(
    calls.some((call) => call.target === "token.updateMany"),
    true,
  )
})

test("password reset and both staff suspension paths call global revocation", async () => {
  const [tokens, action, route] = await Promise.all([
    readFile("src/lib/server/account-tokens.ts", "utf8"),
    readFile("src/app/actions/admin-team.ts", "utf8"),
    readFile("src/app/api/admin/team/route.ts", "utf8"),
  ])

  assert.match(tokens, /consumePasswordResetToken[\s\S]*revokeAllUserAuth\(tx, user\.id, now\)/)
  assert.match(action, /status === "suspended"[\s\S]*revokeAllUserAuth/)
  assert.match(route, /status === "suspended"[\s\S]*revokeAllUserAuth/)
})
