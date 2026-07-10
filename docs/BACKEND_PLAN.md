# Geraiakun — Backend Execution Plan

## Status Saat Ini

| Komponen | Status | Keterangan |
|---|---|---|
| Prisma Schema | ✅ Complete | 17 model, 14 enum, relasi penuh |
| NextAuth | ✅ Configured | Credentials + Google, JWT, PrismaAdapter |
| Midtrans Integration | ✅ Skeleton | CoreApi charge, webhook handler, signature verify |
| Credential Encryption | ✅ Working | AES-256-GCM encrypt/decrypt |
| Server Actions | ⚠️ Partial | checkout, payment, fulfillment, refunds, tickets, auth — semua ada fallback demo mode |
| API Routes | ⚠️ Partial | catalog, account/orders, account/vault, webhook/midtrans — hanya READ |
| Env Config | ✅ Set | Neon DB, Google OAuth, Midtrans sandbox, encryption key |
| Frontend | ✅ Complete | 259 file TS/TSX, storefront + admin UI — semua pakai mock data |
| Database | ❌ Not Migrated | Schema belum di-migrate ke Neon |
| Seed | ❌ Not Run | seed.ts ada tapi belum dijalankan |

---

## Fase 1: Database Foundation

**Goal:** Database live dengan schema + seed data.

### 1.1 Prisma Migration
- [ ] Jalankan `prisma migrate dev --name init` ke Neon
- [ ] Verifikasi semua tabel terbuat, index utuh
- [ ] Cek enum values sinkron dengan schema

### 1.2 Seed Database
- [ ] Jalankan `pnpm db:seed`
- [ ] Verifikasi: admin user, categories, products, variants, promos
- [ ] Test login dengan `admin@geraiakun.id` / `geraiakun-admin`

### 1.3 Verifikasi Koneksi
- [ ] Dev server (`pnpm dev`) jalan tanpa error env
- [ ] `backendFlags.databaseConfigured` = true
- [ ] API `/api/catalog/products` return data dari DB (bukan mock)
- [ ] API `/api/account/orders` return data dari DB

---

## Fase 2: Storefront Backend (Customer-facing)

**Goal:** Customer bisa register, login, browse, checkout, bayar, terima akun.

### 2.1 Auth Flow
- [ ] **Register**: Server action `register` di `src/app/actions/auth.ts` — create User + CustomerProfile, hash password, auto-login
- [ ] **Login**: Verifikasi Credentials provider sudah baca dari DB (bukan demo)
- [ ] **Email verification**: Token generation + verification endpoint
- [ ] **Password reset**: Token-based reset flow
- [ ] **Google OAuth**: Test callback, auto-create CustomerProfile on first login
- [ ] Hapus fallback demo di auth (saat ini return mock session)

### 2.2 Catalog API (Replace Mock)
- [ ] `src/lib/server/catalog.ts` — query Products + Categories dari DB, bukan dari `src/lib/mock/*`
- [ ] API `/api/catalog/products` — filter, search, sort, pagination dari DB
- [ ] API `/api/catalog/products/[slug]` — product detail + variants + reviews dari DB
- [ ] API `/api/catalog/categories` — list categories dari DB
- [ ] Hapus import mock data di storefront components, ganti dengan API calls via React Query

### 2.3 Cart & Checkout
- [ ] `checkout` server action — verify stock dari DB (bukan mock), create Order + OrderItem + PaymentAttempt
- [ ] Promo validation — query Promo dari DB, cek quota/expiry/minSpend
- [ ] Stock decrement on checkout (reserved stock pattern atau direct decrement)
- [ ] Hapus `demoCheckout()` fallback

### 2.4 Payment Flow
- [ ] Midtrans charge — real API call (sandbox), bukan `demoPaymentCode()`
- [ ] Webhook `/api/webhooks/midtrans` — test dengan Midtrans sandbox notification
- [ ] Payment status sync — update Order + PaymentAttempt status dari webhook
- [ ] Auto-create FulfillmentTask setelah payment PAID (sudah ada di webhook, verifikasi)
- [ ] Payment expiry — cron/job untuk expire unpaid orders setelah 15 menit
- [ ] Retry payment — `retryPayment` action tanpa demo fallback

