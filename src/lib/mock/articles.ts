export interface ArticleSection {
  heading: string
  headingEn: string
  body: string
  bodyEn: string
}

export interface Article {
  slug: string
  title: string
  titleEn: string
  excerpt: string
  excerptEn: string
  category: string
  categoryEn: string
  emoji: string
  accent: string
  date: string // ISO date
  readMinutes: number
  sections: ArticleSection[]
  relatedSlugs: string[] // product slugs for internal linking
}

export const articles: Article[] = [
  {
    slug: "stack-ai-hemat-mahasiswa-2026",
    title: "Stack AI Hemat untuk Mahasiswa di 2026",
    titleEn: "An Affordable AI Stack for Students in 2026",
    excerpt:
      "Tiga tools AI yang saling melengkapi untuk menulis, riset, dan ngoding — semua dengan budget anak kos.",
    excerptEn:
      "Three complementary AI tools for writing, research, and coding — all on a student budget.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "🎓",
    accent: "accent-cyan",
    date: "2026-06-10",
    readMinutes: 6,
    sections: [
      {
        heading: "Kenapa cukup tiga tools?",
        headingEn: "Why three tools are enough",
        body: "Kamu tidak butuh selusin langganan. Cukup satu asisten menulis, satu mesin riset, dan satu akses API untuk bereksperimen. Tiga ini menutup hampir semua kebutuhan akademik tanpa bikin dompet jebol.",
        bodyEn: "You don't need a dozen subscriptions. Just one writing assistant, one research engine, and one API access to experiment with. These three cover almost every academic need without breaking the bank.",
      },
      {
        heading: "Susunan stack-nya",
        headingEn: "The stack",
        body: "ChatGPT Plus untuk menulis esai, menjelaskan konsep sulit, dan brainstorming. Gemini Pro untuk riset mendalam plus integrasi langsung ke Gmail, Docs, dan Sheets. API Key untuk kamu yang mulai ngoding bot atau automasi sendiri — mulai gratis lewat varian Trial.",
        bodyEn: "ChatGPT Plus for essays, explaining hard concepts, and brainstorming. Gemini Pro for deep research plus direct integration with Gmail, Docs, and Sheets. An API Key for those starting to build bots or automation — start free with the Trial variant.",
      },
      {
        heading: "Tips biar maksimal",
        headingEn: "Tips to get the most out of it",
        body: "Selalu verifikasi fakta dari AI dengan sumber asli, pakai AI untuk draf pertama lalu edit dengan gayamu sendiri, dan cantumkan kutipan saat memakai hasil riset. Hemat waktu, tetap jaga integritas akademik.",
        bodyEn: "Always verify AI facts against original sources, use AI for first drafts then edit in your own voice, and cite when using research output. Save time while keeping your academic integrity.",
      },
    ],
    relatedSlugs: ["chatgpt-plus", "gemini-pro", "api-key"],
  },
  {
    slug: "chatgpt-plus-vs-gratis-2026",
    title: "ChatGPT Plus vs Versi Gratis: Masih Worth It di 2026?",
    titleEn: "ChatGPT Plus vs Free: Still Worth It in 2026?",
    excerpt:
      "Versi gratis makin pintar — tapi apakah Plus masih layak dibeli? Ini perbandingan jujurnya.",
    excerptEn:
      "The free tier keeps getting smarter — but is Plus still worth it? Here's the honest comparison.",
    category: "Review",
    categoryEn: "Review",
    emoji: "🤖",
    accent: "accent-lime",
    date: "2026-06-14",
    readMinutes: 5,
    sections: [
      {
        heading: "Apa yang kamu dapat di Plus",
        headingEn: "What you get with Plus",
        body: "Akses ke model terbaru tanpa antre, limit pesan jauh lebih tinggi, prioritas saat trafik ramai, plus fitur seperti analisis file dan pembuatan gambar. Buat yang pakai harian, perbedaannya terasa banget di kecepatan dan kualitas jawaban.",
        bodyEn: "Access to the latest models without queues, much higher message limits, priority during busy hours, plus features like file analysis and image generation. For daily users, the difference in speed and answer quality is very noticeable.",
      },
      {
        heading: "Kapan versi gratis sudah cukup",
        headingEn: "When the free tier is enough",
        body: "Kalau kamu cuma sesekali bertanya hal ringan, versi gratis 2026 sudah sangat mumpuni. Plus jadi worth it ketika AI sudah jadi bagian alur kerja harian — coding, menulis panjang, atau riset intens.",
        bodyEn: "If you only occasionally ask light questions, the 2026 free tier is already very capable. Plus becomes worth it once AI is part of your daily workflow — coding, long-form writing, or intense research.",
      },
      {
        heading: "Putusan akhir",
        headingEn: "The verdict",
        body: "Untuk pelajar dan profesional yang produktif, Plus tetap salah satu langganan dengan ROI terbaik. Apalagi kalau kamu bisa dapat dengan harga yang lebih ramah kantong.",
        bodyEn: "For productive students and professionals, Plus remains one of the best-ROI subscriptions — especially if you can get it at a more budget-friendly price.",
      },
    ],
    relatedSlugs: ["chatgpt-plus", "gemini-pro"],
  },
  {
    slug: "sharing-vs-private-chatgpt-plus",
    title: "Sharing vs Private: Pilih Akun ChatGPT Plus yang Mana?",
    titleEn: "Sharing vs Private: Which ChatGPT Plus Account Should You Pick?",
    excerpt:
      "Dua tipe akun, dua harga, satu kebutuhan. Ini panduan singkat memilih yang paling pas buatmu.",
    excerptEn:
      "Two account types, two prices, one need. Here's a quick guide to picking the right one.",
    category: "Tips",
    categoryEn: "Tips",
    emoji: "🔐",
    accent: "accent-pink",
    date: "2026-06-18",
    readMinutes: 4,
    sections: [
      {
        heading: "Apa itu akun Sharing",
        headingEn: "What a Sharing account is",
        body: "Akun sharing dipakai bersama beberapa pengguna dengan harga jauh lebih hemat. Cocok untuk kamu yang butuh akses Plus sesekali dan tidak menyimpan data sensitif di dalamnya. Kuncinya: jangan mengganti email atau password akun.",
        bodyEn: "A sharing account is used together by a few users at a much friendlier price. Great if you need Plus access occasionally and don't store sensitive data in it. The key rule: don't change the account email or password.",
      },
      {
        heading: "Apa itu akun Private",
        headingEn: "What a Private account is",
        body: "Akun private sepenuhnya milikmu dengan login pribadi. Cocok untuk kamu yang pakai ChatGPT Plus tiap hari, butuh riwayat chat tersimpan, dan menjaga privasi obrolan. Harganya lebih tinggi, tapi sebanding dengan kenyamanannya.",
        bodyEn: "A private account is fully yours with your own login. Ideal if you use ChatGPT Plus daily, need your chat history saved, and value conversation privacy. It costs more, but the comfort is worth it.",
      },
      {
        heading: "Jadi, pilih yang mana?",
        headingEn: "So which one?",
        body: "Butuh hemat dan pemakaian ringan? Ambil Sharing. Pakai harian dan ingin akun pribadi penuh? Private jawabannya. Apa pun pilihanmu, pastikan akun bergaransi selama masa aktif.",
        bodyEn: "Want to save and only use it lightly? Go Sharing. Use it daily and want a fully personal account? Private is the answer. Whichever you pick, make sure the account is warranted during its active period.",
      },
    ],
    relatedSlugs: ["chatgpt-plus"],
  },
  {
    slug: "panduan-api-key-pemula",
    title: "Panduan API Key untuk Pemula: Trial, Basic, atau Pro?",
    titleEn: "API Key Guide for Beginners: Trial, Basic, or Pro?",
    excerpt:
      "Mau bikin bot atau automasi sendiri? Mulai dari sini — pahami token dan pilih paket yang pas.",
    excerptEn:
      "Want to build your own bot or automation? Start here — understand tokens and pick the right plan.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "🔑",
    accent: "accent-purple",
    date: "2026-06-22",
    readMinutes: 5,
    sections: [
      {
        heading: "API key & token itu apa, sih?",
        headingEn: "What are API keys and tokens?",
        body: "API key adalah kunci yang membuat aplikasimu bisa memanggil model AI lewat kode. Setiap permintaan menghabiskan token — satuan kecil potongan teks. Makin panjang prompt dan jawaban, makin banyak token terpakai.",
        bodyEn: "An API key is a key that lets your app call AI models through code. Each request consumes tokens — tiny chunks of text. The longer your prompt and response, the more tokens are used.",
      },
      {
        heading: "Beda Trial, Basic, dan Pro",
        headingEn: "Trial, Basic, and Pro compared",
        body: "Trial gratis cocok untuk coba-coba dan belajar. Basic memberi 10 juta token untuk eksperimen yang lebih serius. Pro memberi 5 juta token untuk model kelas atas — jumlah token lebih sedikit karena modelnya lebih canggih dan 'berat'.",
        bodyEn: "The free Trial is great for testing and learning. Basic gives 10 million tokens for more serious experiments. Pro gives 5 million tokens for higher-tier models — fewer tokens because the models are more advanced and 'heavier'.",
      },
      {
        heading: "Tips hemat token",
        headingEn: "Tips to save tokens",
        body: "Tulis prompt yang ringkas, batasi panjang jawaban lewat parameter, dan manfaatkan caching untuk konteks yang berulang. Mulai dari Trial, ukur pemakaianmu, baru naik ke Basic atau Pro sesuai kebutuhan.",
        bodyEn: "Write concise prompts, cap response length via parameters, and use caching for repeated context. Start with the Trial, measure your usage, then move up to Basic or Pro as needed.",
      },
    ],
    relatedSlugs: ["api-key", "gemini-pro"],
  },
]

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug)
}

export function relatedArticles(slug: string, limit = 3) {
  return articles.filter((a) => a.slug !== slug).slice(0, limit)
}
