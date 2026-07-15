# Auth and Profile Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make customer profile data persist correctly and harden credentials registration, verification, login, and password recovery against abuse.

**Architecture:** Keep Auth.js and the existing App Router boundaries, but move account settings to database-backed state and add focused server-only modules for validation, durable throttling, account tokens, Turnstile, and mail delivery. Ethereal captures development mail, SMTP handles production, and all public auth mutations require server-side verification plus durable limits.

**Tech Stack:** Next.js 16 App Router, React 19, Auth.js 5 beta, Prisma 7/PostgreSQL, Zod 4, Nodemailer, React Turnstile, TanStack Query, Node test runner, Playwright.

---

### Task 1: Establish Dependencies and Failing Profile Contract Tests

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `playwright.config.ts`
- Create: `tests/account-profile.test.ts`
- Create: `src/lib/server/account-profile.ts`

- [ ] **Step 1: Install runtime and test dependencies**

Run:

```powershell
rtk pnpm add nodemailer @marsidev/react-turnstile
rtk pnpm add -D @types/nodemailer @playwright/test
```

Expected: package manifest and lockfile include the four packages without peer-dependency errors.

Create `playwright.config.ts` with Chromium desktop and mobile projects, `baseURL: "http://127.0.0.1:3000"`, retained traces on failure, and a `webServer` command that reuses the existing local development server. Add scoped `test:auth` and `test:e2e` scripts to `package.json`.

- [ ] **Step 2: Write failing profile normalization tests**

Create tests covering a trimmed name, Indonesian phone normalization, explicit `null` clearing, invalid phone rejection, notification preference parsing, and empty-payload rejection. The intended API is:

```ts
import { parseProfilePatch } from "../src/lib/server/account-profile"

assert.deepEqual(parseProfilePatch({ name: "  Aan First  ", whatsapp: "0812 3456-7890" }), {
  name: "Aan First",
  whatsapp: "081234567890",
})
assert.deepEqual(parseProfilePatch({ whatsapp: null }), { whatsapp: null })
assert.throws(() => parseProfilePatch({}))
```

- [ ] **Step 3: Run the profile test and verify RED**

Run: `rtk pnpm tsx --test tests/account-profile.test.ts`

Expected: FAIL because `account-profile.ts` or `parseProfilePatch` does not exist.

- [ ] **Step 4: Implement the minimal strict profile contract**

Add a strict Zod schema that accepts `name`, nullable `whatsapp`, and a complete or partial notification preferences object. Normalize whitespace and phone separators, reject unsupported characters, and reject payloads with no editable keys.

- [ ] **Step 5: Run the profile test and verify GREEN**

Run: `rtk pnpm tsx --test tests/account-profile.test.ts`

Expected: all profile contract tests pass.