### 2.5 Fulfillment & Vault
- [ ] `deliverFulfillmentCredential` — verify: ambil CredentialStock, create VaultAccount, mark credential SOLD, mark task SENT
- [ ] Vault API `/api/account/vault` — return vault accounts dengan decrypted credentials
- [ ] Vault expiry — cron/job untuk mark VaultAccount EXPIRING (H-3) lalu EXPIRED
- [ ] Reorder/Beli Lagi — create new order dari vault account (reorderPrice)
- [ ] Warranty check — ticket auto-create jika vault bermasalah dalam warranty period

### 2.6 Customer Account
- [ ] Profile API — update name, whatsapp, avatar
- [ ] Order history — list + detail dari DB
- [ ] Ticket system — create ticket, list tickets, send messages
- [ ] Wishlist — persist ke DB (saat ini Zustand localStorage)
- [ ] Loyalty/referral — DB-backed (saat ini mock)

---

## Fase 3: Admin Backend

**Goal:** Admin panel fully functional dengan CRUD operations.

### 3.1 Admin Auth & Guards
- [ ] `requireAdminSession` — verifikasi role ADMIN dari session (sudah ada, test)
- [ ] Admin login page terpisah atau redirect berdasarkan role
- [ ] AuditEvent logging — log semua admin actions (create/update/delete)

### 3.2 Product Management (CRUD)
- [ ] **Create product** — server action: create Product + ProductVariants
- [ ] **Update product** — edit fields, toggle active, update variants
- [ ] **Delete product** — soft delete (set `active = false`) atau hard delete dengan constraint check
- [ ] **Upload image** — store ke `/public` atau cloud storage (Cloudflare R2/UploadThing)
- [ ] **Manage variants** — add/edit/remove variants, update stock count, price
- [ ] Admin API `/api/admin/products` — list with pagination, filter, search

### 3.3 Category Management
- [ ] CRUD categories — create, update, delete (check product references)
- [ ] Reorder categories (sort order field jika perlu)

### 3.4 Credential Stock Management
- [ ] **Bulk import** — CSV/JSON upload credentials (encrypt on insert)
- [ ] **List stock** — per product/variant, filter by status (AVAILABLE/SOLD/EXPIRED)
- [ ] **Delete credential** — hanya jika AVAILABLE
- [ ] **Manual assign** — assign credential ke fulfillment task manually
- [ ] Stock count sync — update ProductVariant.stock dari CredentialStock count

### 3.5 Order Management
- [ ] **List orders** — filter by status, date, search by invoice/customer
- [ ] **Order detail** — items, payment attempts, fulfillment tasks, vault accounts
- [ ] **Update status** — manual status change (PROCESSING → COMPLETED, CANCELLED)
- [ ] **Export** — CSV export orders

### 3.6 Fulfillment Queue
- [ ] **List tasks** — kanban board (WAITING_STOCK → READY_TO_SEND → RISK_REVIEW → SENT)
- [ ] **Deliver** — assign credential + create vault (sudah ada action, test end-to-end)
- [ ] **Risk review** — flag high-value orders untuk manual review
- [ ] **SLA monitoring** — alert jika task melebihi SLA minutes

### 3.7 Promo Management
- [ ] CRUD promos — create, update, deactivate
- [ ] Usage tracking — `used` count, remaining quota
- [ ] Promo validation on checkout

### 3.8 Ticket Management
- [ ] **List tickets** — filter by status, priority, type
- [ ] **Respond** — add message to ticket (append to JSON messages array)
- [ ] **Update status** — NEW → REVIEWING → PROCESSING → DONE/REJECTED
- [ ] **Link to order/product** — auto-fill context

### 3.9 Refund Management
- [ ] **List cases** — filter by status
- [ ] **Process** — approve/reject, choose replacement or refund
- [ ] **Timeline** — append events to JSON timeline array
- [ ] Midtrans refund API call jika refund ke payment

### 3.10 Customer Management
- [ ] **List customers** — search, filter by status (baru/aktif/vip)
- [ ] **Customer 360** — orders, vault accounts, tickets, refund history
- [ ] **Ban/suspend** — set status on CustomerProfile

### 3.11 Admin Team Management
- [ ] **List staff** — AdminStaff list
- [ ] **Add/remove staff** — promote User role to ADMIN + create AdminStaff
- [ ] **Activity log** — AuditEvent per staff

