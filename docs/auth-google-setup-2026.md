# Tutorial Google Login Geraiakun 2026

Panduan ini untuk mengisi bagian `.env.local` berikut:

```env
APP_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
AUTH_SECRET="..."
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

> Jangan upload atau kirim nilai `AUTH_SECRET`, `AUTH_GOOGLE_ID`, dan `AUTH_GOOGLE_SECRET` ke chat publik/repo.

## 1. Siapkan Env Lokal

Kalau `.env.local` belum ada, jalankan:

```bash
pnpm setup:env
```

Untuk development lokal, biarkan:

```env
APP_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
```

Untuk production VPS nanti, ganti menjadi domain asli:

```env
APP_URL="https://domain-kamu.com"
AUTH_URL="https://domain-kamu.com"
```

## 2. Buat Project Google Cloud

1. Buka Google Cloud Console: `https://console.cloud.google.com/`
2. Pilih project yang sudah ada, atau buat project baru.
3. Nama project yang disarankan: `geraiakun-production`.

## 3. Konfigurasi Consent Screen

1. Buka menu `APIs & Services` atau `Google Auth Platform`.
2. Masuk ke `OAuth consent screen`.
3. Isi app information:
   - App name: `Geraiakun`
   - User support email: email admin kamu
   - Developer contact email: email admin kamu
4. Audience:
   - Pilih `External` jika login bisa memakai akun Gmail umum.
   - Untuk testing, tambahkan email kamu sebagai test user.
5. Scopes:
   - Cukup pakai scope dasar Google login: `openid`, `email`, `profile`.
   - Jangan tambahkan scope sensitif/restricted kalau tidak dibutuhkan.
6. Jika sudah punya domain production, tambahkan authorized domain.

## 4. Buat OAuth Client

1. Buka `APIs & Services` > `Credentials`.
2. Klik `Create Credentials`.
3. Pilih `OAuth client ID`.
4. Application type: `Web application`.
5. Name: `Geraiakun Web`.

Isi `Authorized JavaScript origins`:

```text
http://localhost:3000
https://domain-kamu.com
```

Isi `Authorized redirect URIs`:

```text
http://localhost:3000/api/auth/callback/google
https://domain-kamu.com/api/auth/callback/google
```

Untuk lokal saja, cukup isi yang `localhost`.

## 5. Copy Ke `.env.local`

Setelah client dibuat, Google akan menampilkan:

- Client ID
- Client Secret

Masukkan ke `.env.local`:

```env
AUTH_GOOGLE_ID="isi-client-id-dari-google"
AUTH_GOOGLE_SECRET="isi-client-secret-dari-google"
```

Jangan ubah nama variabelnya. Auth.js membaca pola `AUTH_GOOGLE_ID` dan `AUTH_GOOGLE_SECRET`.

## 6. Jalankan App Lokal

```bash
pnpm dev
```

Buka:

```text
http://localhost:3000/id/masuk
```

Klik tombol Google login.

## 7. Jika Error

### `redirect_uri_mismatch`

Redirect URI di Google belum sama persis.

Pastikan ada:

```text
http://localhost:3000/api/auth/callback/google
```

Untuk production:

```text
https://domain-kamu.com/api/auth/callback/google
```

### `origin_mismatch`

Authorized JavaScript origin belum benar.

Pastikan ada:

```text
http://localhost:3000
```

Untuk production:

```text
https://domain-kamu.com
```

### `MissingSecret`

`AUTH_SECRET` kosong atau tidak terbaca. Jalankan:

```bash
pnpm setup:env
```

Lalu restart dev server.

### Setting Google Belum Terbaca

Google kadang butuh beberapa menit sampai perubahan OAuth aktif. Tunggu 5-15 menit, lalu coba lagi.

## 8. Catatan Production VPS

Saat deploy ke VPS, env production harus memakai domain asli:

```env
APP_URL="https://domain-kamu.com"
AUTH_URL="https://domain-kamu.com"
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_SECRET="..."
```

Jangan pakai `localhost` di VPS.
