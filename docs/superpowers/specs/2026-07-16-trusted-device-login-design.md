# Trusted Device and Email OTP Login Design

**Date:** 2026-07-16
**Status:** Approved
**Scope:** Credentials login step-up verification, trusted browser management, Google SMTP OTP delivery, and device/session revocation.

## Problem Statement

Credentials accounts currently verify email ownership during registration and use email links for password recovery, but a correct email and password can create a session from any browser after that initial verification. The requested behavior is closer to a modern identity provider: a known browser should sign in without repeated email prompts, while a new or revoked browser must prove access to the registered email before Auth.js creates a session.

The design must not use IP addresses as device identity, must not introduce invasive browser fingerprinting, and must not add redundant OTP prompts to Google OAuth. It must preserve the existing durable login rate limits, mandatory registration verification, single-use password reset, session-version invalidation, staff suspension checks, Indonesian/English UX, and Google SMTP transport.

## Goals

- Require a six-digit email OTP before a credentials session is created on an untrusted browser.
- Deliver login OTP messages through the configured Google SMTP transport.
- Let a successfully verified browser skip OTP for credentials login for thirty days.
- Continue requiring the correct password on every credentials login, including trusted browsers.
- Keep ordinary logout from forgetting the browser.
- Let users inspect and revoke trusted browsers individually or revoke every browser and active session.
- Revoke all trusted browsers after password reset or staff suspension.
- Prevent OTP replay, offline database guessing, brute force, account enumeration, cross-account trust, and bypass through the old Auth.js credentials path.
- Keep Google OAuth login free from an additional email OTP prompt.
- Cover every visible state in Indonesian and English and verify the complete flow with automated tests.

## Non-Goals

- Reimplementing Google's global risk engine, geolocation analysis, impossible-travel detection, or behavioral machine learning.
- Treating IP address as a stable device identifier.
- Collecting canvas, font, hardware, or other invasive browser fingerprint data.
- Adding SMS, WhatsApp, authenticator-app TOTP, passkeys, or recovery codes in this phase.
- Automatically trusting the credentials flow after a Google OAuth login.
- Replacing Auth.js, Prisma, Turnstile, Nodemailer, or the existing password hashing implementation.

## Considered Approaches

### Database-backed trusted browser token (chosen)

A random browser secret is held in an HttpOnly cookie. A user-scoped HMAC of that secret is stored in a trusted-device row. This supports immediate revocation, per-device management, expiry, audit metadata, and multiple accounts trusting the same browser without sharing trust across accounts.

### Signed cookie without database state

This is simpler but cannot reliably revoke one browser before cookie expiry and cannot provide a trustworthy device-management screen. It is rejected because password reset and account suspension must revoke trust immediately.

### Browser fingerprint or IP risk scoring

This can detect more contextual changes but produces privacy concerns and false positives. Mobile and residential IP addresses change frequently, while browser fingerprints are unstable and invasive. It is rejected as the primary trust mechanism. IP remains an anti-abuse and audit signal only.

## Chosen Architecture

Credentials login becomes a two-boundary flow:

1. Server Actions validate password, rate limits, trusted-browser state, OTP, and SMTP delivery.
2. Auth.js creates a session only after consuming a short-lived, single-use login grant produced by the first boundary.

The existing Auth.js Credentials provider no longer accepts email/password as sufficient credentials. It accepts only a raw login grant. The provider hashes and consumes that grant transactionally, loads the canonical user, checks verification, role/status, and session version, then returns the Auth.js user. Keeping an email/password fallback in the provider would be a step-up bypass and is explicitly prohibited.

Google remains a separate Auth.js provider. A successful Google OAuth callback creates its normal Auth.js session and neither requests login OTP nor creates credentials-browser trust.

## Data Model

### TrustedDevice

Each trusted relationship stores:

- random record ID
- user ID with cascade deletion
- user-scoped HMAC of the browser cookie secret
- HMAC of the normalized User-Agent
- safe display label derived from a small server-side User-Agent parser
- creation timestamp
- last successful credentials-login timestamp
- expiration timestamp
- optional revocation timestamp

A unique composite constraint on user ID and device hash prevents duplicates. No raw browser secret, IP address, complete User-Agent, or fingerprint is persisted. Expired and revoked records never authorize login.

The same raw browser cookie can support more than one account. Its stored device hash is scoped with the user ID, so trusting one account never trusts another account on that browser.

### LoginOtpChallenge

Each challenge stores:

- random opaque challenge ID
- user ID with cascade deletion
- user-scoped device hash
- keyed HMAC of the six-digit code and challenge ID
- User-Agent hash
- locale
- failed-attempt count
- send count and last-sent timestamp
- creation and expiration timestamps
- optional consumption timestamp

The code is generated with a cryptographically secure random integer, zero-padded to six digits, and is never logged or stored raw. A keyed HMAC is required because an unkeyed hash of one million possible values is trivial to brute force offline.

### Login Grant

`AccountTokenPurpose` gains `LOGIN_GRANT`. A login grant contains at least 256 random bits, is HMAC-hashed with the existing token pepper, expires after two minutes, and is consumed once by the Auth.js Credentials provider. The token row is bound to the normalized account email. Issuing a grant does not create a session by itself.

