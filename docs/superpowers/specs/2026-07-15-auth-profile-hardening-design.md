# Auth and Profile Hardening Design

**Date:** 2026-07-15
**Status:** Approved
**Scope:** Customer authentication, account recovery, profile persistence, notification preferences, and abuse prevention.

## Problem Statement

The account settings form shows edited values in the browser, but React Hook Form submits stale internal values after the profile query resets the form. A reproduced profile save sent the old name and omitted `whatsapp`; the API treated the omitted field as a valid no-op and returned success. Refreshing then correctly loaded the unchanged database record, which made the phone number appear to disappear.

The audit also found these related issues:

- Profile name and WhatsApp updates are separate database writes rather than one atomic operation.
- Notification preferences and recovery state use one global `localStorage` key and can survive logout or carry over to another account on the same browser.
- Registration and recovery create verification tokens but no email transport sends them.
- Password reset currently marks an email as verified.
- Registration, password reset, and verification resend have no durable anti-abuse controls.
- The login limiter is process-local, so it resets on restart and does not coordinate across application instances.
- Registration and password reset enforce inconsistent password rules.
- Password fields do not declare browser autocomplete semantics.

## Goals

- Persist exactly the profile values the user submitted, including explicitly clearing WhatsApp.
- Keep profile data, notification preferences, and session-visible identity consistent after save and refresh.
- Deliver verification and password-reset emails through temporary Ethereal mailboxes in development and SMTP in production.
- Require email verification before credentials-based accounts can log in.
- Prevent automated registration and recovery spam with server-verified challenges and durable rate limits.
- Use expiring, single-use, hashed account tokens without exposing raw tokens in the database.
- Preserve generic recovery responses so callers cannot enumerate registered email addresses.
- Cover Indonesian and English user-facing states.
- Verify behavior with automated tests and Playwright against the running application.

## Non-Goals

- Replacing Auth.js or migrating to a hosted identity platform.
- Adding password login to Google-only accounts.
- Building an email marketing or newsletter delivery system.
- Sending real email from development or test environments.
- Adding administrator-facing authentication management screens.

## Chosen Architecture

The implementation keeps Auth.js, Prisma, Zod, TanStack Query, and the existing App Router structure. It adds focused server modules for account tokens, mail delivery, Turnstile verification, and rate limiting. Public auth actions orchestrate those modules, while the account profile route remains the authenticated profile boundary.

Development uses a Nodemailer Ethereal test account. Ethereal captures messages and returns preview URLs, so Playwright can test the complete email flow without delivering mail to a real inbox. Production uses an explicitly configured SMTP transport and fails closed if required email or Turnstile configuration is missing.

Cloudflare Turnstile protects registration, password-reset requests, and verification resends. Every token is validated on the server with the expected action and, in production, an allowed hostname. Turnstile tokens are short-lived and single-use; the UI obtains a new token after every attempt.

Durable database records enforce limits independently of browser state and application process lifetime. Email and IP identifiers are HMAC-hashed before storage. Turnstile and rate limiting complement each other: the challenge blocks common automation while rate limits bound abuse even if a challenge is solved.

## Data Model

### Customer Profile

`CustomerProfile` gains four account-scoped notification preference columns:

- `notifyOrderUpdates`, default `true`
- `notifyPromos`, default `true`
- `notifyTicketReplies`, default `true`
- `notifyNewsletter`, default `false`

These values replace the persisted Zustand user settings. The account profile query becomes the source of truth for both profile fields and notification preferences.

### Account Token

A dedicated account token model stores:

- purpose: email verification or password reset
- normalized email
- SHA-256 token hash with a server-side secret binding
- creation and expiration timestamps
- optional consumption timestamp

Only the raw random token is placed in the email URL. Verification looks up its hash, validates purpose and expiry, and consumes it in the same transaction as the user update. Creating a new token invalidates earlier active tokens for the same email and purpose.

The Auth.js adapter `VerificationToken` model remains untouched for adapter compatibility.

### Auth Security Event

A compact security-event model records:

- action: login, registration, password reset request, or verification resend
- hashed identity key
- hashed IP key when a trustworthy client address is available
- success or failure outcome where applicable
- creation timestamp

Indexes support windowed counts. Old records are removed opportunistically after the active retention period.

## Rate-Limit Policy

- Credentials login: five failed attempts per normalized email in fifteen minutes. Successful login clears the active failure window.
- Registration: five attempts per IP per hour and three attempts per normalized email per hour.
- Password-reset request: three attempts per email per fifteen minutes and ten attempts per IP per hour.
- Verification resend: three attempts per email per fifteen minutes and ten attempts per IP per hour.

Rate-limit responses use HTTP or action-level retry metadata without disclosing account existence. Production proxy headers are only trusted through the configured deployment boundary; email-based limits remain active even when no trustworthy IP is available.

## Profile Flow

1. The account query returns identity fields, WhatsApp, verification status, and notification preferences.
2. The settings form uses controlled values derived from the query rather than resetting an uncontrolled form after mount.
3. The client validates for immediate feedback, then sends all editable fields explicitly. Empty WhatsApp is sent as `null`, not omitted.
4. The profile route authenticates the session, performs strict server-side validation, normalizes name and phone values, and updates `User` plus `CustomerProfile` in one transaction.
5. The route returns the canonical updated profile. TanStack Query replaces its cache with that response and refreshes server-rendered identity where required.
6. The success toast is shown only after the returned data matches the accepted update.

Notification switches save to the same account profile boundary. The UI uses an optimistic update with rollback and an error toast if persistence fails.

Logout removes obsolete account-scoped local state and clears account query data before redirecting. Recovery screens derive email and verification state from explicit inputs, URL tokens, or the authenticated profile rather than the old global user store.

## Registration and Verification Flow

1. The browser validates name, email, password, confirmation, and a Turnstile response.
2. The server validates Turnstile with action `register`, applies durable rate limits, normalizes input, and applies the shared password policy.
3. The database transaction creates the unverified credentials user, customer profile, and hashed verification token.
4. Mail delivery sends a localized verification link. Development returns an Ethereal preview URL only when the explicit development preview flag is enabled. Production never returns a preview URL or raw token.
5. Registration shows a check-email state instead of automatically logging in.
6. Following the link consumes the token and sets `emailVerified` atomically.
7. Credentials login rejects a correct password until verification succeeds. Google OAuth remains usable and relies on the provider/adapter verification state.

Duplicate registration responses do not expose sensitive account details. A user who owns the address can use the verification resend flow subject to Turnstile and rate limits.

## Password Recovery Flow

1. The user submits an email and a Turnstile response.
2. The server verifies action `password_reset`, applies limits, and always returns the same public response.
3. If the account exists and has credentials, the server creates a hashed reset token and sends a localized email.
4. The reset page validates token, password, and confirmation. The transaction updates only the password hash and consumes the token.
5. Password reset does not alter `emailVerified`.
6. Existing JWT sessions are invalidated by a per-user session version or password-change timestamp included in token validation, so a stolen session cannot remain active after recovery.

Google-only accounts receive the same generic request response but do not get a credentials reset token.

## Mail Transport

A server-only mail module exposes purpose-specific functions rather than a general client-callable sender.

- `ethereal`: allowed only outside production; creates or uses a temporary test account and returns a preview URL.
- `smtp`: required in production; reads host, port, secure mode, username, password, and sender identity from validated server environment variables.
- Transport startup or first use calls Nodemailer verification and reports a controlled service-unavailable result if configuration or connectivity is invalid.

Email HTML is escaped, includes a plain-text alternative, contains one short-lived link, and never embeds passwords or sensitive profile data. URLs are built from the configured application origin, not the incoming Host header.

## Turnstile Integration

The UI uses the React Turnstile widget with action-specific tokens. Local development uses Cloudflare's official test keys through environment configuration. Production requires real site and secret keys.

The server sends the token to Siteverify with a timeout, optional trustworthy remote IP, expected action, and allowed production hostname. Missing, reused, expired, mismatched, or unverifiable tokens fail closed. The client resets the widget after every submission outcome.

