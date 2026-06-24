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
    slug: "tools-ai-wajib-mahasiswa-2026",
    title: "5 Tools AI Wajib untuk Mahasiswa di 2026",
    titleEn: "5 Must-Have AI Tools for Students in 2026",
    excerpt:
      "Dari menulis esai sampai riset cepat, ini lima tools AI yang bikin hidup anak kuliah jauh lebih ringan tahun ini.",
    excerptEn:
      "From essay writing to fast research, here are five AI tools that make student life dramatically easier this year.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "🎓",
    accent: "accent-cyan",
    date: "2026-06-10",
    readMinutes: 6,
    sections: [
      {
        heading: "Kenapa mahasiswa butuh tools AI?",
        headingEn: "Why students need AI tools",
        body: "Beban tugas, deadline, dan riset yang menumpuk bisa dipangkas drastis dengan asisten AI yang tepat. Kuncinya bukan menggantikan otakmu, tapi mempercepat bagian yang repetitif: merangkum bacaan, brainstorming ide, dan merapikan tulisan.",
        bodyEn: "Assignments, deadlines, and piling research can be cut down drastically with the right AI assistant. The point isn't to replace your brain, but to speed up the repetitive parts: summarizing readings, brainstorming, and polishing your writing.",
      },
      {
        heading: "Daftar tools-nya",
        headingEn: "The tool list",
        body: "ChatGPT Plus untuk menulis & menjelaskan konsep sulit, Gemini Advanced untuk integrasi Google Workspace, Perplexity Pro untuk riset dengan sumber real-time, Notion AI untuk merapikan catatan, dan Canva Pro untuk presentasi yang rapi. Kombinasi ini menutup hampir semua kebutuhan akademik.",
        bodyEn: "ChatGPT Plus for writing & explaining hard concepts, Gemini Advanced for Google Workspace integration, Perplexity Pro for research with real-time sources, Notion AI to tidy your notes, and Canva Pro for clean presentations. Together they cover almost every academic need.",
      },
      {
        heading: "Tips pakai biar maksimal",
        headingEn: "Tips to get the most out of them",
        body: "Selalu verifikasi fakta dari AI dengan sumber asli, gunakan AI untuk draf pertama lalu edit dengan gayamu sendiri, dan jangan lupa cantumkan kutipan saat memakai hasil riset. Hemat waktu, tetap jaga integritas akademik.",
        bodyEn: "Always verify AI facts against original sources, use AI for first drafts then edit in your own voice, and remember to cite when using research output. Save time while keeping your academic integrity.",
      },
    ],
    relatedSlugs: [
      "chatgpt-plus",
      "gemini-advanced",
      "perplexity-pro",
      "notion-plus",
    ],
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
    relatedSlugs: ["chatgpt-plus", "claude-pro", "perplexity-pro"],
  },
  {
    slug: "cara-hemat-langganan-streaming",
    title: "Cara Hemat Langganan Streaming Tanpa Bokek",
    titleEn: "How to Save on Streaming Subscriptions Without Going Broke",
    excerpt:
      "Netflix, Spotify, YouTube Premium — semuanya bikin dompet tipis kalau langganan sendiri-sendiri. Ini cara nikmatinya tetap hemat.",
    excerptEn:
      "Netflix, Spotify, YouTube Premium — they all thin your wallet if you subscribe separately. Here's how to enjoy them affordably.",
    category: "Tips",
    categoryEn: "Tips",
    emoji: "🍿",
    accent: "accent-pink",
    date: "2026-06-18",
    readMinutes: 4,
    sections: [
      {
        heading: "Audit dulu kebutuhanmu",
        headingEn: "Audit your needs first",
        body: "Sebelum langganan, cek seberapa sering kamu benar-benar memakai tiap layanan. Banyak orang bayar penuh untuk platform yang dibuka sebulan sekali. Pilih yang benar-benar masuk rutinitas harianmu.",
        bodyEn: "Before subscribing, check how often you actually use each service. Many people pay full price for platforms they open once a month. Pick the ones that genuinely fit your daily routine.",
      },
      {
        heading: "Manfaatkan paket & durasi panjang",
        headingEn: "Use bundles and longer durations",
        body: "Langganan tahunan biasanya jauh lebih murah per bulan dibanding bayar bulanan. Begitu juga paket bundling beberapa layanan. Hitung biaya per bulan, bukan harga depannya, biar tahu mana yang paling hemat.",
        bodyEn: "Annual plans are usually much cheaper per month than paying monthly. Same with bundling several services. Calculate the monthly cost, not the upfront price, to see which is most economical.",
      },
      {
        heading: "Pastikan akun bergaransi",
        headingEn: "Make sure accounts are warranted",
        body: "Apa pun cara hematmu, pastikan layanan yang kamu pakai memberi garansi selama masa aktif. Akun yang jelas dan bergaransi menyelamatkanmu dari drama di tengah jalan.",
        bodyEn: "Whatever way you save, make sure the service you use offers a warranty during the active period. A clear, warranted account saves you from mid-way headaches.",
      },
    ],
    relatedSlugs: [
      "netflix-premium",
      "spotify-premium",
      "youtube-premium",
      "disney-hotstar",
    ],
  },
  {
    slug: "panduan-canva-pro-pemula",
    title: "Panduan Canva Pro: Bikin Konten Estetik buat Pemula",
    titleEn: "Canva Pro Guide: Make Aesthetic Content as a Beginner",
    excerpt:
      "Nggak perlu jago desain. Dengan Canva Pro, siapa pun bisa bikin feed dan presentasi yang enak dilihat dalam hitungan menit.",
    excerptEn:
      "No design skills needed. With Canva Pro, anyone can make good-looking feeds and decks in minutes.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "🎨",
    accent: "accent-purple",
    date: "2026-06-22",
    readMinutes: 5,
    sections: [
      {
        heading: "Mulai dari template, bukan kanvas kosong",
        headingEn: "Start from a template, not a blank canvas",
        body: "Kesalahan pemula adalah mulai dari nol. Canva Pro punya jutaan template profesional — pilih yang dekat dengan kebutuhanmu, lalu ganti teks, warna, dan foto. Hasilnya rapi tanpa harus paham teori desain.",
        bodyEn: "A beginner mistake is starting from scratch. Canva Pro has millions of professional templates — pick one close to your need, then swap the text, colors, and photos. The result looks clean without any design theory.",
      },
      {
        heading: "Fitur Pro yang paling berguna",
        headingEn: "The most useful Pro features",
        body: "Background remover satu klik, Magic Resize untuk ubah ukuran ke semua platform, Brand Kit biar warna dan font konsisten, serta jutaan aset premium. Empat fitur ini saja sudah mempercepat alur kontenmu berkali lipat.",
        bodyEn: "One-click background remover, Magic Resize to fit every platform, Brand Kit to keep colors and fonts consistent, and millions of premium assets. These four alone speed up your content workflow many times over.",
      },
      {
        heading: "Konsisten lebih penting dari sempurna",
        headingEn: "Consistency beats perfection",
        body: "Tentukan dua-tiga warna dan satu font utama, lalu pakai terus di semua konten. Konsistensi visual bikin akunmu terlihat profesional jauh sebelum kontennya viral.",
        bodyEn: "Pick two or three colors and one main font, then use them across all your content. Visual consistency makes your account look professional long before any post goes viral.",
      },
    ],
    relatedSlugs: ["canva-pro", "capcut-pro", "figma-professional"],
  },
]

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug)
}

export function relatedArticles(slug: string, limit = 3) {
  return articles.filter((a) => a.slug !== slug).slice(0, limit)
}