### Security Events

`AuthSecurityAction` gains actions for OTP send, OTP verification failure, and trusted-device revocation where useful for rate windows and audit. Email and IP identifiers continue to be HMAC-hashed. Raw OTPs, browser secrets, login grants, cookies, full addresses, and SMTP credentials must never appear in logs.

## Browser Cookie

The server uses one browser-secret cookie:

- at least 256 random bits encoded as base64url
- `HttpOnly`
- `SameSite=Lax`
- `Secure` only in production
- `Path=/`
- thirty-day maximum age
- `__Secure-` name in production and a non-prefixed development name on localhost

If the cookie is absent at the start of credentials login, the server creates it before checking trust. Possession of the cookie alone never authenticates a user; the correct password is still mandatory. The cookie is not copied to JavaScript, localStorage, sessionStorage, query parameters, logs, or API responses.

Ordinary logout clears the Auth.js session but retains this cookie and the trusted-device row. "Forget this browser" revokes the current user's matching row and clears the cookie, which also causes other accounts on that browser to require OTP next time without modifying their database rows.

## Credentials Login Flow

### Begin Login

1. The user submits normalized email and password to `beginCredentialLogin` with the current locale.
2. The server applies the existing durable credentials-login limit before expensive password work.
3. The server loads the account and verifies the password using the existing constant-work helper.
4. Invalid email/password returns the same generic response and records a failed login. Account verification or suspension state is disclosed only after a correct password.
5. Unverified accounts receive the existing verification-required response. Suspended staff receive the disabled-account response.
6. The server ensures a browser-secret cookie exists, computes the user-scoped device hash and User-Agent hash, and checks an active, unexpired trusted-device row.
7. If trusted, the server updates `lastUsedAt`, issues a two-minute login grant, and returns the grant to the login form.
8. If untrusted, the server applies OTP-send limits, creates a ten-minute challenge, sends the localized OTP through Google SMTP, and returns only the opaque challenge ID, masked email, expiry, and resend timing.
9. SMTP failure consumes the challenge and returns a controlled service-unavailable response. It never issues a grant or Auth.js session.

The client immediately submits a returned grant to Auth.js through `signIn("credentials", { grant })`. The Auth.js provider consumes it once and creates the JWT session. The raw grant exists only briefly in server memory, the TLS request, and client memory; it is never persisted client-side.

### Verify OTP

1. The user submits challenge ID and six-digit code to `verifyLoginOtp`.
2. The server atomically rejects consumed, expired, mismatched-device, mismatched-User-Agent, or exhausted challenges.
3. Every incorrect code increments the attempt count. Five failures consume the challenge and require a new login attempt.
4. A correct code consumes the challenge, upserts a trusted-device row expiring in thirty days, clears active login failures, and issues a two-minute login grant in one transaction.
5. The client passes the grant to Auth.js and enters the account.

OTP verification uses constant-time comparison after computing the keyed HMAC. Concurrent requests cannot consume the same challenge twice or obtain two valid grants.

### Resend OTP

`resendLoginOtp` requires the active challenge ID and matching browser context. It observes a sixty-second cooldown, a maximum of three sends per challenge, durable per-account/device limits of three sends per fifteen minutes, and an IP limit of ten sends per hour. A resend replaces the code hash and expiry so the previous code immediately becomes invalid.

## Registration, Recovery, and Google OAuth

- Credentials registration remains unverified until its one-hour email link is consumed. It never auto-signs in.
- Verification resend remains protected by Turnstile and durable limits.
- Password recovery remains a generic-response, Turnstile-protected, single-use email-link flow.
- Password reset never verifies an email, but it increments `sessionVersion`, revokes every trusted-device row for the user, and consumes active login challenges and grants.
- Staff suspension revokes trusted devices and invalidates sessions in addition to the existing status gate.
- Google OAuth does not request an email OTP and does not mark the browser trusted for future credentials login.

All production auth email, including login OTP, uses the validated Google SMTP settings. Automated browser tests override transport to Ethereal so tests do not send real messages or consume Gmail quotas.

## Trusted Device Management

The account settings page adds a database-backed "Trusted devices" section. It lists only the signed-in user's active and recently revoked records with:

- safe browser/OS label
- first trusted date
- last credentials-login date
- expiration date
- current-browser badge when the cookie matches
- revoke command

The current browser can be revoked. Revoking another device does not terminate the current Auth.js session unless the user chooses "Sign out all devices." That command revokes every trusted device, consumes active login challenges/grants, increments `sessionVersion`, and signs out the current browser after the server transaction succeeds.

Device listing and mutation routes are private, `no-store`, session-authenticated, ownership-scoped, strictly validated, and protected by the same-origin check already used for profile mutations.

## Risk and Revocation Rules

OTP is required when any of these is true:

- no browser-secret cookie exists
- no trusted-device row matches the account and cookie
- the row is expired or revoked
- the normalized User-Agent hash differs
- password reset or global sign-out revoked trust
- staff suspension revoked trust

