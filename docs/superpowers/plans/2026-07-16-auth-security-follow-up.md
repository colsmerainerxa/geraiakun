# Auth Security Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining session-CSRF, login-throttling, password-policy, CSP, and browser-test isolation gaps while preserving the current Auth.js, Google OAuth, trusted-device, Gmail SMTP, and bilingual user flows.

**Architecture:** Keep security checks at the boundary that owns them. Cookie-authenticated Route Handlers validate Origin before auth or body parsing, credential login reserves both identity and trusted-IP capacity, password creation uses one 12-character server policy mirrored by the UI, Playwright explicitly replaces production integrations, and the Next.js Proxy issues one nonce/CSP pair per rendered request.

**Tech Stack:** Next.js 16.2.9 App Router and Proxy, next-intl 4, Auth.js 5 beta, Prisma 7/PostgreSQL, Zod 4, React 19, Node test runner through tsx, Playwright 1.61, Biome 2.5.

---

## Execution Notes

- The approved design is `docs/superpowers/specs/2026-07-16-auth-security-follow-up-design.md`.
- This worktree contains necessary pre-existing, overlapping auth edits. Do not reset, stash, replace, or copy it to another worktree.
- Do not create implementation commits because whole-file staging could capture unrelated user changes. Use focused test output, `git diff --check`, and touched-file diffs as checkpoints. The isolated plan document may be committed by itself.
- Never print `.env.local` secrets. Playwright values below are Cloudflare's documented public test credentials, not production secrets.
- Signed Midtrans webhooks and bearer-protected cron handlers remain outside browser Origin enforcement.

## Task 1: Standardize Origin Rejection and Inventory Session Mutations

**Files:**

- Modify: `src/lib/server/request-security.ts`
- Modify: `tests/request-security.test.ts`
- Create: `tests/authenticated-mutation-origin.test.ts`
- Modify: `package.json`
- Modify: `src/app/api/account/devices/route.ts`
- Modify: `src/app/api/account/profile/route.ts`
- Modify: `src/app/api/account/refunds/route.ts`
- Modify: `src/app/api/account/tickets/route.ts`
- Modify: `src/app/api/account/wishlist/route.ts`
- Modify: `src/app/api/catalog/reviews/route.ts`
- Modify: `src/app/api/payments/route.ts`
- Modify: `src/app/api/admin/credentials/route.ts`
- Modify: `src/app/api/admin/customers/route.ts`
- Modify: `src/app/api/admin/fulfillment/route.ts`
- Modify: `src/app/api/admin/orders/route.ts`
- Modify: `src/app/api/admin/products/route.ts`
- Modify: `src/app/api/admin/products/[id]/route.ts`
- Modify: `src/app/api/admin/promos/route.ts`
- Modify: `src/app/api/admin/refunds/route.ts`
- Modify: `src/app/api/admin/resellers/route.ts`
- Modify: `src/app/api/admin/reviews/route.ts`
- Modify: `src/app/api/admin/risk/route.ts`
- Modify: `src/app/api/admin/team/route.ts`
- Modify: `src/app/api/admin/tickets/route.ts`

- [ ] Add a failing helper test to `tests/request-security.test.ts`:

```ts
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
```

- [ ] Create a failing source-coverage test that enumerates the 20 session-authenticated route files above, counts every exported `POST`, `PUT`, `PATCH`, and `DELETE`, and requires one `rejectUntrustedRequestOrigin(` call at the beginning of each handler. Assert that `src/app/api/webhooks/midtrans/route.ts` is excluded explicitly.
- [ ] Add both tests to `test:auth`, then run:

```powershell
pnpm exec tsx --test tests/request-security.test.ts tests/authenticated-mutation-origin.test.ts
```

Expected: failure because the helper does not exist and most handlers have no guard.

