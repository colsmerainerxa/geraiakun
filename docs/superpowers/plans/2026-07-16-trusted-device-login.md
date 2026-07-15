# Trusted Device and Email OTP Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require Google SMTP email OTP on the first credentials login from a browser, trust that browser for thirty days, and provide secure device revocation without adding OTP to Google OAuth.

**Architecture:** A Server Action validates email/password and either issues a short-lived login grant for a trusted browser or sends a hashed six-digit OTP for a new browser. Auth.js Credentials accepts only a single-use grant, while an HttpOnly browser secret and user-scoped database HMAC provide revocable device trust. Password reset, staff suspension, and global sign-out revoke sessions, grants, challenges, and device trust atomically.

**Tech Stack:** Next.js 16 Server Actions and async cookies API, Auth.js v5 credentials/JWT, Prisma 7/PostgreSQL, Node crypto, Nodemailer with Google SMTP/Ethereal, Zod 4, TanStack Query, next-intl, UAParser.js, Playwright, Node test runner.

**Dirty-worktree constraint:** Existing auth, profile, schema, message, and package files already contain user changes. Inspect every diff and never stage an existing file wholesale when that would include unrelated work. Commit new standalone files only when isolated; otherwise keep verified implementation changes uncommitted and report them precisely.

---

### Task 1: Baseline and deterministic email-test environment

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `playwright.config.ts`
- Test: existing `tests/*`

- [ ] **Step 1: Record the fresh baseline**

Run:

```powershell
pnpm test:auth
pnpm test:articles
pnpm tsc --noEmit
pnpm prisma validate
```

Expected: 30 auth tests, 15 article tests, TypeScript, and Prisma all pass before feature work.

- [ ] **Step 2: Add the server-side User-Agent parser**

Run:

```powershell
pnpm add ua-parser-js
```

Expected: `ua-parser-js` appears in dependencies and the lockfile changes without unrelated upgrades.

- [ ] **Step 3: Isolate Playwright from real Gmail SMTP**

Change Playwright to use port 3100, never reuse a developer server, and override auth mail only for its child process:

```ts
const testOrigin = "http://localhost:3100"

export default defineConfig({
  use: { baseURL: testOrigin, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: {
    command: "pnpm dev --port 3100",
    url: testOrigin,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      APP_URL: testOrigin,
      AUTH_URL: testOrigin,
      EMAIL_TRANSPORT: "ethereal",
      EMAIL_PREVIEW_ENABLED: "true",
    },
  },
})
```

Replace hard-coded `http://localhost:3000` Origin headers in browser tests with `test.info().project.use.baseURL` or `new URL(page.url()).origin`.

- [ ] **Step 4: Verify test discovery without sending mail**

Run:

```powershell
pnpm exec playwright test --list --project=chromium
```

Expected: the existing seven Chromium tests are listed and no web server is started.

- [ ] **Step 5: Checkpoint the diff**

Run `git diff -- package.json pnpm-lock.yaml playwright.config.ts`. Do not commit mixed pre-existing changes.

---

### Task 2: Prisma models and migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260716120000_trusted_device_login/migration.sql`
- Create: `tests/trusted-device-schema.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing schema contract test**

```ts
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("schema contains trusted devices, OTP challenges, and login grants", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8")
  assert.match(schema, /LOGIN_GRANT/)
  assert.match(schema, /LOGIN_OTP_SEND/)
  assert.match(schema, /model TrustedDevice/)
  assert.match(schema, /@@unique\(\[userId, deviceHash\]\)/)
  assert.match(schema, /model LoginOtpChallenge/)
})
```

Add the test to `test:auth`.

- [ ] **Step 2: Run the test to verify RED**

Run: `pnpm exec tsx --test tests/trusted-device-schema.test.ts`

Expected: FAIL because the enum values and models do not exist.

- [ ] **Step 3: Add exact Prisma contracts**

Extend the enums and `User` relations, then add:

```prisma
enum AccountTokenPurpose {
  EMAIL_VERIFY
  PASSWORD_RESET
  STAFF_INVITE
  LOGIN_GRANT
}

enum AuthSecurityAction {
  LOGIN
  REGISTER
  PASSWORD_RESET
  VERIFICATION_RESEND
  LOGIN_OTP_SEND
  LOGIN_OTP_VERIFY
}

