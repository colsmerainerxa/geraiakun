import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { NextRequest } from "next/server"
import proxy from "../src/proxy"

function nonceFrom(policy: string) {
  const match = policy.match(/'nonce-([^']+)'/)
  assert.ok(match)
  return match[1]
}

test("legacy login alias keeps its redirect and receives an enforced CSP", () => {
  const response = proxy(new NextRequest("https://geraiakun.id/login"))

  assert.equal(response.status, 307)
  assert.equal(response.headers.get("location"), "https://geraiakun.id/id/masuk")
  assert.ok(response.headers.get("content-security-policy"))
})

test("localized pages pass the same nonce policy upstream and downstream", () => {
  const response = proxy(new NextRequest("https://geraiakun.id/id/masuk"))
  const policy = response.headers.get("content-security-policy")

  assert.ok(policy)
  const nonce = nonceFrom(policy)
  assert.equal(response.headers.get("x-middleware-request-x-nonce"), nonce)
  assert.equal(response.headers.get("x-middleware-request-content-security-policy"), policy)
})

test("each rendered request receives a unique nonce", () => {
  const firstPolicy = proxy(new NextRequest("https://geraiakun.id/id/masuk")).headers.get(
    "content-security-policy",
  )
  const secondPolicy = proxy(new NextRequest("https://geraiakun.id/id/masuk")).headers.get(
    "content-security-policy",
  )

  assert.ok(firstPolicy)
  assert.ok(secondPolicy)
  assert.notEqual(nonceFrom(firstPolicy), nonceFrom(secondPolicy))
})

test("the request nonce reaches the next-themes bootstrap script", () => {
  const layout = readFileSync("src/app/[locale]/layout.tsx", "utf8")
  const providers = readFileSync("src/app/providers.tsx", "utf8")

  assert.match(layout, /import \{ headers \} from "next\/headers"/)
  assert.match(layout, /\(await headers\(\)\)\.get\("x-nonce"\)/)
  assert.match(layout, /<Providers nonce=\{nonce\}>/)
  assert.match(providers, /export function Providers\(\{ children, nonce \}/)
  assert.match(providers, /<ThemeProvider[\s\S]*?nonce=\{nonce\}/)
})
