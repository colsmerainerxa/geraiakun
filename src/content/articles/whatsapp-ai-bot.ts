import { sources } from "./sources"
import type { ArticleDefinition } from "./types"

export const whatsappAiBot = {
  key: "whatsapp-ai-bot",
  category: "developers",
  tags: ["whatsapp", "ai", "api", "webhooks", "security"],
  relatedProductSlugs: ["api-key"],
  authorName: "Tim Editorial geraiakun",
  reviewerName: "Tim Teknis geraiakun",
  publishedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
  coverImage: "/images/articles/whatsapp-ai-bot.png",
  sources: [sources.whatsappCloud, sources.whatsappWebhooks, sources.openAiAuth],
  translations: {
    id: {
      slug: "arsitektur-bot-whatsapp-dengan-ai",
      title: "Arsitektur Bot WhatsApp dengan AI yang Aman dan Andal",
      excerpt:
        "Bangun bot dari webhook terverifikasi, antrean, layanan AI di server, penyimpanan minimum, kontrol biaya, dan jalur eskalasi manusia yang jelas.",
      seoTitle: "Arsitektur Bot WhatsApp AI yang Aman",
      seoDescription:
        "Pelajari arsitektur bot WhatsApp AI berbasis webhook, antrean, backend, keamanan API key, rate limit, observabilitas, dan eskalasi manusia.",
      searchPhrases: ["bot whatsapp ai", "arsitektur whatsapp cloud api", "webhook whatsapp ai"],
      intro:
        "Bot WhatsApp berbasis AI sebaiknya dibangun sebagai sistem server, bukan skrip yang langsung meneruskan semua pesan ke model. Webhook diverifikasi, pekerjaan diantrekan, data diminimalkan, biaya dibatasi, dan pengguna selalu dapat meminta bantuan manusia.",
      keyTakeaways: [
        "Verifikasi webhook dan jangan pernah menaruh token WhatsApp atau API key AI di klien.",
        "Pisahkan penerimaan pesan dari pemrosesan AI menggunakan antrean dan idempotency key.",
        "Tambahkan moderasi, rate limit, audit, fallback, dan eskalasi manusia sebelum produksi.",
      ],
      sections: [
        {
          id: "alur-komponen",
          heading: "Pisahkan alur menjadi komponen yang jelas",
          paragraphs: [
            "Webhook menerima event, memverifikasi asalnya, menyimpan metadata minimum, lalu mengirim pekerjaan ke antrean. Worker mengambil konteks yang diizinkan, memanggil layanan AI dari server, memeriksa hasil, dan mengirim balasan melalui API resmi WhatsApp.",
          ],
          table: {
            headers: ["Komponen", "Tanggung jawab"],
            rows: [
              ["Webhook", "Verifikasi, deduplikasi, respons cepat, dan enqueue"],
              ["Worker", "Konteks, pemanggilan AI, kebijakan, retry, dan timeout"],
              ["Adapter WhatsApp", "Template, pengiriman pesan, dan penanganan status"],
            ],
          },
        },
        {
          id: "keamanan-dan-privasi",
          heading: "Amankan rahasia dan minimalkan data",
          paragraphs: [
            "Simpan token serta API key pada secret manager, batasi akses layanan, dan rotasi bila bocor. Jangan mengirim seluruh histori tanpa kebutuhan. Tentukan retensi, hapus data sensitif, dan beri tahu pengguna ketika percakapan diproses otomatis.",
          ],
          bullets: [
            "Validasi signature atau mekanisme verifikasi webhook yang diwajibkan platform.",
            "Enkripsi data saat transit dan batasi siapa yang dapat membaca log percakapan.",
            "Jangan pernah meminta PIN, OTP, password, atau kode pemulihan melalui bot.",
          ],
        },
        {
          id: "andal-dan-terkendali",
          heading: "Buat pemrosesan andal dan terkendali",
          paragraphs: [
            "Gunakan idempotency key agar event yang dikirim ulang tidak menghasilkan dua balasan atau transaksi. Terapkan timeout, retry terbatas, dead-letter queue, rate limit, serta batas token. Saat AI gagal, kirim pesan aman dan tawarkan kanal manusia.",
          ],
          steps: [
            "Balas webhook segera setelah validasi dan antrekan pekerjaan untuk proses asinkron.",
            "Batasi waktu, jumlah retry, panjang konteks, dan biaya maksimum per percakapan.",
            "Alihkan kasus sensitif, tidak pasti, atau berulang ke petugas manusia.",
          ],
        },
        {
          id: "uji-dan-pantau",
          heading: "Uji skenario buruk dan pantau produksi",
          paragraphs: [
            "Uji pesan ganda, webhook palsu, input sangat panjang, prompt injection, layanan AI lambat, dan kegagalan pengiriman. Pantau latensi, error, eskalasi, kepuasan, serta biaya per percakapan tanpa menaruh rahasia atau data pribadi dalam log.",
          ],
        },
      ],
      faq: [
        {
          question: "Apakah bot WhatsApp boleh memanggil API AI langsung dari aplikasi pengguna?",
          answer:
            "Tidak. Token WhatsApp dan API key AI harus tetap di server. Aplikasi pengguna hanya berkomunikasi melalui kanal WhatsApp dan backend yang terkontrol.",
        },
        {
          question: "Mengapa bot WhatsApp AI membutuhkan antrean?",
          answer:
            "Antrean membuat webhook tetap cepat, menyerap lonjakan trafik, mengendalikan retry, dan mencegah proses AI yang lambat mengganggu penerimaan event.",
        },
      ],
    },
    en: {
      slug: "whatsapp-ai-bot-architecture",
      title: "A Secure and Reliable Architecture for a WhatsApp AI Bot",
      excerpt:
        "Build around verified webhooks, a queue, server-side AI calls, minimal storage, cost controls, observability, and a clear path to human support.",
      seoTitle: "Secure WhatsApp AI Bot Architecture",
      seoDescription:
        "Design a WhatsApp AI bot with verified webhooks, queues, server-side secrets, rate limits, observability, policy checks, and human escalation.",
      searchPhrases: ["whatsapp ai bot", "whatsapp cloud api architecture", "whatsapp ai webhook"],
      intro:
        "A WhatsApp AI bot should be a server-side system rather than a script that forwards every message directly to a model. Verify webhooks, queue work, minimize data, cap cost, and let users reach a human.",
      keyTakeaways: [
        "Verify webhooks and never place WhatsApp tokens or AI API keys in client code.",
        "Separate event receipt from AI processing with a queue and idempotency keys.",
        "Add policy checks, rate limits, auditability, fallback, and human escalation before launch.",
      ],
      sections: [
        {
          id: "component-flow",
          heading: "Separate the flow into clear components",
          paragraphs: [
            "A webhook receives an event, verifies its origin, stores minimal metadata, and queues a job. A worker loads allowed context, calls the AI service from the server, checks the result, and sends a reply through the official WhatsApp API.",
          ],
          table: {
            headers: ["Component", "Responsibility"],
            rows: [
              ["Webhook", "Verification, deduplication, fast acknowledgement, and enqueue"],
              ["Worker", "Context, AI call, policy, retries, and timeout"],
              ["WhatsApp adapter", "Templates, message delivery, and status handling"],
            ],
          },
        },
        {
          id: "security-and-privacy",
          heading: "Protect secrets and minimize data",
          paragraphs: [
            "Keep tokens and API keys in a secret manager, restrict service access, and rotate them after exposure. Do not send full history without a reason. Define retention, remove sensitive fields, and tell users when automation processes the conversation.",
          ],
          bullets: [
            "Validate the signature or webhook verification mechanism required by the platform.",
            "Encrypt data in transit and restrict who can read conversation logs.",
            "Never ask for a PIN, OTP, password, or recovery code through the bot.",
          ],
        },
        {
          id: "reliable-and-bounded",
          heading: "Make processing reliable and bounded",
          paragraphs: [
            "Use an idempotency key so redelivered events do not create duplicate replies or actions. Apply timeouts, limited retries, a dead-letter queue, rate limits, and token caps. When AI fails, send a safe response and offer human support.",
          ],
          steps: [
            "Acknowledge the webhook after validation and queue the job for asynchronous work.",
            "Limit time, retries, context length, and maximum cost for each conversation.",
            "Escalate sensitive, uncertain, or repeatedly failing cases to a human agent.",
          ],
        },
        {
          id: "test-and-observe",
          heading: "Test failure cases and observe production",
          paragraphs: [
            "Test duplicate messages, forged webhooks, extremely long input, prompt injection, slow AI responses, and delivery failure. Monitor latency, errors, escalations, satisfaction, and cost per conversation without logging secrets or personal data.",
          ],
        },
      ],
      faq: [
        {
          question: "Should a WhatsApp bot call an AI API from the user's app?",
          answer:
            "No. WhatsApp tokens and AI API keys must stay on the server. The user interacts through WhatsApp while a controlled backend handles provider calls.",
        },
        {
          question: "Why does a WhatsApp AI bot need a queue?",
          answer:
            "A queue keeps the webhook fast, absorbs traffic bursts, controls retries, and prevents slow AI processing from blocking incoming event delivery.",
        },
      ],
    },
  },
} satisfies ArticleDefinition