IP changes alone do not require OTP. IP is used only for rate limiting and security-event correlation. The design intentionally avoids claiming Google's geographic or behavioral risk capabilities.

## User Experience

The credentials form keeps its email/password first step. New-device verification replaces the form body with:

- a localized title and masked destination address
- one six-digit input that supports numeric keyboards, paste, autofill via `autocomplete="one-time-code"`, and accessible error text
- remaining expiry information
- resend control with a visible sixty-second countdown
- commands to return to login or use another account

The UI does not expose whether an email exists before the password is correct. It distinguishes expired code, incorrect code, too many attempts, rate limiting, SMTP unavailability, revoked browser, unverified email, suspended account, and unexpected service failure without exposing implementation detail.

Both Indonesian and English message catalogs cover every state. Layouts remain usable at the existing desktop and Pixel 7 test viewports.

## Error Handling and Observability

- Password, OTP, and grant failures are expected auth outcomes and do not produce noisy stack traces.
- Unexpected database and SMTP failures are logged with a correlation ID and redacted context only.
- Client responses never include raw database errors, SMTP responses, full addresses beyond the already-entered login email, token hashes, or retry internals.
- Security events retain only HMAC identifiers and bounded metadata.
- Cleanup removes expired challenges, grants, and trusted-device records opportunistically and through the existing cron pattern.
- Production fails closed when SMTP, token pepper, application origin, or database configuration is invalid.

## Security Invariants

- No credentials session can be created from email/password alone.
- A login grant is required by the Auth.js Credentials provider and can be consumed once.
- Correct password is required before any login OTP is sent.
- Browser trust is user-scoped and never transfers between accounts.
- Raw OTPs, grants, and browser secrets are absent from the database and logs.
- OTP and token comparisons are keyed and constant-time where applicable.
- Account, challenge, grant, and device mutations are atomic where replay or partial state matters.
- Reset, suspension, and global sign-out revoke both active sessions and trusted-browser bypass.
- Client state, IP address, display labels, and User-Agent strings never authorize an account by themselves.
- Google OAuth remains isolated from the credentials trusted-browser mechanism.

## Testing Strategy

### Unit and Integration Tests

- Browser secrets, user-scoped device hashes, OTP hashes, and login grants are deterministic only with the correct server key and scope.
- OTP generation always produces six digits with secure randomness.
- Challenge expiry, resend replacement, five-attempt exhaustion, consumption, and replay are enforced atomically.
- Trusted-device checks cover active, expired, revoked, cross-user, missing-cookie, and User-Agent mismatch states.
- Login grants expire after two minutes and cannot be consumed twice.
- Password reset, suspension, individual revoke, and global revoke update the required records and session version.
- Auth.js Credentials rejects email/password input without a valid grant.
- Rate windows enforce account/device/IP limits without storing raw personal identifiers.
- OTP templates are localized, HTML-escaped, and contain no password or login grant.
- Device routes reject unauthenticated, cross-user, malformed, and cross-origin requests.

### Playwright Flows

- Register, receive the Ethereal verification email, verify, and attempt first credentials login.
- Receive login OTP, enter it, and complete the Auth.js session.
- Logout normally and log back in on the same browser without OTP.
- Use a second browser context and confirm OTP is required.
- Confirm wrong OTP, five-attempt lockout, expired OTP, resend cooldown, old-code invalidation, and replay rejection.
- Reset password and confirm old sessions, login grants, challenges, and trusted browsers stop working.
- Suspend staff and confirm sessions and trusted-browser login are blocked.
- List devices, revoke one, forget the current browser, and sign out all devices.
- Verify a second account on the same browser requires its own OTP and does not inherit trust.
- Confirm Google OAuth remains outside the OTP path with provider callback tests where practical.
- Run Indonesian and English flows at desktop and mobile viewports with no console errors or horizontal overflow.

## Migration and Rollout

The migration adds trusted-device and login-challenge tables, new token/security enum values, indexes for active lookup and cleanup, and cascade relationships to `User`. Existing users remain verified as currently recorded but have no trusted-device rows, so their first credentials login after rollout requires OTP.

Deployment order is migration, application release, then smoke tests against Google SMTP. The release must not expose a compatibility path that accepts password-only Auth.js credentials. Rollback requires restoring the earlier provider and should occur only together with disabling the new UI; the additive database tables can remain safely unused.

## Acceptance Criteria

- First credentials login on an untrusted browser sends a real Google SMTP OTP in production and does not create a session before verification.
- Correct OTP creates one trusted relationship and one Auth.js session; the OTP and grant cannot be reused.
- Ordinary logout followed by correct-password login on the same browser skips OTP for thirty days.
- Another browser, another account, an expired/revoked record, or a changed User-Agent requires OTP.
- Google OAuth never requests login OTP.
- Password reset, suspension, and global sign-out invalidate sessions and trusted-browser access.
- Users can inspect and revoke their own trusted browsers but cannot read or mutate another user's records.
- Raw OTPs, login grants, and browser secrets are not stored or logged.
- Rate limits, CSRF checks, strict input validation, and generic invalid-credential behavior remain active.
- Unit tests, type checking, lint, Prisma validation, production build, and all specified Playwright scenarios pass.