### Task 2: Add Database-Backed Profile, Tokens, Throttling, and Session Versioning

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260715160000_auth_profile_hardening/migration.sql`
- Modify: `src/generated/prisma/**` through Prisma generation
- Create: `tests/auth-security.test.ts`
- Create: `src/lib/server/auth-security.ts`

- [ ] **Step 1: Write failing security primitive tests**

Test that identifiers are HMAC-hashed, raw email/IP data is absent from hashes, generated account tokens have at least 256 bits of entropy, stored token hashes differ from raw tokens, purposes change hashes, expired tokens fail, and rate policies return deterministic retry durations.

```ts
const token = createAccountToken("EMAIL_VERIFY", "pepper")
assert.notEqual(token.raw, token.hash)
assert.equal(token.hash, hashAccountToken(token.raw, "EMAIL_VERIFY", "pepper"))
assert.equal(checkRateWindow([now - 1_000, now - 2_000], 2, 60_000, now).allowed, false)
```

- [ ] **Step 2: Run security tests and verify RED**

Run: `rtk pnpm tsx --test tests/auth-security.test.ts`

Expected: FAIL because the security module does not exist.

- [ ] **Step 3: Implement pure token, identifier, and policy helpers**

Use `randomBytes(32)`, HMAC-SHA256 with `AUTH_TOKEN_PEPPER`, constant-time comparison where applicable, and explicit policy constants for login, registration, reset, and resend.

- [ ] **Step 4: Run security tests and verify GREEN**

Run: `rtk pnpm tsx --test tests/auth-security.test.ts`

Expected: all security primitive tests pass.

- [ ] **Step 5: Extend the Prisma schema and migration**

Add notification booleans to `CustomerProfile`, `sessionVersion Int @default(0)` to `User`, a dedicated `AccountToken` model, and an indexed `AuthSecurityEvent` model. The SQL migration must use defaults so existing users and profiles remain valid.

- [ ] **Step 6: Validate and generate Prisma artifacts**

Run:

```powershell
rtk pnpm prisma validate
rtk pnpm prisma generate
```

Expected: both commands exit 0.

- [ ] **Step 7: Apply the migration to the configured development database**

Run: `rtk pnpm prisma migrate deploy`

Expected: migration `20260715160000_auth_profile_hardening` applies once without data-loss warnings.

### Task 3: Fix the Authenticated Profile Boundary

**Files:**
- Modify: `src/app/api/account/profile/route.ts`
- Modify: `src/lib/api/queries.ts`
- Modify: `src/components/storefront/account-settings-view.tsx`
- Modify: `src/stores/user.ts` or delete it when no imports remain
- Create: `tests/account-profile-browser.spec.ts`

- [ ] **Step 1: Write a failing Playwright regression test for the reported bug**

Seed one uniquely named credentials user, log in, edit name and WhatsApp, save, reload, reopen Settings, and assert the two inputs contain the new canonical values. Add a second assertion that setting WhatsApp empty persists after another reload. Clean up only the uniquely prefixed test user.

- [ ] **Step 2: Run the browser regression and verify RED**

Run: `rtk pnpm playwright test tests/account-profile-browser.spec.ts --project=chromium --workers=1`

Expected: FAIL because the reloaded WhatsApp value is empty.

- [ ] **Step 3: Make profile writes atomic and canonical**

The authenticated PATCH route must parse `parseProfilePatch`, update `User` and `CustomerProfile` in one transaction, support explicit phone clearing, return the complete canonical profile, reject no-op payloads, and set `Cache-Control: private, no-store`. GET returns the same account contract and notification preferences.

- [ ] **Step 4: Replace stale form state and global account persistence**

Use controlled React values initialized from the query result. Send every editable value explicitly. Update TanStack Query with the PATCH response. Persist notification switches through the profile API with optimistic rollback. Remove account/recovery dependence on the global persisted user store and clear its obsolete localStorage key on logout.

- [ ] **Step 5: Run unit and browser tests and verify GREEN**

Run:

```powershell
rtk pnpm tsx --test tests/account-profile.test.ts
rtk pnpm playwright test tests/account-profile-browser.spec.ts --project=chromium --workers=1
```

Expected: profile contract and refresh/clear regressions pass.

### Task 4: Add Turnstile and Durable Abuse Protection

**Files:**
- Modify: `.env.example`
- Modify: `src/lib/server/env.ts`
- Create: `tests/turnstile.test.ts`
- Create: `src/lib/server/turnstile.ts`
- Create: `src/components/storefront/auth-challenge.tsx`

- [ ] **Step 1: Write failing Turnstile validation tests**

Use an injected fetch implementation to test missing tokens, Siteverify failure, timeout, action mismatch, hostname mismatch, and success. Confirm production fails closed when keys or allowed hostnames are absent.

- [ ] **Step 2: Run Turnstile tests and verify RED**

Run: `rtk pnpm tsx --test tests/turnstile.test.ts`

Expected: FAIL because the Turnstile module does not exist.

- [ ] **Step 3: Implement server-side Siteverify validation**

Post `secret`, `response`, and optional trusted remote IP to Cloudflare with an abort timeout. Validate expected action and production hostname. Use only Cloudflare's documented test keys outside production and never expose the secret key through a public variable.

- [ ] **Step 4: Implement the reusable client challenge**

Wrap `@marsidev/react-turnstile` with `onSuccess`, expiry/error clearing, action, localized accessible status, and an imperative reset used after every submission attempt.

- [ ] **Step 5: Implement durable request accounting**

Add server functions that count indexed `AuthSecurityEvent` rows inside policy windows, create events with HMAC-hashed identity/IP keys, return retry metadata, clear active login failures after success, and opportunistically delete events older than retention.

- [ ] **Step 6: Run Turnstile and security tests and verify GREEN**

Run: `rtk pnpm tsx --test tests/turnstile.test.ts tests/auth-security.test.ts`

Expected: all challenge and policy tests pass.

### Task 5: Add Ethereal/SMTP Mail and Hashed Account Tokens

**Files:**
- Create: `tests/auth-mail.test.ts`
- Create: `src/lib/server/auth-mail.ts`
- Create: `src/lib/server/account-tokens.ts`
- Modify: `.env.example`
- Modify: `src/lib/server/env.ts`

- [ ] **Step 1: Write failing localized mail-template tests**

Test Indonesian and English verification/reset subjects, plain-text alternatives, escaped display names, safe configured-origin links, and rejection of attacker-controlled origins.

- [ ] **Step 2: Run mail tests and verify RED**

Run: `rtk pnpm tsx --test tests/auth-mail.test.ts`

Expected: FAIL because the mail module does not exist.

- [ ] **Step 3: Implement transport selection and templates**

Cache one Ethereal test-account promise outside production. Configure SMTP only from validated server environment values in production. Verify transport readiness on first use. Return a preview URL only for explicitly enabled non-production Ethereal mode.

- [ ] **Step 4: Implement token issue and consumption repositories**

Issue one active token per email/purpose, store only the purpose-bound hash, and consume it transactionally with verification/password updates. Password reset increments `sessionVersion` and never changes `emailVerified`.

- [ ] **Step 5: Run mail and security tests and verify GREEN**

Run: `rtk pnpm tsx --test tests/auth-mail.test.ts tests/auth-security.test.ts`

Expected: all mail and token tests pass.

### Task 6: Rework Registration, Verification, Login, and Recovery

**Files:**
- Modify: `src/app/actions/auth.ts`
- Modify: `src/auth.ts`
- Create: `src/lib/server/auth-flows.ts`
- Modify: `src/components/storefront/auth-form.tsx`
- Modify: `src/components/storefront/auth-recovery-view.tsx`
- Modify: `src/app/[locale]/(storefront)/verifikasi-email/page.tsx`
- Modify: `src/app/[locale]/(storefront)/reset-sandi/page.tsx`
- Modify: `src/messages/id.json`
- Modify: `src/messages/en.json`
- Create: `tests/auth-actions.test.ts`

- [ ] **Step 1: Write failing auth orchestration tests**

With injected repositories/transports, test registration requiring Turnstile, consistent password policy, generic reset responses, unverified-login rejection after a correct password, single-use verification, reset not verifying email, session-version increment, and retry metadata.

- [ ] **Step 2: Run auth action tests and verify RED**

Run: `rtk pnpm tsx --test tests/auth-actions.test.ts`

Expected: FAIL against the current actions.

- [ ] **Step 3: Implement verified credentials lifecycle**

Registration creates an unverified user and sends verification mail instead of auto-login. Credentials authorization applies durable failure limits, verifies scrypt, reports the unverified state only after a valid password, and places `sessionVersion` in JWT state. JWT/session callbacks reject version-mismatched sessions and refresh canonical name/role data.

- [ ] **Step 4: Implement recovery lifecycle**

Reset and resend validate Turnstile, use generic public responses, issue hashed tokens only for eligible accounts, deliver localized mail, and expose development preview URLs only under the explicit preview flag.

- [ ] **Step 5: Update bilingual UI states and autocomplete**

Add check-email, preview, challenge, throttled, expired, service-unavailable, and verified states in both locales. Use `name`, `email`, `current-password`, and `new-password` autocomplete values. Reset Turnstile after attempts.

- [ ] **Step 6: Run auth tests and verify GREEN**

Run: `rtk pnpm tsx --test tests/auth-actions.test.ts tests/auth-mail.test.ts tests/turnstile.test.ts`

Expected: all auth lifecycle tests pass.

### Task 7: Full Browser Audit, Cleanup, and Production Checks

**Files:**
- Create: `tests/auth-lifecycle-browser.spec.ts`
- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `docs/backend-setup.md`

- [ ] **Step 1: Add the complete Playwright lifecycle suite**

Cover registration with test Turnstile, Ethereal preview verification, blocked pre-verification login, successful post-verification login, profile save/refresh/clear, account-scoped preferences, logout, protected-route redirect, unauthenticated profile `401`, second-account isolation, password reset, old-password rejection, old-session invalidation, rate limiting, and Indonesian/English desktop/mobile checks.

- [ ] **Step 2: Run the lifecycle suite and fix only observed failures**

Run: `rtk pnpm playwright test tests/auth-lifecycle-browser.spec.ts --project=chromium --workers=1`

Expected: all lifecycle scenarios pass with no application console errors.

- [ ] **Step 3: Clean test fixtures**

Delete only users, tokens, and events carrying the unique `codex.auth.audit.` test prefix or hashes recorded by the test harness. Confirm the user's Google account and existing profile rows are unchanged.

- [ ] **Step 4: Run the complete automated verification**

Run:

```powershell
rtk pnpm tsx --test tests/account-profile.test.ts tests/auth-security.test.ts tests/turnstile.test.ts tests/auth-mail.test.ts tests/auth-actions.test.ts
rtk pnpm test:articles
rtk pnpm biome check src tests prisma/schema.prisma
rtk pnpm tsc --noEmit
rtk pnpm prisma validate
rtk pnpm build
rtk pnpm playwright test --project=chromium --workers=1
```

Expected: every command exits 0, all tests pass, and build completes.

- [ ] **Step 5: Review the final diff and security checklist**

Confirm no secret values, raw account tokens, raw email/IP rate-limit keys, Ethereal credentials, unrelated files, or test-user records remain. Confirm production rejects Ethereal/test Turnstile configuration.

- [ ] **Step 6: Commit task-owned files only**

Stage the explicit auth/profile files, migration, tests, dependency manifests, messages, and documentation. Do not stage unrelated dirty-worktree changes.

```powershell
rtk git commit -m "fix: harden auth and persist account settings"
```

Expected: one scoped implementation commit after fresh verification.
