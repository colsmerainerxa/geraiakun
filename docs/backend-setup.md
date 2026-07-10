# Backend Setup Geraiakun

## Pilihan Database

Default yang disiapkan: Neon Postgres.

Alasannya:
- cocok untuk Prisma dan Next.js,
- tidak perlu mengurus server database sendiri di VPS,
- punya pooled connection untuk runtime app,
- punya direct connection untuk migrasi Prisma,
- mudah dicadangkan dan diskalakan saat transaksi naik.

Supabase tetap bisa dipakai kalau nanti Geraiakun membutuhkan Storage, Realtime, atau dashboard data yang lebih lengkap. Untuk backend transaksi saat ini, Neon lebih ramping.

## Yang Sudah Otomatis di Repo

- `.env.example` dengan format Neon pooled/direct URL.
- `pnpm setup:env` untuk membuat `.env.local` dan secret lokal otomatis.
- Prisma CLI memakai `DIRECT_URL` jika tersedia.
- Runtime app tetap memakai `DATABASE_URL`.
- Tidak ada konfigurasi deploy Vercel.

## Yang Harus Diisi Manual

1. Buat project Neon.
2. Copy connection string pooled ke `DATABASE_URL`.
3. Copy connection string direct/non-pooler ke `DIRECT_URL`.
4. Buat Google OAuth credentials:
   - local callback: `http://localhost:3000/api/auth/callback/google`
   - production callback: `https://domain-kamu/api/auth/callback/google`
5. Ambil Midtrans Sandbox keys:
   - `MIDTRANS_SERVER_KEY`
   - `MIDTRANS_CLIENT_KEY`
6. Siapkan URL publik untuk webhook Midtrans:
   - local: pakai ngrok atau Cloudflare Tunnel,
   - production VPS: pakai domain kamu.
7. Siapkan email provider untuk pengiriman reset password dan verifikasi email.
8. Ganti `SEED_ADMIN_PASSWORD` sebelum seed production.

## Urutan Setelah Env Siap

```bash
pnpm setup:env
pnpm db:migrate
pnpm db:seed
pnpm build
```

Setelah itu lanjut QA:
- register/login email,
- Google login,
- checkout dari katalog database,
- pembayaran Midtrans sandbox,
- webhook paid/expired/failed,
- vault credential,
- admin fulfillment.
