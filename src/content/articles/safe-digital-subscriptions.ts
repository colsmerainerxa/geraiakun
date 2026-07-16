import { sources } from "./sources"
import type { ArticleDefinition } from "./types"

export const safeDigitalSubscriptions = {
  key: "safe-digital-subscriptions",
  category: "security",
  tags: ["subscription", "security", "qris", "payments", "accounts"],
  relatedProductSlugs: ["chatgpt-plus", "gemini-pro"],
  authorName: "Tim Editorial geraiakun",
  reviewerName: "Tim Keamanan geraiakun",
  publishedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
  coverImage: "/images/articles/safe-digital-subscriptions.png",
  sources: [sources.qris, sources.consumerProtection, sources.chatgptPlus],
  translations: {
    id: {
      slug: "panduan-aman-langganan-digital",
      title: "Panduan Aman Membeli dan Menggunakan Langganan Digital",
      excerpt:
        "Verifikasi penjual, detail produk, nama merchant QRIS, bukti pembayaran, metode penyerahan, pemulihan akun, dan jalur bantuan sebelum bertransaksi.",
      seoTitle: "Panduan Aman Membeli Langganan Digital",
      seoDescription:
        "Ikuti panduan aman membeli langganan digital dengan QRIS: verifikasi merchant, lindungi OTP dan password, simpan bukti, serta pahami garansi.",
      searchPhrases: ["langganan digital aman", "cara bayar qris aman", "beli akun digital"],
      intro:
        "Pembelian langganan digital yang aman dimulai sebelum pembayaran. Pastikan produk, durasi, bentuk akses, merchant, harga akhir, garansi, dan jalur bantuan tertulis dengan jelas. Jangan pernah menyerahkan OTP atau kode keamanan.",
      keyTakeaways: [
        "Periksa identitas penjual, rincian akses, kebijakan garansi, dan kontak dukungan sebelum membayar.",
        "Saat memakai QRIS, cocokkan nama merchant dan nominal sebelum mengotorisasi transaksi.",
        "Simpan bukti, ubah kredensial hanya jika memang menjadi milik Anda, dan jangan bagikan OTP.",
      ],
      sections: [
        {
          id: "periksa-sebelum-membayar",
          heading: "Periksa penawaran sebelum membayar",
          paragraphs: [
            "Pastikan nama layanan, jenis paket, durasi, batas penggunaan, metode aktivasi, kepemilikan akun, dan garansi tertulis. Waspadai harga yang tidak masuk akal, desakan transfer cepat, ulasan tanpa bukti, dan penjual yang tidak menyediakan alamat dukungan.",
          ],
          bullets: [
            "Tanyakan apakah akses berbentuk akun pribadi, undangan resmi, kode, atau kredensial bersama.",
            "Baca tindakan yang membatalkan garansi dan waktu respons yang dijanjikan.",
            "Periksa apakah penggunaan yang ditawarkan sesuai dengan ketentuan penyedia asli.",
          ],
        },
        {
          id: "bayar-dengan-qris",
          heading: "Bayar dengan QRIS secara teliti",
          paragraphs: [
            "QRIS adalah standar pembayaran QR dari Bank Indonesia dan dapat digunakan melalui penyedia jasa pembayaran berizin. Sebelum menekan bayar, periksa nama merchant serta nominal pada aplikasi. Setelah transaksi, pastikan notifikasi berhasil dan simpan bukti pembayaran.",
          ],
          steps: [
            "Gunakan aplikasi pembayaran dari penyedia yang berizin dan lindungi perangkat dengan kunci layar.",
            "Pindai QR, cocokkan nama merchant serta nominal, lalu otorisasi sendiri tanpa membagikan PIN atau OTP.",
            "Simpan invoice dan notifikasi transaksi; hubungi merchant atau penyedia pembayaran jika status tidak sesuai.",
          ],
        },
        {
          id: "terima-dan-amankan-akses",
          heading: "Terima dan amankan akses sesuai jenisnya",
          paragraphs: [
            "Jika akun menjadi milik Anda, ganti password dan aktifkan autentikasi tambahan dari perangkat tepercaya. Jika akses berupa undangan resmi, pastikan domain pengirim benar. Jangan mengubah pemulihan pada kredensial yang bukan milik Anda dan jangan menyimpan data sensitif di akses bersama.",
          ],
          table: {
            headers: ["Jenis akses", "Tindakan aman"],
            rows: [
              [
                "Akun milik sendiri",
                "Ganti password, aktifkan MFA, dan simpan recovery code secara offline",
              ],
              [
                "Undangan resmi",
                "Periksa domain, organisasi, peran, dan hak akses sebelum menerima",
              ],
              ["Akses bersama", "Hindari data pribadi dan pahami risiko sesi serta pemulihan"],
            ],
          },
        },
        {
          id: "atasi-masalah-akses",
          heading: "Tangani logout dan masalah akses dengan bukti",
          paragraphs: [
            "Catat pesan error, waktu kejadian, perangkat, dan invoice tanpa mengirim password atau kode keamanan. Coba langkah resmi seperti memeriksa status layanan dan login ulang. Jika gagal, gunakan kanal dukungan tertulis dan rujuk syarat garansi serta bukti transaksi.",
          ],
        },
      ],
      faq: [
        {
          question: "Apa yang harus diperiksa sebelum membayar QRIS?",
          answer:
            "Periksa nama merchant, nominal, tujuan transaksi, dan rincian pesanan. Otorisasi pembayaran sendiri serta jangan pernah membagikan PIN atau OTP.",
        },
        {
          question: "Apa yang harus dikirim ketika meminta bantuan akses?",
          answer:
            "Kirim invoice, waktu kejadian, pesan error, dan langkah yang sudah dicoba. Jangan mengirim password, OTP, recovery code, atau data pembayaran lengkap.",
        },
      ],
    },
    en: {
      slug: "safe-digital-subscription-guide",
      title: "A Safe Guide to Buying and Using Digital Subscriptions",
      excerpt:
        "Verify the seller, product details, QRIS merchant name, payment evidence, delivery method, account recovery, and support path before a transaction.",
      seoTitle: "Safe Guide to Buying Digital Subscriptions",
      seoDescription:
        "Buy digital subscriptions more safely: verify the seller and QRIS merchant, protect passwords and one-time codes, retain evidence, and understand support.",
      searchPhrases: [
        "safe digital subscription",
        "safe qris payment",
        "buy digital account safely",
      ],
      intro:
        "A safer digital subscription purchase begins before payment. Confirm the product, duration, access model, merchant, final price, warranty, and support path in writing. Never surrender an OTP or security code.",
      keyTakeaways: [
        "Verify seller identity, access details, warranty terms, and support contacts before paying.",
        "When using QRIS, match the merchant name and amount before authorizing payment.",
        "Retain evidence, change credentials only when you own them, and never share an OTP.",
      ],
      sections: [
        {
          id: "check-before-payment",
          heading: "Check the offer before payment",
          paragraphs: [
            "Confirm the service name, plan type, duration, usage limits, activation method, account ownership, and warranty in writing. Treat unrealistic discounts, urgent transfer pressure, unsupported reviews, and missing support contacts as warning signs.",
          ],
          bullets: [
            "Ask whether access is a personal account, official invitation, code, or shared credential.",
            "Read the actions that void the warranty and the promised support response time.",
            "Check whether the offered use is consistent with the original provider's terms.",
          ],
        },
        {
          id: "pay-with-qris",
          heading: "Pay carefully with QRIS",
          paragraphs: [
            "QRIS is Indonesia's standardized QR payment system and works through licensed payment providers. Before confirming payment, inspect the merchant name and amount in the application. Afterward, confirm the success notification and retain the receipt.",
          ],
          steps: [
            "Use an application from a licensed payment provider and protect the device with a screen lock.",
            "Scan the code, match the merchant and amount, and authorize it yourself without sharing a PIN or OTP.",
            "Keep the invoice and transaction notice; contact the merchant or payment provider when status differs.",
          ],
        },
        {
          id: "secure-the-access",
          heading: "Secure access according to its ownership",
          paragraphs: [
            "If the account becomes yours, change the password and enable additional authentication from a trusted device. For an official invitation, verify the sender domain. Do not alter recovery on credentials you do not own, and never store sensitive data in shared access.",
          ],
          table: {
            headers: ["Access type", "Safer action"],
            rows: [
              ["Your own account", "Change password, enable MFA, and keep recovery codes offline"],
              [
                "Official invitation",
                "Verify domain, organization, role, and permissions before accepting",
              ],
              ["Shared access", "Avoid personal data and understand session and recovery risks"],
            ],
          },
        },
        {
          id: "resolve-access-issues",
          heading: "Resolve logout and access issues with evidence",
          paragraphs: [
            "Record the error, time, device, and invoice without sending a password or security code. Try official steps such as checking service status and signing in again. If the issue remains, use written support and refer to the warranty terms and payment evidence.",
          ],
        },
      ],
      faq: [
        {
          question: "What should I check before authorizing a QRIS payment?",
          answer:
            "Check the merchant name, amount, payment purpose, and order details. Authorize the payment yourself and never disclose a PIN or one-time code.",
        },
        {
          question: "What should I send when requesting help with access?",
          answer:
            "Send the invoice, incident time, error message, and steps already tried. Never send a password, OTP, recovery code, or complete payment details.",
        },
      ],
    },
  },
} satisfies ArticleDefinition
