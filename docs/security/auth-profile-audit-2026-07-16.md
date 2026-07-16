# Audit Keamanan Auth dan Profil - 16 Juli 2026

## Ringkasan Eksekutif

Audit aktif mencakup credentials login, Google OAuth, registrasi, verifikasi email,
reset kata sandi, undangan/suspend staf, JWT invalidation, profil, trusted device,
OTP email, rate limiting, CSRF, cache, penyimpanan browser, dan secret handling.
Tidak ada temuan Critical atau High yang masih terbuka dalam scope auth/profil.

Credentials login sekarang menggunakan password hanya di Server Action. Auth.js
hanya menerima grant acak sekali pakai selama dua menit. Browser baru wajib
memasukkan OTP enam digit dari SMTP, sedangkan browser yang sudah diverifikasi
dapat login tanpa OTP selama 30 hari. Google OAuth tidak memakai OTP email
geraiakun karena kepemilikan akun diverifikasi oleh Google.

## Temuan Terselesaikan

### AUTH-10 - Credentials dapat melewati keputusan perangkat

- Rule ID: NEXT-AUTH-001 / NEXT-SESS-002
- Severity: High
- Location: `src/auth.ts:19`, `src/lib/server/account-tokens.ts:42`
- Evidence: provider Credentials hanya memproyeksikan dan memvalidasi `grant`;
  grant purpose-bound, berumur dua menit, dan dikonsumsi atomik satu kali.
- Impact sebelumnya: login email/password langsung tidak dapat membedakan browser
  baru dan browser tepercaya.
- Fix: password dipindah ke `beginCredentialLogin`; Auth.js tidak memiliki cabang
  email/password lagi.
- Mitigation: status verifikasi email, status staf, dan versi sesi diperiksa ulang
  saat grant dikonsumsi.
- Status: Resolved; unit test dan Playwright lulus.

### AUTH-11 - OTP dan limiter rentan request paralel

- Rule ID: NEXT-DOS-001
- Severity: High
- Location: `src/lib/server/auth-rate-limit.ts:105`,
  `src/lib/server/login-otp.ts:113`
- Evidence: reservasi attempt memakai transaksi PostgreSQL `Serializable` dengan
  retry konflik; increment OTP memakai kondisi atomik `failedAttempts < 5`.
- Impact sebelumnya: request paralel dapat melewati pola check-then-insert atau
  menyebabkan beberapa tebakan hanya dihitung sebagai satu kegagalan.
- Fix: semua login/register/recovery/OTP memakai reservasi durable sebelum kerja
  sensitif; challenge tetap memiliki batas lima tebakan dan tiga pengiriman.
- Mitigation: limiter IP hanya membaca proxy header bila proxy secara eksplisit
  dipercaya; limiter identitas tetap aktif tanpa konfigurasi tersebut.
- Status: Resolved; percobaan keenam diblokir dalam Playwright.

### AUTH-12 - Trust perangkat dan OTP dapat bocor atau direplay

- Rule ID: NEXT-SESS-001 / NEXT-INPUT-001 / NEXT-LOG-001
- Severity: High
- Location: `src/lib/server/trusted-devices.ts:44`,
  `src/lib/server/device-security.ts:1`, `src/lib/server/login-otp.ts:92`
- Evidence: cookie memakai HttpOnly, SameSite=Lax, Secure di production, dan nama
  `__Secure-`; database hanya menyimpan HMAC user-scoped dan hash user-agent.
  OTP disimpan sebagai HMAC challenge-scoped, berlaku 10 menit, dan sekali pakai.
- Impact sebelumnya: tidak ada trust server-side yang bisa dicabut dan kode login
  berpotensi disimpan mentah.
- Fix: secret browser 256-bit, OTP enam digit dari CSPRNG, constant-time compare,
  expiry, attempt cap, cooldown resend, dan revocation.
- Mitigation: IP tidak dipakai sebagai fingerprint; perubahan browser/OS memaksa
  verifikasi baru.
- Status: Resolved; browser kedua dan replay lifecycle dicakup Playwright.

### AUTH-13 - Reset/suspend tidak mencabut seluruh artefak auth

- Rule ID: NEXT-SESS-002 / NEXT-AUTH-001
- Severity: High
- Location: `src/lib/server/trusted-devices.ts:115`,
  `src/lib/server/account-tokens.ts:125`, `src/app/api/admin/team/route.ts:136`
- Evidence: satu transaksi mencabut device, mengonsumsi challenge dan login grant,
  lalu menaikkan `sessionVersion` tepat satu kali.
- Impact sebelumnya: JWT lama atau browser tepercaya dapat bertahan setelah reset
  kata sandi atau suspend staf.