## Error Handling and Observability

- Validation failures return localized, field-safe messages.
- Authentication and authorization failures remain `401` and `403` as appropriate.
- Rate-limit responses include a retry duration and do not reveal whether an account exists.
- Mail failures are logged without credentials, raw tokens, full addresses, or message contents.
- Development may expose an Ethereal preview URL, but production responses never include it.
- Profile PATCH rejects an empty body rather than returning a misleading success.
- Database transactions prevent partial profile, token, password, and verification writes.

## Security Decisions

- All authorization decisions are server-side; client state is never trusted for account identity or verification.
- Raw reset and verification tokens are never persisted or logged.
- Recovery responses resist email enumeration.
- Public mutation flows require both Turnstile validation and durable throttling.
- Passwords use the existing scrypt hashing helper and one consistent minimum policy: at least eight characters with at least one letter and one number.
- Credential login remains generic for wrong passwords; the unverified state is disclosed only after a correct password is supplied.
- Session cookies remain Auth.js-managed. Session invalidation after password reset is enforced server-side.
- SMTP, Turnstile, token-pepper, and application-origin values stay in server-only environment variables.

## Internationalization and UX

All new visible strings are added to Indonesian and English message catalogs. The existing visual system is retained. Turnstile, verification, recovery, saving, retry, and service-unavailable states have clear accessible labels. Password inputs use `current-password` or `new-password`, email fields use `email`, and registration name uses `name` autocomplete tokens.

## Testing Strategy

### Unit and Integration Tests

- Profile validation normalizes phone values, accepts explicit clearing, and rejects a no-op payload.
- Profile persistence updates identity and preferences atomically.
- Rate limits enforce each threshold and keep raw emails/IPs out of stored keys.
- Turnstile validation checks success, expected action, hostname, timeout, and replay failure.
- Account tokens are hashed, purpose-bound, expiring, invalidated on replacement, and single-use.
- Password reset leaves verification state unchanged and invalidates older sessions.
- Mail templates produce localized text and safe absolute links.
- Auth recovery returns generic responses for existing and unknown accounts.

### Playwright Flows

- Register with the Cloudflare development test challenge.
- Open the Ethereal preview and follow the verification link.
- Confirm unverified credentials cannot log in and verified credentials can.
- Save name and WhatsApp, refresh, and confirm both persist.
- Clear WhatsApp, refresh, and confirm it remains empty.
- Toggle every notification preference, refresh, and verify account-scoped persistence.
- Logout, verify protected pages redirect, and verify profile GET/PATCH return `401` without a session.
- Log in as a second account and confirm preferences do not leak across accounts.
- Request password reset, open the Ethereal preview, reset the password, and confirm the old password and old session fail.
- Exercise Turnstile failure and rate-limit responses.
- Run Indonesian and English recovery/verification page checks at desktop and mobile viewports.

## Migration and Rollout

The database migration adds preference columns and the new token/security models with backward-compatible defaults. Existing profiles retain their current name and WhatsApp. The obsolete persisted user store is removed after the database-backed UI is active.

Production deployment is blocked unless SMTP, Turnstile, application origin, authentication secret, and token-pepper validation succeeds. Development defaults may use only documented test keys and Ethereal; these defaults are rejected when `NODE_ENV` is `production`.

## Acceptance Criteria

- A saved WhatsApp number remains after refresh and is present in the database response.
- Empty WhatsApp can be intentionally persisted.
- Account preferences persist across refresh and do not appear in another account.
- Credentials registration produces a real Ethereal preview in development and an SMTP message in production.
- Credentials login is unavailable until the verification link is consumed.
- Reset and verification tokens expire, cannot be reused, and are not stored raw.
- Registration and recovery automation is blocked by server-side Turnstile verification and database-backed rate limits.
- Password reset does not verify email and invalidates older sessions.
- Unauthenticated profile access remains blocked.
- Automated tests, lint, type checking, build, and the specified Playwright scenarios complete without application errors.