- [ ] Implement `rejectUntrustedRequestOrigin(request, applicationUrl): Response | null` in `request-security.ts`. It returns `null` for the canonical Origin and otherwise returns JSON `{ error: "Forbidden origin" }`, status `403`, and `Cache-Control: private, no-store`.
- [ ] Replace the three existing ad-hoc guards and insert the helper at the first executable line of every listed mutation handler. Import `serverEnv` and the helper where required. A multi-method file must guard every method independently.
- [ ] Run the focused tests again and require all pass.
- [ ] Run `pnpm exec biome check` on the helper, test, package manifest, and all touched Route Handlers; apply only formatting/safe fixes to these files.

## Task 2: Add Trusted-IP Capacity to Password Login

**Files:**

- Modify: `tests/auth-security.test.ts`
- Modify: `src/lib/server/auth-security.ts`
- Modify: `docs/backend-setup.md`

- [ ] Change the durable-policy test to require:

```ts
assert.deepEqual(AUTH_RATE_POLICIES.login, {
  identity: { limit: 5, windowMs: 15 * 60_000 },
  ip: { limit: 30, windowMs: 15 * 60_000 },
})
```

- [ ] Run `pnpm exec tsx --test tests/auth-security.test.ts` and confirm RED because login has no IP policy.
- [ ] Add the approved login IP window in `AUTH_RATE_POLICIES`. Do not change `getTrustedClientIp`: forwarded headers remain ignored unless `AUTH_TRUST_PROXY_HEADERS=true`.
- [ ] Document that production enables trusted proxy headers only when the edge overwrites the forwarding headers; otherwise leave it false.
- [ ] Re-run the focused test and require GREEN.

## Task 3: Enforce 12-Character Passwords for New Credentials

**Files:**

- Modify: `tests/auth-actions.test.ts`
- Modify: `tests/auth-challenge.test.tsx`
- Modify: `tests/auth-lifecycle-browser.spec.ts`
- Modify: `src/lib/server/auth-flows.ts`
- Modify: `src/components/storefront/auth-form.tsx`
- Modify: `src/components/storefront/auth-recovery-view.tsx`
- Inspect: `src/lib/server/staff-invite.ts`
- Inspect: `src/components/admin/admin-team-view.tsx`

- [ ] Update server-flow tests so 11 characters (`Secure12345`) fail and 12 characters (`Secure123456`) pass for registration and reset. Keep one credential-login fixture with a shorter existing password to prove backward-compatible login verification.
- [ ] Add rendered-form assertions that registration and reset inputs use `minLength={12}` and bilingual messages state 12 characters.
- [ ] Run:

```powershell
pnpm exec tsx --test tests/auth-actions.test.ts tests/auth-challenge.test.tsx
```

Expected: failure under the current minimum of eight.

- [ ] Change the shared Zod password-creation schema to `.min(12)`, preserving max 128, one-letter, and one-digit rules.
- [ ] Mirror the rule and Indonesian/English messages in registration, password reset, and staff-invite UI/server paths. Do not tighten the credential-login input beyond its existing non-empty/max-128 validation.
- [ ] Update only registration/reset E2E fixture passwords to 12+ characters.
- [ ] Re-run focused unit/render tests and require GREEN.

## Task 4: Isolate Playwright from Production SMTP and Turnstile

**Files:**

- Create: `tests/playwright-config.test.ts`
- Modify: `playwright.config.ts`
- Modify: `package.json`

- [ ] Add a failing config test by importing the default Playwright config and asserting the child `webServer.env` contains exactly:

```ts
EMAIL_TRANSPORT: "ethereal"
EMAIL_PREVIEW_ENABLED: "true"
NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA"
TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA"
TURNSTILE_ALLOWED_HOSTNAMES: "localhost"
```

- [ ] Add the test to `test:auth`; run `pnpm exec tsx --test tests/playwright-config.test.ts` and confirm RED for missing Turnstile overrides.
- [ ] Add the explicit test values after `...process.env` in `playwright.config.ts`, ensuring `.env.local` cannot win.
- [ ] Re-run the focused test and require GREEN.

## Task 5: Enforce a Per-Request Nonce CSP

**Files:**

- Create: `src/lib/server/content-security-policy.ts`
- Create: `tests/content-security-policy.test.ts`
- Create: `tests/proxy-security.test.ts`
- Modify: `src/proxy.ts`
- Modify: `next.config.ts`
- Modify: `package.json`

