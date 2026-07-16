import { sources } from "./sources"
import type { ArticleDefinition } from "./types"

export const apiKeyBeginners = {
  key: "api-key-beginners",
  category: "developers",
  tags: ["api", "api-key", "developers", "security", "ai"],
  relatedProductSlugs: ["api-key"],
  authorName: "Tim Editorial geraiakun",
  reviewerName: "Tim Teknis geraiakun",
  publishedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
  coverImage: "/images/articles/api-key-beginners.png",
  sources: [sources.openAiAuth, sources.openAiQuickstart, sources.geminiKeys],
  translations: {
    id: {
      slug: "panduan-api-key-untuk-pemula",
      title: "Panduan API Key AI untuk Pemula: Aman dari Permintaan Pertama",
      excerpt:
        "Pahami fungsi API key, cara menyimpannya di server, membatasi akses, memantau biaya, dan merotasi key tanpa mengekspos rahasia ke browser atau repository.",
      seoTitle: "Panduan API Key AI untuk Pemula yang Aman",
      seoDescription:
        "Pelajari cara membuat, menyimpan, membatasi, memakai, dan merotasi API key AI dengan aman tanpa mengekspos rahasia di browser atau repository.",
      searchPhrases: ["api key untuk pemula", "cara menyimpan api key", "keamanan api key ai"],
      intro:
        "API key adalah kredensial rahasia yang menghubungkan permintaan aplikasi dengan proyek, kuota, dan tagihan Anda. Simpan di server atau secret manager, batasi kewenangannya, dan jangan pernah mengirimkannya ke browser pengguna.",
      keyTakeaways: [
        "Perlakukan API key seperti password dan jangan menyimpannya di source control.",
        "Panggil penyedia AI dari server, bukan langsung dari kode browser atau aplikasi publik.",
        "Gunakan pembatasan, anggaran, log, dan rotasi untuk mengurangi dampak kebocoran.",
      ],
      sections: [
        {
          id: "cara-kerja-api-key",
          heading: "Cara kerja API key",
          paragraphs: [
            "Saat aplikasi mengirim permintaan, penyedia membaca key untuk mengenali proyek dan menerapkan izin, kuota, serta penagihan. Key biasanya dikirim melalui header autentikasi. Siapa pun yang memegangnya dapat menghabiskan kuota sesuai hak key tersebut.",
          ],
        },
        {
          id: "simpan-di-server",
          heading: "Simpan key pada lingkungan server",
          paragraphs: [
            "Gunakan environment variable untuk pengembangan dan secret manager untuk produksi. Tambahkan file lokal rahasia ke gitignore. Jangan menulis key pada JavaScript klien, aplikasi mobile, tangkapan layar, log, tiket bantuan, atau pesan tim.",
          ],
          steps: [
            "Buat key pada proyek khusus agar penggunaan dan izin mudah dipisahkan.",
            "Simpan nilainya pada environment server dan baca hanya saat proses berjalan.",
            "Tambahkan endpoint server yang memvalidasi pengguna sebelum memanggil penyedia AI.",
          ],
        },
        {
          id: "batasi-dan-pantau",
          heading: "Batasi akses dan pantau penggunaan",
          paragraphs: [
            "Gunakan jenis key serta pembatasan yang direkomendasikan penyedia, aktifkan peringatan biaya, dan tetapkan rate limit per pengguna. Log metadata operasional secukupnya tanpa merekam key atau isi sensitif. Lonjakan penggunaan harus memicu penyelidikan dan penghentian sementara.",
          ],
          bullets: [
            "Pisahkan key untuk pengembangan, staging, produksi, dan pekerjaan otomatis.",
            "Tetapkan batas permintaan, panjang input, ukuran output, dan anggaran harian.",
            "Pantau status gagal, latensi, penggunaan token, dan perubahan biaya yang tidak biasa.",
          ],
        },
        {
          id: "tangani-kebocoran",
          heading: "Rotasi segera ketika key dicurigai bocor",
          paragraphs: [
            "Buat key pengganti, pasang pada aplikasi, verifikasi trafik baru, lalu cabut key lama. Periksa log dan tagihan untuk penggunaan tidak sah. Menghapus key dari commit terbaru tidak cukup karena nilainya tetap ada dalam histori dan salinan repository.",
          ],
        },
      ],
      faq: [
        {
          question: "Bolehkah API key disimpan dalam file .env?",
          answer:
            "Boleh untuk pengembangan lokal jika file tersebut tidak masuk git dan komputer terlindungi. Untuk produksi, gunakan pengelola rahasia dari platform deployment.",
        },
        {
          question: "Apa yang harus dilakukan jika API key masuk ke GitHub?",
          answer:
            "Cabut atau rotasi key segera, periksa penggunaan serta tagihan, lalu bersihkan histori bila diperlukan. Jangan menganggap penghapusan satu baris sudah mengamankan key.",
        },
      ],
    },
    en: {
      slug: "api-key-guide-for-beginners",
      title: "AI API Keys for Beginners: Secure from the First Request",
      excerpt:
        "Understand what an API key does, keep it on the server, restrict access, monitor spend, and rotate credentials without exposing secrets to browsers or repositories.",
      seoTitle: "Secure AI API Key Guide for Beginners",
      seoDescription:
        "Learn how to create, store, restrict, use, monitor, and rotate an AI API key without exposing a secret in browser code or a source repository.",
      searchPhrases: ["api key beginner guide", "store api key securely", "ai api key security"],
      intro:
        "An API key is a secret credential that connects application requests to your project, quota, and bill. Keep it on a server or in a secret manager, restrict its authority, and never send it to a user's browser.",
      keyTakeaways: [
        "Treat an API key like a password and never store it in source control.",
        "Call an AI provider from your server rather than public browser or mobile code.",
        "Use restrictions, budgets, logs, and rotation to reduce the impact of a leak.",
      ],
      sections: [
        {
          id: "how-api-keys-work",
          heading: "How an API key works",
          paragraphs: [
            "When an application sends a request, the provider reads the key to identify a project and apply permissions, quota, and billing. The key is commonly sent in an authentication header. Anyone holding it may consume resources within its authority.",
          ],
        },
        {
          id: "keep-it-server-side",
          heading: "Keep the credential in a server environment",
          paragraphs: [
            "Use environment variables during development and a secret manager in production. Keep local secret files out of git. Never place a key in client JavaScript, a mobile bundle, screenshot, log, support ticket, or team message.",
          ],
          steps: [
            "Create a key in a dedicated project so permissions and usage stay isolated.",
            "Store it in the server environment and read it only while the process runs.",
            "Expose a server endpoint that validates users before calling the AI provider.",
          ],
        },
        {
          id: "restrict-and-monitor",
          heading: "Restrict access and monitor usage",
          paragraphs: [
            "Use the credential type and restrictions recommended by the provider, enable spend alerts, and apply a per-user rate limit. Log operational metadata without recording keys or sensitive content. Unusual usage should trigger investigation and temporary suspension.",
          ],
          bullets: [
            "Separate credentials for development, staging, production, and automated jobs.",
            "Limit request rate, input length, output size, and daily budget.",
            "Monitor failures, latency, token usage, and unexpected cost changes.",
          ],
        },
        {
          id: "respond-to-a-leak",
          heading: "Rotate immediately when a leak is suspected",
          paragraphs: [
            "Create a replacement, deploy it, confirm new traffic, and then revoke the old key. Inspect logs and billing for unauthorized use. Removing a key from the latest commit is insufficient because it remains in history and repository copies.",
          ],
        },
      ],
      faq: [
        {
          question: "Can I store an API key in a .env file?",
          answer:
            "Yes for local development when the file is excluded from git and the device is protected. In production, use the deployment platform's secret manager.",
        },
        {
          question: "What should I do if an API key reaches GitHub?",
          answer:
            "Revoke or rotate it immediately, inspect usage and billing, and clean history when needed. Deleting one visible line does not make the exposed key safe.",
        },
      ],
    },
  },
} satisfies ArticleDefinition
