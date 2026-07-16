import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import test from "node:test"

const authenticatedMutationRoutes = [
  "src/app/api/account/devices/route.ts",
  "src/app/api/account/profile/route.ts",
  "src/app/api/account/refunds/route.ts",
  "src/app/api/account/tickets/route.ts",
  "src/app/api/account/wishlist/route.ts",
  "src/app/api/catalog/reviews/route.ts",
  "src/app/api/payments/route.ts",
  "src/app/api/admin/credentials/route.ts",
  "src/app/api/admin/customers/route.ts",
  "src/app/api/admin/fulfillment/route.ts",
  "src/app/api/admin/orders/route.ts",
  "src/app/api/admin/products/route.ts",
  "src/app/api/admin/products/[id]/route.ts",
  "src/app/api/admin/promos/route.ts",
  "src/app/api/admin/refunds/route.ts",
  "src/app/api/admin/resellers/route.ts",
  "src/app/api/admin/reviews/route.ts",
  "src/app/api/admin/risk/route.ts",
  "src/app/api/admin/team/route.ts",
  "src/app/api/admin/tickets/route.ts",
] as const

const excludedNonBrowserMutations = ["src/app/api/webhooks/midtrans/route.ts"] as const
const mutationExportSource = "export async function (?:POST|PUT|PATCH|DELETE)\\b"
const originGuardSource = "rejectUntrustedRequestOrigin\\((?:req|request), serverEnv\\.APP_URL\\)"

function sourceFor(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

test("inventories signed non-browser mutations separately", () => {
  assert.deepEqual(excludedNonBrowserMutations, ["src/app/api/webhooks/midtrans/route.ts"])
  assert.match(sourceFor(excludedNonBrowserMutations[0]), new RegExp(mutationExportSource))
  assert.equal(authenticatedMutationRoutes.includes(excludedNonBrowserMutations[0] as never), false)
})

for (const relativePath of authenticatedMutationRoutes) {
  test(`${relativePath} validates Origin before session or body work`, () => {
    const source = sourceFor(relativePath)
    const exports = [...source.matchAll(new RegExp(mutationExportSource, "g"))]
    const guards = [...source.matchAll(new RegExp(originGuardSource, "g"))]

    assert.ok(exports.length > 0, `${relativePath} must export at least one mutation`)
    assert.equal(
      guards.length,
      exports.length,
      `${relativePath} must guard each exported mutation exactly once`,
    )

    for (let index = 0; index < exports.length; index += 1) {
      const segment = source.slice(exports[index].index, exports[index + 1]?.index ?? source.length)
      const guardIndex = segment.search(new RegExp(originGuardSource))
      const sensitiveIndexes = [
        segment.indexOf("await auth("),
        segment.indexOf("await request.json("),
        segment.indexOf("await req.json("),
      ].filter((position) => position >= 0)
      const firstSensitiveIndex = Math.min(...sensitiveIndexes, Number.POSITIVE_INFINITY)

      assert.ok(guardIndex >= 0, `${relativePath} mutation ${index + 1} is missing its guard`)
      assert.ok(
        guardIndex < firstSensitiveIndex,
        `${relativePath} mutation ${index + 1} must reject Origin before auth or body parsing`,
      )
    }
  })
}
