# Auth Security Follow-up Design

**Date:** 2026-07-16

**Status:** Approved direction, pending implementation checkpoint

## Objective

Close the remaining authentication and session-security gaps found in the July 16 audit without replacing Auth.js, Prisma, Turnstile, Nodemailer, or the trusted-device design. The result must remain bilingual, preserve Google OAuth behavior, keep existing accounts able to sign in, and be testable without using production email or Turnstile challenges.

## Scope

This change includes:

- strict Origin validation for every cookie-authenticated `POST`, `PUT`, `PATCH`, and `DELETE` Route Handler;
- IP-aware password-login throttling when requests arrive through an explicitly trusted managed proxy;
- an enforced nonce-based Content Security Policy for rendered application pages;
- explicit test-only Turnstile and Ethereal configuration for Playwright;
- a 12-character minimum for newly created or reset passwords;
- focused unit, source-coverage, runtime, browser, and production-build verification.

This change does not include:

- replacing Auth.js or changing Google OAuth to require geraiakun OTP;
- invalidating existing passwords solely because they are shorter than the new creation policy;
- adding TOTP, passkeys, geographic risk scoring, or device fingerprinting;
- relying on Cloudflare WAF rules as the only application security boundary;
- overriding Next.js' bundled PostCSS dependency before an upstream-compatible patch is available.

## Security Boundaries

### Route Handler Origin Enforcement

Next.js Server Actions retain the framework's built-in Origin/Host validation. Route Handlers do not inherit that protection, so every session-cookie-authenticated mutation must reject a missing, malformed, or non-canonical Origin before reading the request body or performing authorization-sensitive work.

The existing `hasTrustedRequestOrigin(request, APP_URL)` function remains the source of truth. A small response helper will produce a consistent private `403 Forbidden origin` response, while each Route Handler will invoke it directly. Route-local enforcement is intentional: Proxy and UI visibility are defense-in-depth, not authorization or CSRF boundaries.

The signed Midtrans webhook and bearer-protected cron handlers are not converted to browser Origin validation because they use non-browser authenticity boundaries. Public read-only handlers are unchanged.

### Login Throttling

The existing email policy remains five password attempts per 15 minutes. Login additionally receives an IP policy of 30 attempts per 15 minutes. IP events are only created when `AUTH_TRUST_PROXY_HEADERS=true`; otherwise the application continues to ignore spoofable forwarding headers and enforces the email policy alone.

Production must enable trusted proxy headers only behind infrastructure that overwrites `CF-Connecting-IP`, `X-Real-IP`, or `X-Forwarded-For`. Cloudflare or another edge rate limiter remains recommended as an outer layer, but the database-backed limiter is authoritative inside the application.

### Content Security Policy

`src/proxy.ts` will generate a cryptographically random nonce for rendered page requests, attach it to the upstream request as `x-nonce`, include the CSP in the upstream request so Next.js can nonce framework scripts, and attach the same CSP to the response returned by `next-intl`.

The policy will include:

- `default-src 'self'`;
- nonce-based `script-src` with `strict-dynamic`, plus development-only `unsafe-eval`;
- `style-src 'self' 'unsafe-inline'` because the current UI and third-party widget use style attributes;
- `img-src 'self' blob: data: https://images.unsplash.com https://api.dicebear.com`;
- `font-src 'self' data:`;
- `connect-src 'self' https://challenges.cloudflare.com`;
- `frame-src https://challenges.cloudflare.com`;
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`;
- `upgrade-insecure-requests` in production only, so localhost development remains usable.

The existing locale aliases and `next-intl` routing behavior must remain unchanged. API routes, static assets, metadata image routes, and Next internals remain outside the nonce Proxy matcher. Static security headers in `next.config.ts` remain as defense-in-depth; the obsolete `X-XSS-Protection` header will be removed because CSP and modern browser protections supersede it.

Nonce CSP requires dynamic rendering. The affected localized application routes are already request-routed through `next-intl`; browser and production-build tests will confirm that no route becomes blank, blocked, or unreachable.

### Password Policy

Registration, password reset, and staff initial-password setup will require at least 12 characters, at most 128 characters, at least one letter, and at least one digit. Existing stored passwords are not rejected during login because login validates only the submitted length ceiling and verifies the existing scrypt hash.

Visible browser constraints and Indonesian/English validation messages must match the server schema. Test fixture passwords will be updated to compliant values where they exercise registration or reset.

### Test Isolation

Playwright's child server will explicitly override:

- `EMAIL_TRANSPORT=ethereal`;
- the official always-pass visible Turnstile site key;
- the matching official always-pass Turnstile secret key;
- `TURNSTILE_ALLOWED_HOSTNAMES=localhost`.

The child server must never inherit production Gmail delivery or production Turnstile credentials from `.env.local`. Production code must continue rejecting test Turnstile keys when `NODE_ENV=production`.

## Data Flow

### Session-authenticated Mutation

1. The Route Handler validates the request Origin against configured `APP_URL`.
2. Invalid or missing Origin returns `403` without parsing the body.
3. The handler resolves the Auth.js session and requires a non-empty user ID; admin handlers also require the admin role.
4. Runtime schema validation parses the body.
5. Resource ownership or role authorization is applied in the database query.
6. The mutation runs and returns a private response where account data is involved.

### Credential Login

1. The normalized email and trusted client IP are hashed independently with `AUTH_TOKEN_PEPPER`.
2. A serializable transaction reserves both email and IP rate-limit capacity.
3. Password verification always performs scrypt work, including for unknown accounts.
4. A verified trusted browser receives a two-minute single-use login grant.
5. An untrusted browser receives the existing device-bound email OTP flow.

### Rendered Page Request

1. Proxy creates a unique nonce for the request.
2. Proxy adds `x-nonce` and CSP to upstream request headers.
3. `next-intl` performs locale routing using the modified request.
4. Proxy adds the identical CSP to redirects, rewrites, and rendered responses.
5. Next.js applies the nonce to framework scripts; Turnstile loads only through the explicit CSP sources.

## Error Handling

- Origin failures are generic `403` responses and never reveal session state.
- Authentication failures remain `401`; authorization failures remain `401` or the established admin response contract.
- Rate-limit responses retain deterministic retry seconds without exposing raw email or IP identifiers.
- CSP violations are handled by the browser; no permissive fallback is added when a resource is blocked.
- Turnstile and SMTP test isolation failures must fail the E2E suite rather than fall back to production services.

## Verification Strategy

Implementation follows red-green-refactor cycles:

1. Add a failing source-coverage test that inventories authenticated mutation Route Handlers and requires Origin enforcement, excluding signed webhooks and bearer cron routes.
2. Add failing request-security tests for the standardized forbidden response and body-before-Origin ordering contract.
3. Extend the rate-policy test to require the login IP limit.
4. Add failing proxy/CSP tests for nonce uniqueness, production/development directives, Turnstile sources, and preservation of locale redirects.
5. Add failing auth-flow and rendered-form tests for the 12-character password policy.
6. Add a failing Playwright configuration test that requires explicit Ethereal and Turnstile test overrides.
7. Implement only enough production code to make each test pass, then run the focused test after every change.
8. Run all auth unit tests, TypeScript, Prisma validation and migration status, Biome on touched files, production build, and full Chromium E2E.
9. Verify runtime headers, hostile Origin responses, Siteverify reachability, SMTP transport verification, fixture cleanup, and `localhost:3000` availability.

## Success Criteria

- Every cookie-authenticated Route Handler mutation fails closed on an untrusted or missing Origin.
- Login enforces both email and trusted-IP limits without trusting client-supplied forwarding headers by default.
- Rendered pages return an enforced nonce CSP and load Next.js, localization, and Turnstile without browser console CSP errors.
- Playwright never uses production SMTP or Turnstile credentials and all Chromium auth scenarios pass.
- New/reset passwords shorter than 12 characters are rejected consistently by server and UI, while existing accounts can still attempt login.
- Auth unit tests, E2E, type checking, Prisma checks, formatting/lint checks, and production build all pass.
- No test users or Playwright artifacts remain, and the development server is restored on port 3000.