model TrustedDevice {
  id            String    @id @default(cuid())
  userId        String
  deviceHash    String
  userAgentHash String
  label         String
  expiresAt     DateTime
  revokedAt     DateTime?
  createdAt     DateTime  @default(now())
  lastUsedAt    DateTime  @default(now())
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deviceHash])
  @@index([userId, revokedAt, expiresAt])
  @@index([expiresAt])
}

model LoginOtpChallenge {
  id             String    @id @default(cuid())
  userId         String
  deviceHash     String
  userAgentHash  String
  codeHash       String
  locale         String
  failedAttempts Int       @default(0)
  sendCount      Int       @default(1)
  lastSentAt     DateTime  @default(now())
  expiresAt      DateTime
  consumedAt     DateTime?
  createdAt      DateTime  @default(now())
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([expiresAt])
}
```

Add `trustedDevices TrustedDevice[]` and `loginOtpChallenges LoginOtpChallenge[]` to `User`.

- [ ] **Step 4: Write and apply the migration**

Create `prisma/migrations/20260716120000_trusted_device_login/migration.sql` with:

```sql
ALTER TYPE "AccountTokenPurpose" ADD VALUE 'LOGIN_GRANT';
ALTER TYPE "AuthSecurityAction" ADD VALUE 'LOGIN_OTP_SEND';
ALTER TYPE "AuthSecurityAction" ADD VALUE 'LOGIN_OTP_VERIFY';

CREATE TABLE "TrustedDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceHash" TEXT NOT NULL,
  "userAgentHash" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "LoginOtpChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceHash" TEXT NOT NULL,
  "userAgentHash" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "sendCount" INTEGER NOT NULL DEFAULT 1,
  "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginOtpChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoginOtpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TrustedDevice_userId_deviceHash_key" ON "TrustedDevice"("userId", "deviceHash");
CREATE INDEX "TrustedDevice_userId_revokedAt_expiresAt_idx" ON "TrustedDevice"("userId", "revokedAt", "expiresAt");
CREATE INDEX "TrustedDevice_expiresAt_idx" ON "TrustedDevice"("expiresAt");
CREATE INDEX "LoginOtpChallenge_userId_createdAt_idx" ON "LoginOtpChallenge"("userId", "createdAt");
CREATE INDEX "LoginOtpChallenge_expiresAt_idx" ON "LoginOtpChallenge"("expiresAt");
```

Then run:

```powershell
pnpm prisma migrate deploy
pnpm prisma generate
pnpm prisma validate
pnpm prisma migrate status
```

Expected: the new migration applies once, generated types include both models, and the database reports up to date.

- [ ] **Step 5: Run the schema test to verify GREEN**

Run: `pnpm exec tsx --test tests/trusted-device-schema.test.ts`

Expected: PASS.

---

### Task 3: Cryptographic device and OTP primitives

**Files:**
- Create: `src/lib/server/device-security.ts`
- Create: `tests/device-security.test.ts`
- Modify: `src/lib/server/auth-security.ts`
- Modify: `tests/auth-security.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing primitive tests**

Cover entropy, user scoping, OTP shape, keyed hashing, constant-time equality, UA normalization, and labels:

```ts
test("device hashes are user scoped and raw secrets are never returned as hashes", () => {
  const secret = createBrowserSecret()
  assert.ok(Buffer.from(secret, "base64url").byteLength >= 32)
  assert.notEqual(hashTrustedDevice("user-a", secret, pepper), secret)
  assert.notEqual(
    hashTrustedDevice("user-a", secret, pepper),
    hashTrustedDevice("user-b", secret, pepper),
  )
})

test("OTP is six digits and challenge-bound", () => {
  const code = createLoginOtp()
  assert.match(code, /^\d{6}$/)
  const hash = hashLoginOtp("challenge-a", code, pepper)
  assert.equal(matchesLoginOtp(hash, "challenge-a", code, pepper), true)
  assert.equal(matchesLoginOtp(hash, "challenge-b", code, pepper), false)
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm exec tsx --test tests/device-security.test.ts tests/auth-security.test.ts`

Expected: FAIL with missing device-security exports and missing login OTP policies.

- [ ] **Step 3: Implement the primitives**

`device-security.ts` must use Node crypto and UAParser.js:

```ts
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto"
import { UAParser } from "ua-parser-js"

function keyed(scope: string, value: string, pepper: string) {
  return createHmac("sha256", pepper).update(`${scope}\0${value}`).digest("hex")
}

export const createBrowserSecret = () => randomBytes(32).toString("base64url")
export const createLoginOtp = () => randomInt(0, 1_000_000).toString().padStart(6, "0")
export const hashTrustedDevice = (userId: string, secret: string, pepper: string) =>
  keyed(`trusted-device:${userId}`, secret, pepper)
export const hashUserAgent = (value: string, pepper: string) =>
  keyed("trusted-device:user-agent", value.trim().toLowerCase().slice(0, 1024), pepper)
export const hashLoginOtp = (challengeId: string, code: string, pepper: string) =>
  keyed(`login-otp:${challengeId}`, code, pepper)

export function matchesLoginOtp(expected: string, id: string, code: string, pepper: string) {
  const actual = hashLoginOtp(id, code, pepper)
  return expected.length === actual.length && timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
}

export function deviceLabel(userAgent: string) {
  const parser = new UAParser(userAgent.slice(0, 1024))
  const browser = parser.getBrowser().name ?? "Unknown browser"
  const os = parser.getOS().name ?? "Unknown OS"
  return `${browser} on ${os}`.slice(0, 80)
}
```

Extend `AccountTokenPurpose` with `LOGIN_GRANT`. Extend `AuthRateAction` with `loginOtpSend` and `loginOtpVerify`; use identity `3/15 minutes`, IP `10/hour` for sends and identity `20/15 minutes`, IP `50/hour` for cross-challenge verification auditing. The challenge's own five-attempt cap remains the tighter per-challenge control.

- [ ] **Step 4: Run primitive tests to verify GREEN**

Run: `pnpm exec tsx --test tests/device-security.test.ts tests/auth-security.test.ts`

Expected: PASS, including purpose separation between reset, invite, and login-grant tokens.

---

### Task 4: Browser cookie and trusted-device service

**Files:**
- Create: `src/lib/server/trusted-devices.ts`
- Create: `tests/trusted-device-decision.test.ts`
- Modify: `src/lib/server/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write failing trust-decision tests**

Extract a pure decision so expiry and UA changes can be tested without Next cookies:

```ts
test("only an active matching device is trusted", () => {
  const now = new Date("2026-07-16T00:00:00Z")
  assert.equal(deviceIsTrusted({ expiresAt: new Date(now.getTime() + 1), revokedAt: null, userAgentHash: "ua" }, "ua", now), true)
  assert.equal(deviceIsTrusted({ expiresAt: now, revokedAt: null, userAgentHash: "ua" }, "ua", now), false)
  assert.equal(deviceIsTrusted({ expiresAt: new Date(now.getTime() + 1), revokedAt: now, userAgentHash: "ua" }, "ua", now), false)
  assert.equal(deviceIsTrusted({ expiresAt: new Date(now.getTime() + 1), revokedAt: null, userAgentHash: "other" }, "ua", now), false)
})
```

- [ ] **Step 2: Run the test to verify RED**

Run: `pnpm exec tsx --test tests/trusted-device-decision.test.ts`

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement cookie and database boundaries**

Export these focused functions from `trusted-devices.ts`:

```ts
export const TRUST_DAYS = 30
export function deviceIsTrusted(record: DeviceState, userAgentHash: string, now = new Date()): boolean
export async function getOrCreateBrowserSecret(): Promise<string>
export async function findTrustedDevice(userId: string, secret: string, userAgent: string): Promise<TrustedDevice | null>
export async function trustCurrentBrowser(userId: string, secret: string, userAgent: string): Promise<TrustedDevice>
export async function revokeTrustedDevice(userId: string, deviceId: string): Promise<{ revoked: boolean; current: boolean }>
export async function revokeAllUserAuth(tx: Prisma.TransactionClient, userId: string, now: Date): Promise<void>
```

Use the async Next.js cookie API exactly:

```ts
const store = await cookies()
store.set(cookieName(), secret, {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TRUST_DAYS * 24 * 60 * 60,
  priority: "high",
})
```

Cookie names are `__Secure-geraiakun-device` in production and `geraiakun-device` otherwise. Add `TRUSTED_DEVICE_DAYS="30"` to environment validation and `.env.example` with a bounded integer range of 1-90.

- [ ] **Step 4: Run the decision tests to verify GREEN**

Run: `pnpm exec tsx --test tests/trusted-device-decision.test.ts`

Expected: PASS.

---

### Task 5: OTP challenge, rate limits, and localized mail

**Files:**
- Create: `src/lib/server/login-otp.ts`
- Create: `tests/login-otp.test.ts`
- Modify: `src/lib/server/auth-mail.ts`
- Modify: `tests/auth-mail.test.ts`
- Modify: `src/lib/server/auth-rate-limit.ts`

- [ ] **Step 1: Write failing OTP and mail tests**

```ts
test("builds a localized login OTP email without links or secrets", () => {
  const message = buildLoginOtpEmail({ locale: "id", name: "Aan <Admin>", code: "042731" })
  assert.equal(message.subject, "Kode login geraiakun")
  assert.match(message.text, /042731/)
  assert.match(message.text, /10 menit/)
  assert.match(message.html, /Aan &lt;Admin&gt;/)
  assert.doesNotMatch(message.html, /password|token/i)
})