- Fix: reset password dan kedua jalur suspend memanggil revokasi global atomik.
- Mitigation: callback JWT membaca versi/status canonical dari database.
- Status: Resolved; sesi clone dan sesi staf ditolak setelah revokasi.

### AUTH-14 - Mutasi profil/perangkat berisiko CSRF atau data lintas user

- Rule ID: NEXT-CSRF-001 / NEXT-CACHE-001 / NEXT-AUTH-001
- Severity: High
- Location: `src/app/api/account/profile/route.ts:99`,
  `src/app/api/account/devices/route.ts:18`
- Evidence: route memerlukan sesi, selalu memakai `session.user.id`, memvalidasi
  Origin terhadap `APP_URL`, memvalidasi payload strict, dan mengirim
  `Cache-Control: private, no-store`.
- Impact sebelumnya: endpoint cookie-auth dapat menerima mutasi lintas origin atau
  response privat berisiko tersimpan di cache bersama.
- Fix: ownership server-side, same-origin fail-closed, schema strict, private cache.
- Mitigation: cookie sesi/trust juga SameSite.
- Status: Resolved; unauthorized dan persistence dicakup Playwright.

## Risiko Residual dan Operasional

### AUTH-15 - CSP belum terlihat di repo

- Rule ID: NEXT-CSP-001 / REACT-CSP-001
- Severity: Medium (defense in depth)
- Location: `next.config.ts:17`
- Evidence: nosniff, frame denial, referrer, dan permissions policy tersedia,
  tetapi `Content-Security-Policy` tidak didefinisikan di aplikasi.
- Impact: bila sink XSS baru masuk di masa depan, tidak ada lapisan CSP aplikasi
  yang membatasi eksekusi script.
- Fix: uji CSP Report-Only di edge, lalu terapkan nonce sesuai panduan Next.js dan
  allowlist minimum untuk Turnstile/Auth.
- Mitigation: React escaping, JSON-LD escaping, tidak ada raw user HTML pada
  auth/profil, dan tidak ada token auth di Web Storage.
- False positive notes: CSP mungkin dipasang oleh CDN/reverse proxy; verifikasi
  header production secara runtime.

### AUTH-16 - Sinyal risiko login masih terbatas

- Rule ID: NEXT-SESS-002
- Severity: Low
- Location: `src/lib/server/trusted-devices.ts:57`
- Evidence: keputusan trust memakai secret browser dan user-agent hash; tidak ada
  geographic risk engine, impossible-travel detection, atau authenticator-app MFA.
- Impact: cookie browser yang benar-benar dicuri bersama user-agent masih dapat
  dipakai sampai expiry atau revocation.
- Fix: untuk risiko lebih tinggi, tambahkan WebAuthn/TOTP dan re-auth pada operasi
  pembayaran/admin tanpa mengganti model trust saat ini.
- Mitigation: password tetap wajib setiap login, trust hanya 30 hari, dan user bisa
  mencabut satu/semua perangkat.
- False positive notes: Google OAuth sengaja tidak melewati OTP geraiakun dan
  bergantung pada kontrol keamanan Google.

### AUTH-17 - Konfigurasi proxy dan TLS harus diverifikasi saat deploy

- Rule ID: NEXT-PROXY-001 / NEXT-SESS-001
- Severity: Low
- Location: `src/lib/server/auth-rate-limit.ts:29`, `.env.example:16`
- Evidence: IP header diabaikan kecuali `AUTH_TRUST_PROXY_HEADERS=true`; cookie
  Secure aktif otomatis hanya pada `NODE_ENV=production`.
- Impact: konfigurasi proxy salah dapat menonaktifkan batas IP atau mempercayai
  header client. Perubahan perilaku `pg` mendatang juga mengharuskan mode TLS
  eksplisit.
- Fix: aktifkan trust hanya di belakang proxy yang menimpa header, gunakan HTTPS,
  dan gunakan `sslmode=verify-full` pada connection string production.
- Mitigation: limiter per identitas tetap aktif dan semua secret env diabaikan Git.
- False positive notes: konfigurasi edge production tidak tersedia dalam repo.

## Bukti Verifikasi

- 47 unit test auth/security lulus.
- Playwright desktop: lifecycle auth/profile, limiter, staff invite/suspend, trusted
  browser, second browser, single-device revoke, dan global revoke lulus.
- Playwright Pixel 7: recovery serta OTP login ID/EN lulus tanpa overflow/error.
- Hanya `signIn("credentials", { grant })` yang ditemukan di source.
- `.env.local` diabaikan oleh `.gitignore`; tidak ada file env terlacak.
- TypeScript, Biome, Prisma validate/status, dan build dijalankan pada verifikasi
  akhir.
- `pnpm audit` tidak menghasilkan advisory karena endpoint registry membalas HTTP
  410; ini dicatat sebagai keterbatasan verifikasi dependency.