### 3.12 Analytics Dashboard
- [ ] Revenue stats — query Order where status COMPLETED
- [ ] Sales by product — aggregate OrderItem
- [ ] Payment method distribution — aggregate PaymentAttempt
- [ ] Fulfillment performance — avg SLA, tasks per day
- [ ] Customer growth — new users per day/week

### 3.13 Audit Log
- [ ] **List events** — filter by module, actor, date
- [ ] Auto-log — wrap semua admin server actions dengan AuditEvent.create()

---

## Fase 4: Background Jobs & Cron

**Goal:** Automated tasks untuk maintenance.

### 4.1 Payment Expiry
- [ ] Cron/interval: mark PaymentAttempt EXPIRED setelah 15 menit
- [ ] Update Order status → CANCELLED jika semua attempts expired

### 4.2 Vault Expiry
- [ ] Daily: mark VaultAccount EXPIRING (H-3 dari expiresAt)
- [ ] Daily: mark VaultAccount EXPIRED (lewat expiresAt)
- [ ] Notification: email/WhatsApp reminder ke customer

### 4.3 Credential Cleanup
- [ ] Daily: mark CredentialStock EXPIRED jika sudah SOLD dan vault expired

### 4.4 Stock Sync
- [ ] On credential add/remove: update ProductVariant.stock count
- [ ] On vault creation: decrement stock

---

## Fase 5: Security & Production Readiness

### 5.1 Input Validation
- [ ] Semua server actions: Zod schema validation (sebagian sudah ada)
- [ ] API routes: validate query params + body
- [ ] Rate limiting on auth endpoints (login, register)

### 5.2 Authorization
- [ ] Semua admin API routes: check `session.user.role === "admin"`
- [ ] Customer API routes: check `session.user.id === resource.userId`
- [ ] Webhook: signature verification (sudah ada, test)

### 5.3 Data Protection
- [ ] Credential encryption: verify AES-256-GCM pada semua CredentialStock + VaultAccount fields
- [ ] PII: WhatsApp, email tidak expose di public API
- [ ] Audit: log semua sensitive operations

### 5.4 Error Handling
- [ ] Consistent error responses (code + message)
- [ ] Server action error boundaries
- [ ] Midtrans API failure handling + retry

### 5.5 Environment
- [ ] Production env: Midtrans production keys, real DATABASE_URL
- [ ] AUTH_SECRET: strong random (sudah ada)
- [ ] CREDENTIAL_ENCRYPTION_KEY: strong random (sudah ada)
- [ ] HTTPS only di production

---

## Fase 6: Testing & Verification

### 6.1 End-to-End Flow
- [ ] Register → Login → Browse → Add to cart → Checkout → Pay (sandbox) → Receive vault
- [ ] Admin: Add product → Add stock → Process order → Deliver → Customer receives
- [ ] Ticket: Customer create → Admin respond → Resolve
- [ ] Refund: Customer request → Admin process → Replacement/refund
- [ ] Promo: Create promo → Apply on checkout → Verify discount

### 6.2 Edge Cases
- [ ] Out of stock checkout attempt
- [ ] Expired payment retry
- [ ] Duplicate webhook (idempotency via MidtransEvent.eventKey)
- [ ] Concurrent credential assignment (race condition)
- [ ] Google OAuth first-time login (auto-create profile)

---

## Prioritas Eksekusi

| Urutan | Fase | Estimasi | Dependency |
|---|---|---|---|
| 1 | Fase 1 — Database Foundation | 1 session | — |
| 2 | Fase 2.1-2.2 — Auth + Catalog | 2-3 session | Fase 1 |
| 3 | Fase 2.3-2.5 — Checkout + Payment + Vault | 2-3 session | Fase 2.1-2.2 |
| 4 | Fase 3.1-3.5 — Admin CRUD (Product, Stock, Orders) | 2-3 session | Fase 1 |
| 5 | Fase 3.6-3.9 — Fulfillment, Promo, Tickets, Refund | 2 session | Fase 3.1-3.5 |
| 6 | Fase 4 — Background Jobs | 1 session | Fase 2 + 3 |
| 7 | Fase 5 — Security Hardening | 1 session | Fase 2 + 3 |
| 8 | Fase 6 — E2E Testing | 1 session | Semua |
