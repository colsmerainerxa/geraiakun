import { sources } from "./sources"
import type { ArticleDefinition } from "./types"

export const aiSubscriptionGuide = {
  key: "ai-subscription-guide",
  category: "guides",
  tags: ["ai", "subscription", "chatgpt", "gemini", "productivity"],
  relatedProductSlugs: ["chatgpt-plus", "gemini-pro"],
  authorName: "Tim Editorial geraiakun",
  reviewerName: "Tim Produk geraiakun",
  publishedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
  coverImage: "/images/articles/ai-subscription-guide.png",
  sources: [sources.chatgptPricing, sources.googleAiPlans, sources.geminiLimits],
  translations: {
    id: {
      slug: "panduan-memilih-langganan-ai",
      title: "Panduan Memilih Langganan AI Sesuai Kebutuhan",
      excerpt:
        "Pilih langganan AI berdasarkan pekerjaan nyata, batas penggunaan, privasi, dan biaya total, bukan hanya nama model atau promosi sesaat.",
      seoTitle: "Panduan Memilih Langganan AI yang Tepat",
      seoDescription:
        "Pelajari cara membandingkan langganan AI berdasarkan kebutuhan, batas pemakaian, privasi, integrasi, dan biaya agar tidak salah memilih paket.",
      searchPhrases: ["langganan ai terbaik", "cara memilih ai", "chatgpt atau gemini"],
      intro:
        "Langganan AI yang tepat adalah layanan yang menyelesaikan pekerjaan rutin Anda dengan batas pemakaian, privasi, dan biaya yang dapat diterima. Mulailah dari alur kerja, lalu uji versi gratis sebelum membayar.",
      keyTakeaways: [
        "Tentukan tiga pekerjaan utama sebelum membandingkan nama paket atau model.",
        "Periksa batas penggunaan dan kebijakan data pada halaman resmi yang terbaru.",
        "Hitung biaya total, termasuk alat tambahan dan waktu untuk memindahkan pekerjaan.",
      ],
      sections: [
        {
          id: "mulai-dari-pekerjaan",
          heading: "Mulai dari pekerjaan yang ingin diselesaikan",
          paragraphs: [
            "Tuliskan tiga aktivitas yang paling sering menghabiskan waktu, misalnya merangkum dokumen, menulis draf, menganalisis data, atau membantu coding. Layanan yang unggul pada kebutuhan nyata lebih bernilai daripada paket dengan daftar fitur terpanjang.",
          ],
          bullets: [
            "Catat format input yang dipakai, seperti teks, PDF, gambar, spreadsheet, atau kode.",
            "Tentukan apakah hasil hanya untuk ide awal atau harus siap masuk proses kerja formal.",
            "Ukur seberapa sering pekerjaan dilakukan dan berapa menit yang ingin dihemat.",
          ],
        },
        {
          id: "uji-versi-gratis",
          heading: "Uji versi gratis dengan skenario yang sama",
          paragraphs: [
            "Gunakan contoh tugas yang sama pada setiap layanan selama beberapa hari. Nilai kualitas jawaban, kemudahan mengoreksi hasil, dukungan file, kecepatan, dan kestabilan. Pengujian yang konsisten memberi gambaran lebih jujur daripada satu demo yang dipilih penyedia.",
          ],
          steps: [
            "Siapkan lima tugas representatif tanpa memasukkan data sensitif atau rahasia.",
            "Gunakan kriteria penilaian yang sama dan catat kegagalan, bukan hanya jawaban terbaik.",
            "Bayar hanya ketika batas versi gratis benar-benar menghambat pekerjaan berulang.",
          ],
        },
        {
          id: "bandingkan-batas-dan-privasi",
          heading: "Bandingkan batas penggunaan dan privasi",
          paragraphs: [
            "Batas pesan dan ketersediaan fitur dapat berubah menurut kapasitas, wilayah, dan jenis akun. Baca halaman resmi tepat sebelum membeli. Untuk dokumen kerja, periksa juga kontrol histori, penggunaan data, retensi, dan aturan organisasi Anda.",
          ],
          table: {
            headers: ["Faktor", "Pertanyaan yang perlu dijawab"],
            rows: [
              ["Batas", "Apakah batas harian atau mingguan cukup untuk pola kerja Anda?"],
              [
                "Data",
                "Apakah konten dapat digunakan untuk peningkatan layanan dan bisa dinonaktifkan?",
              ],
              ["Akses", "Apakah paket ditujukan untuk satu pengguna, keluarga, atau organisasi?"],
            ],
          },
        },
        {
          id: "hitung-biaya-total",
          heading: "Hitung biaya total dan rencana evaluasi",
          paragraphs: [
            "Harga bulanan bukan satu-satunya biaya. Pertimbangkan penyimpanan, alat tambahan, pelatihan, serta waktu saat memindahkan data. Tetapkan tanggal evaluasi setelah satu bulan dan batalkan layanan yang tidak memberi penghematan atau peningkatan kualitas yang terukur.",
          ],
        },
      ],
      faq: [
        {
          question: "Apakah saya perlu berlangganan lebih dari satu layanan AI?",
          answer:
            "Biasanya tidak pada awalnya. Gunakan satu layanan untuk kebutuhan utama, lalu tambahkan layanan kedua hanya jika ada pekerjaan penting yang tidak dapat ditangani dengan baik.",
        },
        {
          question: "Apakah paket yang lebih mahal selalu memberi jawaban lebih baik?",
          answer:
            "Tidak selalu. Paket mahal sering memberi batas lebih tinggi atau fitur tambahan, tetapi kualitas untuk tugas Anda tetap harus diuji dengan contoh pekerjaan yang sama.",
        },
      ],
    },
    en: {
      slug: "how-to-choose-an-ai-subscription",
      title: "How to Choose an AI Subscription for Your Actual Needs",
      excerpt:
        "Choose an AI subscription around real work, usage limits, privacy, and total cost instead of a model name or a short-lived promotion.",
      seoTitle: "How to Choose the Right AI Subscription",
      seoDescription:
        "Compare AI subscriptions by workflow, usage limits, privacy, integrations, and total cost so you can select a plan that delivers measurable value.",
      searchPhrases: ["best ai subscription", "choose an ai plan", "chatgpt or gemini"],
      intro:
        "The right AI subscription handles your recurring work within limits, privacy terms, and a cost you can accept. Start with the workflow, test the free tier, and pay only after a real constraint appears.",
      keyTakeaways: [
        "Define three recurring jobs before comparing plan names or model labels.",
        "Check current usage limits and data controls on the provider's official pages.",
        "Measure total cost, including extra tools and the effort required to switch workflows.",
      ],
      sections: [
        {
          id: "start-with-work",
          heading: "Start with the work you need to complete",
          paragraphs: [
            "List the three activities that consume the most time, such as summarizing documents, drafting copy, analyzing data, or assisting with code. A service that performs those jobs reliably is more valuable than one with the longest feature list.",
          ],
          bullets: [
            "Record the input formats you use, including text, PDFs, images, spreadsheets, and code.",
            "Decide whether output is for early ideas or must enter a formal production workflow.",
            "Measure how often the task occurs and how much time the service should save.",
          ],
        },
        {
          id: "test-free-tiers",
          heading: "Test free tiers with the same scenarios",
          paragraphs: [
            "Run the same representative tasks through each service for several days. Score answer quality, correction effort, file support, speed, and reliability. Consistent testing provides better evidence than a single provider-selected demonstration.",
          ],
          steps: [
            "Prepare five representative tasks that contain no confidential or sensitive data.",
            "Use one scoring rubric and record failures instead of saving only the best responses.",
            "Pay only when a free-tier limit repeatedly blocks useful work.",
          ],
        },
        {
          id: "compare-limits-and-privacy",
          heading: "Compare usage limits and privacy controls",
          paragraphs: [
            "Message caps and feature availability can change with capacity, region, and account type. Read the current official plan page before purchasing. For workplace documents, also check history controls, data use, retention, and organizational policy.",
          ],
          table: {
            headers: ["Factor", "Question to answer"],
            rows: [
              ["Limits", "Will daily or weekly limits cover your normal workload?"],
              ["Data", "Can content be used to improve the service, and can you opt out?"],
              ["Access", "Is the plan designed for an individual, family, or organization?"],
            ],
          },
        },
        {
          id: "calculate-total-cost",
          heading: "Calculate total cost and schedule a review",
          paragraphs: [
            "The monthly price is not the only cost. Include storage, supporting tools, training, and time spent moving information between services. Set a review date after one month and cancel anything that does not produce measurable time or quality gains.",
          ],
        },
      ],
      faq: [
        {
          question: "Do I need subscriptions to more than one AI service?",
          answer:
            "Usually not at the beginning. Use one service for the primary workflow and add another only when an important job remains consistently underserved.",
        },
        {
          question: "Does a more expensive plan always produce better answers?",
          answer:
            "No. Higher tiers often increase limits or add tools, but quality for your specific job still needs to be tested with the same representative examples.",
        },
      ],
    },
  },
} satisfies ArticleDefinition
