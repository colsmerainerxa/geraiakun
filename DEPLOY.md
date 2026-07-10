# Production Deploy Checklist — Geraiakun

## Pre-deploy

### Database (Neon)
- [ ] `DATABASE_URL` — pooled connection string (with `-pooler`)
- [ ] `DIRECT_URL` — direct connection for migrations
- [ ] `npx prisma migrate deploy` — run on deploy
- [ ] `npx prisma db seed` — seed initial data
- [ ] `npx tsx prisma/seed-transactional.ts` — seed transactional data

### Auth
- [ ] `AUTH_SECRET` — generate: `openssl rand -base64 32`
- [ ] `AUTH_URL` — production URL (e.g. `https://geraiakun.id`)
- [ ] `APP_URL` — same as AUTH_URL
- [ ] Google OAuth — register callback URL in Google Console:
  - `https://geraiakun.id/api/auth/callback/google`
- [ ] `AUTH_GOOGLE_ID` — Google OAuth client ID
- [ ] `AUTH_GOOGLE_SECRET` — Google OAuth client secret

### Midtrans
- [ ] `MIDTRANS_IS_PRODUCTION` — set to `true`
- [ ] `MIDTRANS_SERVER_KEY` — production server key
- [ ] `MIDTRANS_CLIENT_KEY` — production client key
- [ ] Register webhook URL in Midtrans dashboard:
  - `https://geraiakun.id/api/webhooks/midtrans`

### Security
- [ ] `CREDENTIAL_ENCRYPTION_KEY` — generate: `openssl rand -base64 32`
- [ ] `CRON_SECRET` — generate: `openssl rand -hex 16`

### Vercel
- [ ] Connect repo to Vercel
- [ ] Set all env vars in Vercel dashboard
- [ ] `vercel.json` — cron schedules configured (3 endpoints)
- [ ] Build command: `pnpm build` (runs `prisma generate && next build`)
- [ ] Output: `standalone` (configured in next.config.ts)

## Post-deploy

- [ ] Test login: `admin@geraiakun.id` / `geraiakun-admin`
- [ ] Test admin panel: `/id/admin`
- [ ] Test storefront: `/id` — homepage, catalog, product detail
- [ ] Test checkout flow: add to cart → checkout → payment
- [ ] Test Midtrans webhook: make a test payment
- [ ] Test cron endpoints: `curl https://geraiakun.id/api/cron/expire-payments?secret=***`
- [ ] Verify sitemap: `https://geraiakun.id/sitemap.xml`
- [ ] Verify robots: `https://geraiakun.id/robots.txt`

## Cron Endpoints (Vercel Cron)

| Endpoint | Schedule | Function |
|---|---|---|
| `/api/cron/expire-payments` | Every 5 min | Expire pending payments past 15-min window |
| `/api/cron/sync-stock` | Every 10 min | Sync variant stock with available credential count |
| `/api/cron/vault-expiry` | Every hour | Update vault account expiry statuses |

## Admin Credentials
- Email: `admin@geraiakun.id`
- Password: `geraiakun-admin`
- ⚠️ Change password after first login in production