test("challenge policy rejects expiry, device mismatch, and five failures", () => {
  assert.equal(challengeDecision(activeChallenge, matchingContext, now), "allow")
  assert.equal(challengeDecision({ ...activeChallenge, failedAttempts: 5 }, matchingContext, now), "exhausted")
  assert.equal(challengeDecision({ ...activeChallenge, expiresAt: now }, matchingContext, now), "expired")
  assert.equal(challengeDecision(activeChallenge, { ...matchingContext, deviceHash: "other" }, now), "mismatch")
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm exec tsx --test tests/login-otp.test.ts tests/auth-mail.test.ts`

Expected: FAIL with missing OTP builder and challenge service.

- [ ] **Step 3: Generalize the mail message type**

Replace `ReturnType<typeof buildAuthEmail>` in `sendAuthEmail` with:

```ts
export type AuthMailMessage = { subject: string; text: string; html: string; url?: string }
```

Implement `buildLoginOtpEmail` with escaped display name, code in text/HTML, ten-minute expiry, no clickable login link, and ID/EN content.

- [ ] **Step 4: Implement transactional challenge operations**

`login-otp.ts` exports:

```ts
export async function createLoginOtpChallenge(input: {
  userId: string; deviceHash: string; userAgentHash: string; locale: "id" | "en"; now?: Date
}): Promise<{ challengeId: string; code: string; expiresAt: Date; resendAt: Date }>

export async function verifyLoginOtpChallenge(input: {
  challengeId: string; code: string; deviceHash: string; userAgentHash: string; now?: Date
}): Promise<{ ok: true; userId: string } | { ok: false; reason: "invalid" | "expired" | "exhausted" | "mismatch" }>

export async function resendLoginOtpChallenge(input: {
  challengeId: string; deviceHash: string; userAgentHash: string; now?: Date
}): Promise<{ ok: true; code: string; expiresAt: Date; resendAt: Date } | { ok: false; reason: "cooldown" | "exhausted" | "invalid" }>
```

Verification must claim success with `updateMany({ where: { id, consumedAt: null, failedAttempts: { lt: 5 }, expiresAt: { gt: now } } })`. Wrong codes increment attempts atomically. Resend requires sixty seconds, caps `sendCount` at three, replaces `codeHash`, and invalidates the prior code.

Map `loginOtpSend` to Prisma `LOGIN_OTP_SEND` and `loginOtpVerify` to `LOGIN_OTP_VERIFY` in `auth-rate-limit.ts`.

- [ ] **Step 5: Run tests to verify GREEN**

Run: `pnpm exec tsx --test tests/login-otp.test.ts tests/auth-mail.test.ts tests/auth-security.test.ts`

Expected: PASS.

---

### Task 6: Single-use login grants and grant-only Auth.js Credentials

**Files:**
- Modify: `src/lib/server/account-tokens.ts`
- Modify: `src/auth.ts`
- Modify: `src/lib/server/auth-flows.ts`
- Modify: `tests/auth-actions.test.ts`
- Create: `tests/login-grant.test.ts`
- Modify: `src/types/next-auth.d.ts`

- [ ] **Step 1: Write failing grant tests**

```ts
test("credentials input accepts only a login grant", () => {
  assert.deepEqual(parseLoginGrantCredentials({ grant: "a".repeat(43) }), { grant: "a".repeat(43) })
  assert.throws(() => parseLoginGrantCredentials({ email: "a@example.com", password: "Secure123" }))
})

test("LOGIN_GRANT is purpose-bound", () => {
  const grant = createAccountToken("LOGIN_GRANT", pepper)
  assert.notEqual(grant.hash, hashAccountToken(grant.raw, "PASSWORD_RESET", pepper))
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm exec tsx --test tests/login-grant.test.ts tests/auth-actions.test.ts tests/auth-security.test.ts`

Expected: FAIL because `LOGIN_GRANT` parsing and consumption do not exist.

- [ ] **Step 3: Add grant issue and consume functions**

```ts
export async function issueLoginGrant(email: string) {
  const token = createAccountToken("LOGIN_GRANT", serverEnv.AUTH_TOKEN_PEPPER)
  await prisma.accountToken.create({
    data: {
      email: email.trim().toLowerCase(),
      purpose: "LOGIN_GRANT",
      tokenHash: token.hash,
      expiresAt: new Date(Date.now() + 2 * 60_000),
    },
  })
  return { rawToken: token.raw }
}

export async function consumeLoginGrant(rawToken: string) {
  let user: LoginGrantUser | null = null
  const consumed = await consumeToken(rawToken, "LOGIN_GRANT", async (tx, email) => {
    user = await tx.user.findUnique({
      where: { email },
      include: { adminStaff: { select: { status: true } } },
    })
    if (!user) throw new Error("Login grant account no longer exists")
  })
  return consumed ? user : null
}
```

Login grants intentionally do not invalidate other active login grants, so two legitimate browsers cannot race each other. Keep consumption and user loading inside the transaction. Recheck `emailVerified`, staff status, and session version in Auth.js even though the grant issuer already checked them.

- [ ] **Step 4: Replace password credentials with grant-only credentials**

The provider contract becomes:

```ts
Credentials({
  name: "Email grant",
  credentials: { grant: { label: "Login grant", type: "text" } },
  async authorize(raw) {
    const { grant } = parseLoginGrantCredentials(raw)
    const user = await consumeLoginGrant(grant)
    if (!user || !user.emailVerified) return null
    if (user.role === "ADMIN" && user.adminStaff?.status !== "active") return null
    return toAuthUser(user)
  },
})
```

Delete the old email/password branch and its custom errors from `src/auth.ts`. Keep Google unchanged and keep the existing JWT canonical-user/session-version validation.

- [ ] **Step 5: Run tests and type checking**

Run:

```powershell
pnpm exec tsx --test tests/login-grant.test.ts tests/auth-actions.test.ts tests/auth-security.test.ts
pnpm tsc --noEmit
```

Expected: PASS; no callable Auth.js path accepts email/password.

---

### Task 7: Credentials login Server Actions

**Files:**
- Modify: `src/app/actions/auth.ts`
- Modify: `src/lib/server/auth-flows.ts`
- Create: `tests/credential-login-flow.test.ts`
- Modify: `tests/auth-actions.test.ts`

- [ ] **Step 1: Write failing input/result contract tests**

Test strict normalized input for begin, verify, and resend; mask email; and generic invalid credentials:

```ts
assert.deepEqual(parseCredentialLogin({ email: " A@Example.com ", password: "Secure123", locale: "id" }), {
  email: "a@example.com", password: "Secure123", locale: "id",
})
assert.deepEqual(maskEmail("customer@example.com"), "c******r@example.com")
assert.throws(() => parseLoginOtpVerification({ challengeId: "x", code: "12345" }))
```

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm exec tsx --test tests/credential-login-flow.test.ts tests/auth-actions.test.ts`

Expected: FAIL with missing parsers and actions.

- [ ] **Step 3: Implement `beginCredentialLogin`**

The action must execute in this order: strict parse, durable login limit, constant-work password verify, verification/status check, browser cookie creation, trust lookup, then either grant issue or OTP rate check/challenge/mail.

Return one of these discriminated results:

```ts
type BeginLoginResult =
  | { ok: true; state: "grant"; grant: string }
  | { ok: true; state: "otp"; challengeId: string; maskedEmail: string; expiresAt: string; resendAt: string; previewUrl: string | null }
  | { ok: false; code: "invalid-credentials" | "email-unverified" | "account-suspended" | "rate-limited" | "mail-unavailable"; message: string; retryAfterSeconds?: number }
```

If SMTP fails, consume the just-created challenge and return `mail-unavailable`. Never return a grant from that branch.

- [ ] **Step 4: Implement verify and resend actions**

```ts
export async function verifyCredentialLoginOtp(input: LoginOtpVerificationInput): Promise<
  | { ok: true; grant: string }
  | { ok: false; code: "invalid-code" | "expired" | "exhausted" | "device-mismatch"; message: string }
>

export async function resendCredentialLoginOtp(input: LoginOtpResendInput): Promise<
  | { ok: true; expiresAt: string; resendAt: string; previewUrl: string | null }
  | { ok: false; code: "cooldown" | "rate-limited" | "invalid-challenge" | "mail-unavailable"; message: string; retryAfterSeconds?: number }
>
```

On correct OTP, trust the browser, clear login failures, issue the grant, and return it. On resend mail failure, consume the replacement challenge state so a code that was not delivered cannot work.

- [ ] **Step 5: Run action contract tests to verify GREEN**

Run: `pnpm exec tsx --test tests/credential-login-flow.test.ts tests/auth-actions.test.ts`

Expected: PASS.

---

### Task 8: OTP login UI and bilingual messages

**Files:**
- Modify: `src/components/storefront/auth-form.tsx`
- Create: `src/components/storefront/login-otp-form.tsx`
- Modify: `src/messages/id.json`
- Modify: `src/messages/en.json`
- Create: `tests/login-otp-form.test.tsx`

- [ ] **Step 1: Write the failing server-render UI test**

```tsx
test("OTP form exposes one-time-code semantics and safe actions", () => {
  const noop = async () => {}
  const html = renderToStaticMarkup(
    <LoginOtpForm maskedEmail="c******r@example.com" expiresAt="2026-07-16T00:10:00Z" resendAt="2026-07-16T00:01:00Z" onVerify={noop} onResend={noop} onCancel={noop} />,
  )
  assert.match(html, /autocomplete="one-time-code"/)
  assert.match(html, /inputmode="numeric"/)
  assert.match(html, /maxlength="6"/)
  assert.doesNotMatch(html, /customer@example\.com/)
})
```

- [ ] **Step 2: Run the test to verify RED**

Run: `pnpm exec tsx --test tests/login-otp-form.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Build the focused OTP component**

Use one stable six-character input, `MailCheck`, `RefreshCw`, and `ArrowLeft` icons, visible expiry/resend countdowns, paste support through numeric sanitization, `aria-describedby`, fixed button dimensions, and no layout shift. It receives async callbacks rather than importing server actions, so it remains unit-testable.

- [ ] **Step 4: Refactor `AuthForm` into password and OTP states**

Replace direct email/password `signIn` with:

```ts
const begun = await beginCredentialLogin({ email: values.email, password: values.password, locale })
if (!begun.ok) return showLoginError(begun)
if (begun.state === "otp") return setOtpState(begun)
await completeGrantLogin(begun.grant)
```

`completeGrantLogin` calls `signIn("credentials", { grant, redirect: false })`, clears the grant from component state immediately, then navigates to `/akun`. OTP verification follows the same grant completion. Never place password, code, challenge, or grant in URL or browser storage.

Remove the existing decorative "remember me" checkbox because trust is now an explicit server policy rather than a client preference. Add ID/EN strings for new device, masked-email explanation, code label, expiry, resend countdown, wrong/expired/exhausted code, SMTP failure, back, and success. Keep Google behavior unchanged.

- [ ] **Step 5: Run UI and type tests**

Run:

```powershell
pnpm exec tsx --test tests/login-otp-form.test.tsx tests/auth-challenge.test.tsx
pnpm tsc --noEmit
```

Expected: PASS.

---

### Task 9: Trusted-device API and account settings

**Files:**
- Create: `src/app/api/account/devices/route.ts`
- Create: `src/components/storefront/trusted-devices-settings.tsx`
- Modify: `src/components/storefront/account-settings-view.tsx`
- Modify: `src/lib/api/queries.ts`
- Modify: `src/messages/id.json`
- Modify: `src/messages/en.json`
- Create: `tests/trusted-device-api.test.ts`

- [ ] **Step 1: Write failing route-policy tests**

Test the pure strict mutation schema and response mapper:

```ts
assert.deepEqual(parseDeviceMutation({ mode: "one", deviceId: "device-id" }), { mode: "one", deviceId: "device-id" })
assert.deepEqual(parseDeviceMutation({ mode: "all" }), { mode: "all" })
assert.throws(() => parseDeviceMutation({ mode: "one" }))
assert.throws(() => parseDeviceMutation({ mode: "all", deviceId: "unexpected" }))
```

- [ ] **Step 2: Run the test to verify RED**

Run: `pnpm exec tsx --test tests/trusted-device-api.test.ts`

Expected: FAIL with missing route policy module.

- [ ] **Step 3: Implement private GET and DELETE handlers**

GET authenticates, queries only `session.user.id`, returns active devices plus records revoked within the last thirty days, maps records without hashes, marks the current record by comparing the current cookie's user-scoped hash, and returns `Cache-Control: private, no-store`.

DELETE requires same-origin, strict JSON, and ownership. `{ mode: "one", deviceId }` revokes one row. `{ mode: "all" }` runs `revokeAllUserAuth`, increments session version, and returns `{ ok: true, signOut: true }`. A current-device revoke clears the browser-secret cookie only after the database update succeeds.

- [ ] **Step 4: Add typed query and settings UI**

Add `qk.trustedDevices`, `TrustedDeviceView`, and `useTrustedDevices`. Render one un-nested card per device with browser label, current badge, dates, revoked/expired state, icon-only revoke command with tooltip, and a separate danger command for all devices. Use confirmation dialogs for current/all revocation. On `signOut: true`, clear account queries and call Auth.js `signOut`.

- [ ] **Step 5: Run route/UI tests**

Run:

```powershell
pnpm exec tsx --test tests/trusted-device-api.test.ts
pnpm tsc --noEmit
pnpm biome check src/app/api/account/devices/route.ts src/components/storefront/trusted-devices-settings.tsx
```

Expected: PASS with no lint warnings in new files.

---

### Task 10: Reset and suspension revocation

**Files:**
- Modify: `src/lib/server/account-tokens.ts`
- Modify: `src/app/actions/admin-team.ts`
- Modify: `src/app/api/admin/team/route.ts`
- Create: `tests/auth-revocation.test.ts`
- Modify: `tests/staff-invite-browser.spec.ts`

- [ ] **Step 1: Write failing revocation contract tests**

Create a database fixture with an active trusted device, OTP challenge, login grant, and session version. Assert that password reset and suspension produce:

```ts
assert.equal(updatedUser.sessionVersion, previousVersion + 1)
assert.ok(device.revokedAt)
assert.ok(challenge.consumedAt)
assert.ok(grant.consumedAt)
```

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm exec tsx --test tests/auth-revocation.test.ts`

Expected: FAIL because reset/suspend currently leave trust and login artifacts active.

- [ ] **Step 3: Revoke all auth artifacts in reset transaction**

After locating the reset user inside the existing token transaction, call `revokeAllUserAuth(tx, user.id, now)` before updating the password. The helper revokes trusted devices, consumes active challenges and `LOGIN_GRANT` tokens, and increments `sessionVersion` exactly once. Remove the existing separate `sessionVersion: { increment: 1 }` from the password update to avoid a double increment.

- [ ] **Step 4: Make both staff-suspension paths atomic**

In the Server Action and Route Handler, when status changes to `suspended`, use one Prisma transaction to update `AdminStaff`, call `revokeAllUserAuth`, and write the audit event. Reactivation does not restore devices or sessions.

- [ ] **Step 5: Run revocation tests to verify GREEN**

Run:

```powershell
pnpm exec tsx --test tests/auth-revocation.test.ts
pnpm exec playwright test tests/staff-invite-browser.spec.ts --project=chromium --workers=1
```

Expected: PASS; a suspended then reactivated staff account still requires OTP on the next credentials login.

---

### Task 11: Complete Playwright lifecycle and anti-bypass coverage

**Files:**
- Modify: `tests/auth-lifecycle-browser.spec.ts`
- Create: `tests/trusted-device-browser.spec.ts`
- Modify: `tests/account-profile-browser.spec.ts`
- Modify: `tests/auth-mobile-browser.spec.ts`

- [ ] **Step 1: Extend the lifecycle test for first-device OTP**

After email verification, assert credentials submit shows the OTP view and does not navigate. Open the Ethereal OTP preview, read the six-digit code from message text, submit it, and assert `/id/akun`.

- [ ] **Step 2: Add same-browser and second-browser tests**

```ts
await signOutNormally(page)
await loginWithPassword(page, email, password)
await expect(page).toHaveURL(/\/id\/akun/) // no OTP

const freshContext = await browser.newContext()
const freshPage = await freshContext.newPage()
await loginWithPassword(freshPage, email, password)
await expect(freshPage.getByLabel("Kode OTP")).toBeVisible()
```

- [ ] **Step 3: Add replay, resend, expiry, and isolation tests**

Use controlled DB timestamps to expire a challenge; assert five wrong codes consume it; resend and assert the old code fails; reuse a successful code and assert failure; trust account A and assert account B on the same browser still receives OTP.

- [ ] **Step 4: Add reset and device-management tests**

Clone the trusted context, reset password, and assert both the old session and trusted login stop working. List devices, revoke the second browser, verify it requires OTP, then "sign out all" and assert every cloned session redirects to login.

- [ ] **Step 5: Confirm Google OAuth remains outside the OTP branch**

Add a component test that submits the Google button and asserts `signIn("google", { redirectTo })` is called directly, while `beginCredentialLogin` is called only by the email/password form submission. No real Google callback is invoked in automated tests.

- [ ] **Step 6: Add mobile ID/EN OTP checks**

At Pixel 7 dimensions, assert the OTP input, resend control, masked email, and commands fit without horizontal overflow or console/page errors in both locales.

- [ ] **Step 7: Run focused browser tests**

Run:

```powershell
pnpm exec playwright test tests/auth-lifecycle-browser.spec.ts tests/trusted-device-browser.spec.ts --project=chromium --workers=1
pnpm exec playwright test tests/auth-mobile-browser.spec.ts --project=mobile-chromium --workers=1
```

Expected: all scenarios pass using Ethereal on port 3100; no Gmail messages are sent.

---

### Task 12: Documentation, cleanup, and final verification

**Files:**
- Modify: `.env.example`
- Modify: `docs/backend-setup.md`
- Modify: `docs/security/auth-profile-audit-2026-07-15.md`
- Modify: `package.json`

- [ ] **Step 1: Document operational behavior**

Document thirty-day trust, Google SMTP OTP, Gmail App Password, production cookie security, new rate limits, Ethereal test override, revocation triggers, and cleanup retention. Expired challenges and consumed grants are retained no longer than twenty-four hours; revoked/expired device display records are retained thirty days and then deleted. State explicitly that Google OAuth bypasses email OTP by design.

- [ ] **Step 2: Run security scans**

Run:

```powershell
rg -n "signIn\(\"credentials\"|localStorage|sessionStorage|LOGIN_GRANT|SMTP_PASS|codeHash|deviceHash" src tests
rg -n "email.*password|password.*email" src/auth.ts
git diff --check
```

Expected: the only credentials sign-in payload contains `grant`; no auth secret is stored client-side; no raw OTP/device/grant logging; no password-only provider branch.

- [ ] **Step 3: Run the full static and database verification**

Run:

```powershell
pnpm test:auth
pnpm test:articles
pnpm tsc --noEmit
pnpm biome check src/auth.ts src/app/actions/auth.ts src/app/api/account/devices/route.ts src/components/storefront/auth-form.tsx src/components/storefront/login-otp-form.tsx src/components/storefront/trusted-devices-settings.tsx src/lib/server/account-tokens.ts src/lib/server/auth-flows.ts src/lib/server/auth-mail.ts src/lib/server/auth-rate-limit.ts src/lib/server/auth-security.ts src/lib/server/device-security.ts src/lib/server/login-otp.ts src/lib/server/trusted-devices.ts tests/device-security.test.ts tests/login-otp.test.ts tests/login-grant.test.ts tests/trusted-device-api.test.ts
pnpm prisma validate
pnpm prisma migrate status
```

Expected: every command exits 0, with all migrations applied.

- [ ] **Step 4: Run production build without persisting a test secret**

Provide a process-only `AUTH_TOKEN_PEPPER` if the local environment intentionally omits it, then run `pnpm build`.

Expected: Next.js compiles, type-checks, collects page data, and generates all routes successfully.

- [ ] **Step 5: Run the complete browser suite**

Run:

```powershell
pnpm test:e2e
pnpm exec playwright test tests/auth-mobile-browser.spec.ts --project=mobile-chromium --workers=1
```

Expected: all Chromium and Pixel 7 tests pass with no application console errors.

- [ ] **Step 6: Clean only test-owned artifacts and fixtures**

Remove the verified workspace `test-results` directory. Delete only fixture users whose addresses use the test-owned `codex.auth.*`, `codex.profile.*`, `codex.staff.*`, or `codex.device.*` prefixes, plus their challenge/grant/security records. Report the count; never touch other users.

- [ ] **Step 7: Start localhost and report residual risk**

Start `pnpm dev` on port 3000, verify `/id/masuk` returns 200 and `/id/akun` redirects without a session, then report the URL. Note only genuine residual limitations: no geographic risk engine, no authenticator-app MFA, and Google OAuth relies on Google security rather than this OTP layer.
