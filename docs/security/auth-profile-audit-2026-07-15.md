# Audit Keamanan Auth dan Profil - 15 Juli 2026

## Ringkasan Eksekutif

Audit mencakup login kredensial, registrasi, verifikasi email, reset kata sandi,
undangan staf, invalidasi sesi, proteksi bot/rate limit, dan persistensi profil.
Temuan High/Medium yang berada dalam scope sudah diperbaiki dan diuji. Tidak ada
secret auth yang ditemukan di client bundle atau penyimpanan sesi di Web Storage.

## Temuan Yang Sudah Diperbaiki

### AUTH-01 - Profil tidak persisten

- Rule: NEXT-AUTH-001 / NEXT-CACHE-001
- Severity: High
- Location: `src/app/api/account/profile/route.ts:98`,
  `src/components/storefront/account-settings-view.tsx:51`
- Evidence: update sekarang memakai user ID sesi, transaksi database, payload
  tervalidasi, dan response `private, no-store`; form membaca nilai DOM aktual.
- Impact sebelumnya: nomor WhatsApp dan preferensi dapat hilang setelah refresh
  atau terbawa oleh state browser.
- Fix: profil dan preferensi dipindah menjadi account-scoped di PostgreSQL.
- Status: Resolved dan dicakup Playwright.

### AUTH-02 - Registrasi dan recovery dapat dispam

- Rule: NEXT-DOS-001
- Severity: High
- Location: `src/lib/server/auth-security.ts:16`,
  `src/lib/server/turnstile.ts:67`
- Evidence: batas email/IP disimpan sebagai event hash di database dan Turnstile
  diverifikasi server-side dengan action serta hostname yang diharapkan.
- Impact sebelumnya: bot dapat membuat akun atau meminta email recovery berulang.
- Fix: durable rate limiting, Cloudflare Turnstile, timeout, dan fail-closed.
- Status: Resolved dan dicakup unit test serta Playwright.

### AUTH-03 - Lifecycle email dan token belum aman

- Rule: NEXT-AUTH-001 / NEXT-LOG-001 / NEXT-HOST-001
- Severity: High
- Location: `src/lib/server/account-tokens.ts:14`,
  `src/lib/server/auth-mail.ts:19`
- Evidence: database hanya menyimpan HMAC token, token terikat purpose, sekali
  pakai, memiliki expiry, dan URL email berasal dari `APP_URL` terkonfigurasi.
- Impact sebelumnya: akun kredensial tidak memiliki bukti kepemilikan email dan
  token mentah berisiko bocor bila disimpan.
- Fix: verifikasi wajib sebelum login, Ethereal di development, SMTP di production.
- Status: Resolved.

### AUTH-04 - Reset kata sandi tidak mencabut sesi lama

- Rule: NEXT-SESS-002
- Severity: High
- Location: `src/auth.ts:161`, `src/lib/server/account-tokens.ts:76`
- Evidence: reset menaikkan `sessionVersion`; callback JWT membandingkannya dengan
  database pada validasi sesi berikutnya.
- Impact sebelumnya: JWT yang sudah dicuri tetap dapat digunakan setelah korban
  mengganti kata sandi.
- Fix: invalidasi versi sesi untuk seluruh JWT lama.
- Status: Resolved dan dicakup Playwright.

### AUTH-05 - Undangan staf rusak dan status suspend tidak efektif

- Rule: NEXT-AUTH-001
- Severity: High
- Location: `src/lib/server/staff-invite.ts:6`,
  `src/lib/server/account-tokens.ts:86`, `src/auth.ts:66`
- Evidence: undangan sekarang membuat token `STAFF_INVITE`; penetapan password
  sekaligus memverifikasi email. Staf nonaktif ditolak saat login dan sesi aktifnya
  dibatalkan pada refresh JWT.
- Impact sebelumnya: UI undangan mengirim payload yang tidak cocok dengan API dan
  staf suspended tetap bisa login.
- Fix: lifecycle undangan atomik, status `invited` ke `active`, dan session gate.
- Status: Resolved dan dicakup Playwright end-to-end.

### AUTH-06 - Mutasi profil/tim belum memeriksa Origin

- Rule: NEXT-CSRF-001
- Severity: Medium
- Location: `src/lib/server/request-security.ts:1`,
  `src/app/api/account/profile/route.ts:99`, `src/app/api/admin/team/route.ts:33`
- Evidence: POST/PATCH/DELETE yang memakai cookie kini hanya menerima origin yang
  sama dengan `APP_URL`.
- Impact sebelumnya: pertahanan CSRF bergantung pada atribut cookie/browser saja.
- Fix: same-origin check fail-closed di route handler.
- Status: Resolved dan dicakup unit test.

## Rekomendasi Produksi

### AUTH-07 - CSP belum terlihat di konfigurasi aplikasi

- Rule: NEXT-CSP-001
- Severity: Medium (defense in depth)
- Location: `next.config.ts:17`
- Evidence: header nosniff, frame denial, referrer, dan permissions policy tersedia,
  tetapi `Content-Security-Policy` belum didefinisikan di repo.
- Impact: dampak XSS akan lebih besar bila sink baru diperkenalkan di masa depan.
- Fix: mulai dengan CSP Report-Only di edge, lalu gunakan nonce/allowlist yang
  mengakomodasi Next.js dan Cloudflare Turnstile sebelum enforcement.
- Mitigation saat ini: React escaping, JSON-LD escaping, tidak ada raw user HTML.
- Status: Recommended; perlu diselaraskan dengan konfigurasi deployment/edge.

### AUTH-08 - Masa sesi admin belum dibedakan dari pelanggan

- Rule: NEXT-SESS-002
- Severity: Low
- Location: `src/auth.ts:97`
- Evidence: strategi JWT ditetapkan, tetapi masa sesi khusus admin tidak ada.
- Impact: akun admin mendapat kebijakan durasi yang sama dengan pelanggan.
- Fix: pertimbangkan sesi admin lebih pendek dan re-auth untuk aksi berisiko tinggi.
- Mitigation saat ini: reset password dan suspend langsung menginvalidasi JWT lama.
- Status: Recommended.

### AUTH-09 - 2FA dan role granular masih berupa preview UI

- Rule: NEXT-AUTH-001
- Severity: Informational
- Location: `src/components/admin/admin-team-view.tsx`
- Evidence: server mengotorisasi `CUSTOMER` atau `ADMIN`; role operations/finance
  dan kontrol 2FA belum menjadi enforcement autentikasi backend.
- Impact: label role granular tidak boleh dianggap sebagai batas izin server.
- Fix: buat model permission server-side dan enrollment 2FA sebelum mengiklankan
  fitur tersebut sebagai kontrol keamanan aktif.
- Status: Known product limitation; role ADMIN dan status suspend sudah enforced.

## Bukti Verifikasi

- 30 unit test auth/security lulus.
- 7 skenario Playwright Chromium lulus.
- 2 skenario Playwright Pixel 7 (ID/EN) lulus.
- 15 test artikel/SEO lulus.
- TypeScript, Biome, Prisma validate/status, dan production build lulus.
