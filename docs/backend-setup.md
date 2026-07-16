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
7. Siapkan Google SMTP untuk OTP login, reset password, dan verifikasi email.
8. Ganti `SEED_ADMIN_PASSWORD` sebelum seed production.

## Email Auth dan Perlindungan Spam

Development menggunakan `EMAIL_TRANSPORT="ethereal"`. Email tidak dikirim ke inbox nyata; halaman aplikasi menampilkan tautan preview Ethereal agar registration, verifikasi, dan reset sandi dapat diuji end-to-end.

Production wajib menggunakan:

```env
EMAIL_TRANSPORT="smtp"
EMAIL_PREVIEW_ENABLED="false"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="akun-google@domain-kamu"
SMTP_PASS="app-password-16-karakter"
SMTP_FROM="geraiakun <akun-google@domain-kamu>"
```

Aktifkan verifikasi 2 langkah pada akun Google lalu buat App Password khusus
geraiakun. Jangan memakai kata sandi akun Google biasa. Jangan gunakan akun atau
test key Ethereal di production. Transport SMTP diverifikasi saat pertama digunakan
dan credential hanya dibaca server.

Login credentials selalu meminta password. Browser baru juga meminta OTP enam
digit yang berlaku 10 menit. Setelah OTP benar, browser dipercaya selama 30 hari:

```env
TRUSTED_DEVICE_DAYS="30"
```

Logout normal mempertahankan trust browser. Reset password, suspend staf, dan
"keluar dari semua perangkat" mencabut semua sesi, grant, challenge, dan trust.
Google OAuth tidak meminta OTP email geraiakun lagi karena verifikasi identitas
ditangani Google.

Playwright selalu menjalankan child server pada port 3100 dengan Ethereal override,
sehingga automated test tidak mengirim email melalui Gmail production.

Registration, permintaan reset, dan kirim ulang verifikasi dilindungi Cloudflare Turnstile. Localhost otomatis memakai test key resmi Cloudflare. Production harus mengisi key nyata dan hostname yang diperbolehkan:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY="site-key-production"
TURNSTILE_SECRET_KEY="secret-key-production"
TURNSTILE_ALLOWED_HOSTNAMES="domain-kamu,www.domain-kamu"
AUTH_TOKEN_PEPPER="secret-acak-yang-berbeda-dari-auth-secret"
```

Set `AUTH_TRUST_PROXY_HEADERS="true"` hanya jika aplikasi berada di belakang proxy terkelola yang menimpa `CF-Connecting-IP`, `X-Real-IP`, atau `X-Forwarded-For`. Tanpa itu limiter email tetap aktif, tetapi header IP dari client tidak dipercaya. Saat diaktifkan, login dibatasi 5 percobaan per email dan 30 percobaan per IP dalam 15 menit. Biarkan `false` pada deployment yang meneruskan header client tanpa menimpanya.

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
