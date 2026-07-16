import { sources } from "./sources"
import type { ArticleDefinition } from "./types"

export const tokenCostEstimation = {
  key: "token-cost-estimation",
  category: "developers",
  tags: ["api", "tokens", "cost", "developers", "budgeting"],
  relatedProductSlugs: ["api-key"],
  authorName: "Tim Editorial geraiakun",
  reviewerName: "Tim Teknis geraiakun",
  publishedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
  coverImage: "/images/articles/token-cost-estimation.png",
  sources: [sources.openAiPricing, sources.geminiTokens, sources.geminiPricing],
  translations: {
    id: {
      slug: "cara-menghitung-token-dan-biaya-api",
      title: "Cara Menghitung Token dan Memperkirakan Biaya API AI",
      excerpt:
        "Perkirakan biaya API dari token input, output, model, dan volume permintaan. Gunakan penghitung resmi dan ukur trafik nyata sebelum menetapkan anggaran.",
      seoTitle: "Cara Menghitung Token dan Biaya API AI",
      seoDescription:
        "Pelajari cara menghitung token input dan output, membaca harga model, membuat estimasi biaya API AI, serta memasang anggaran dan peringatan.",
      searchPhrases: ["cara menghitung token ai", "estimasi biaya api ai", "harga token api"],
      intro:
        "Biaya API AI biasanya ditentukan oleh jenis model serta jumlah token input dan output. Estimasi yang berguna memakai harga resmi terbaru, sampel permintaan nyata, distribusi panjang respons, dan margin untuk retry atau lonjakan trafik.",
      keyTakeaways: [
        "Pisahkan token input, output, dan komponen lain karena harganya dapat berbeda.",
        "Gunakan tokenizer atau endpoint penghitung resmi, bukan satu rasio kata yang dianggap pasti.",
        "Ukur biaya per tugas dan persentil tinggi agar anggaran tidak hanya cocok untuk rata-rata.",
      ],
      sections: [
        {
          id: "memahami-token",
          heading: "Pahami apa yang dihitung sebagai token",
          paragraphs: [
            "Token adalah unit pemrosesan teks dan ukurannya berbeda menurut model, bahasa, tanda baca, serta format data. Prompt sistem, riwayat percakapan, dokumen, dan jawaban dapat ikut dihitung. Gunakan alat hitung resmi untuk model yang benar.",
          ],
        },
        {
          id: "rumus-estimasi",
          heading: "Gunakan rumus estimasi yang transparan",
          paragraphs: [
            "Untuk setiap model, kalikan token input dengan harga input per unit, token output dengan harga output, lalu tambahkan komponen lain yang berlaku. Harga berubah, sehingga simpan tanggal harga dan tautan resmi bersama spreadsheet atau dashboard anggaran.",
          ],
          table: {
            headers: ["Komponen", "Perhitungan"],
            rows: [
              ["Input", "Total token input dikali tarif input model saat ini"],
              ["Output", "Total token output dikali tarif output model saat ini"],
              [
                "Operasional",
                "Tambahkan retry, cache, alat, penyimpanan, dan jaringan bila berlaku",
              ],
            ],
          },
        },
        {
          id: "ukur-trafik-nyata",
          heading: "Ukur trafik nyata sebelum memproyeksikan",
          paragraphs: [
            "Ambil sampel permintaan yang mewakili pengguna, lalu catat token input, output, kegagalan, dan retry. Hitung biaya rata-rata serta persentil ke-95. Proyeksi berbasis permintaan terbaik saja akan meremehkan percakapan panjang dan kasus gagal.",
          ],
          steps: [
            "Rekam metadata token dari sedikitnya seratus permintaan representatif tanpa menyimpan rahasia.",
            "Kelompokkan biaya per fitur atau jenis tugas agar sumber pemborosan terlihat.",
            "Kalikan volume harian dengan skenario normal dan skenario lonjakan yang masuk akal.",
          ],
        },
        {
          id: "kendalikan-biaya",
          heading: "Pasang kontrol biaya di aplikasi",
          paragraphs: [
            "Batasi panjang input dan output, ringkas konteks lama, manfaatkan cache resmi bila ekonomis, dan pilih model sesuai kesulitan tugas. Tambahkan anggaran, peringatan, rate limit, serta penghentian aman agar kesalahan loop tidak menghabiskan saldo.",
          ],
        },
      ],
      faq: [
        {
          question: "Apakah satu token selalu sama dengan jumlah kata tertentu?",
          answer:
            "Tidak. Rasio token terhadap kata berubah menurut bahasa, model, dan format. Gunakan tokenizer atau penghitung token resmi untuk estimasi yang dapat dipertanggungjawabkan.",
        },
        {
          question: "Mengapa tagihan lebih tinggi daripada estimasi awal?",
          answer:
            "Penyebab umum adalah konteks percakapan yang terus membesar, output panjang, retry, model berbeda, atau trafik ekstrem yang tidak masuk sampel awal.",
        },
      ],
    },
    en: {
      slug: "how-to-estimate-api-tokens-and-cost",
      title: "How to Count Tokens and Estimate AI API Cost",
      excerpt:
        "Estimate API spending from input tokens, output tokens, model choice, and request volume. Use official counters and measure real traffic before setting a budget.",
      seoTitle: "How to Count Tokens and Estimate AI API Cost",
      seoDescription:
        "Learn how to measure input and output tokens, read current model pricing, estimate AI API costs, and add budgets, alerts, and application safeguards.",
      searchPhrases: ["count ai tokens", "estimate ai api cost", "api token pricing"],
      intro:
        "AI API cost is commonly determined by model choice and the number of input and output tokens. A useful estimate combines current official prices, real request samples, response-length distribution, and room for retries or traffic spikes.",
      keyTakeaways: [
        "Separate input, output, and other billable components because rates can differ.",
        "Use an official tokenizer or counting endpoint instead of treating one word ratio as exact.",
        "Measure cost per task and a high percentile so the budget covers more than the average.",
      ],
      sections: [
        {
          id: "understand-tokens",
          heading: "Understand what counts as a token",
          paragraphs: [
            "A token is a text-processing unit whose size varies by model, language, punctuation, and data format. System prompts, conversation history, documents, and generated answers may all count. Use the official counter for the exact model.",
          ],
        },
        {
          id: "estimation-formula",
          heading: "Use a transparent estimation formula",
          paragraphs: [
            "For each model, multiply input tokens by its input rate and output tokens by its output rate, then add other applicable components. Prices change, so store the price date and official link with the budget spreadsheet or dashboard.",
          ],
          table: {
            headers: ["Component", "Calculation"],
            rows: [
              ["Input", "Total input tokens multiplied by the current model input rate"],
              ["Output", "Total output tokens multiplied by the current model output rate"],
              ["Operations", "Add retries, cache, tools, storage, and network where applicable"],
            ],
          },
        },
        {
          id: "measure-real-traffic",
          heading: "Measure real traffic before projecting",
          paragraphs: [
            "Sample requests that represent actual users and record input tokens, output tokens, failures, and retries. Calculate both mean cost and the 95th percentile. A forecast based only on ideal requests will miss long conversations and failure cases.",
          ],
          steps: [
            "Capture token metadata from at least one hundred representative requests without storing secrets.",
            "Group cost by feature or job type so expensive behavior is visible.",
            "Multiply daily volume under both a normal case and a plausible traffic spike.",
          ],
        },
        {
          id: "control-spending",
          heading: "Add cost controls to the application",
          paragraphs: [
            "Limit input and output length, summarize old context, use supported caching when economical, and select a model appropriate to task difficulty. Add budgets, alerts, rate limits, and a safe stop so a retry loop cannot drain the account.",
          ],
        },
      ],
      faq: [
        {
          question: "Does one token always equal a fixed number of words?",
          answer:
            "No. Token-to-word ratios vary with language, model, and format. Use the provider's tokenizer or counting endpoint for a defensible estimate.",
        },
        {
          question: "Why is the bill higher than the original estimate?",
          answer:
            "Common causes include growing conversation context, long output, retries, a different model, or high-percentile traffic that was absent from the sample.",
        },
      ],
    },
  },
} satisfies ArticleDefinition