- [ ] Add pure policy-builder tests that require a supplied nonce, `strict-dynamic`, Cloudflare Turnstile in `script-src`, `connect-src`, and `frame-src`, the current image hosts, and the locked-down `object-src`, `base-uri`, `form-action`, and `frame-ancestors` directives.
- [ ] Assert development includes `unsafe-eval` and omits `upgrade-insecure-requests`; production does the inverse.
- [ ] Add Proxy tests using `NextRequest` that require:
  - `/login` still redirects to `/id/masuk` and carries CSP;
  - a localized page response carries CSP;
  - two requests receive different nonces;
  - the response nonce matches the policy passed upstream to Next.js.
- [ ] Add both tests to `test:auth`; run them and confirm RED because the builder and nonce propagation do not exist.
- [ ] Implement a pure `buildContentSecurityPolicy(nonce, nodeEnv)` and a cryptographically random base64 nonce generator. Normalize whitespace to a single-line header.
- [ ] In `src/proxy.ts`, clone the incoming request headers, set `x-nonce` and `Content-Security-Policy`, pass the modified `NextRequest` to `next-intl`, then set the identical CSP on its redirect/rewrite/response. Apply the same response policy to legacy alias redirects.
- [ ] Keep API, Next internals, files with extensions, and metadata image routes outside the matcher.
- [ ] Remove only obsolete `X-XSS-Protection` from `next.config.ts`; retain the remaining static security headers.
- [ ] Re-run focused CSP/Proxy tests and require GREEN.

## Task 6: Full Verification and Runtime Simulation

**Files:**

- Verify all files changed above
- Clean generated artifacts only: `test-results/`, Playwright traces/screenshots, and test users created by the auth lifecycle suite

- [ ] Run formatting and static checks:

```powershell
pnpm exec biome check src/lib/server/request-security.ts src/lib/server/content-security-policy.ts src/lib/server/auth-security.ts src/lib/server/auth-flows.ts src/proxy.ts next.config.ts playwright.config.ts tests/request-security.test.ts tests/authenticated-mutation-origin.test.ts tests/content-security-policy.test.ts tests/proxy-security.test.ts tests/playwright-config.test.ts tests/auth-security.test.ts tests/auth-actions.test.ts tests/auth-challenge.test.tsx
pnpm exec tsc --noEmit
pnpm db:validate
pnpm exec prisma migrate status
```

- [ ] Run all unit suites:

```powershell
pnpm test:auth
pnpm test:articles
```

- [ ] Stop only the process serving port 3000 before production build/E2E if it holds the Next.js lock. Run:

```powershell
pnpm build
pnpm test:e2e
pnpm exec playwright test --project=mobile-chromium --workers=1
```

Require all Chromium and mobile auth flows pass using Ethereal and Cloudflare test credentials.

- [ ] Start `pnpm dev --port 3000`, wait for HTTP 200, then verify:
  - `/id/masuk`, `/id/daftar`, and `/id/akun` return an enforced CSP;
  - repeated page requests have different nonces;
  - hostile and missing Origins return `403` on representative customer/admin mutations before session/body errors;
  - canonical Origin reaches normal auth handling (`401` when logged out);
  - Gmail transporter verification succeeds without printing credentials;
  - Cloudflare Siteverify accepts the configured secret format and rejects a dummy token;
  - browser console has no CSP error on registration, credential login, Google login entry, recovery, and account settings.

- [ ] Remove test users identified by the suite's unique test-email prefix and delete Playwright artifacts. Do not delete user data by broad domain or timestamp filters.
- [ ] Run `git diff --check`, inspect the final touched-file diff, and confirm no `.env.local` value or other secret appears.
- [ ] Leave the development server running at `http://localhost:3000` and report residual infrastructure risks separately: trusted-proxy enablement, TLS certificate verification for PostgreSQL, outer Cloudflare rate limits, and the upstream Next.js/PostCSS dependency advisory.
