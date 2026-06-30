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
      "Tiga tools AI yang saling melengkapi untuk menulis, riset, dan ngoding � semua dengan budget anak kos.",
    excerptEn:
      "Three complementary AI tools for writing, research, and coding � all on a student budget.",
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
        bodyEn:
          "You don't need a dozen subscriptions. Just one writing assistant, one research engine, and one API access to experiment with. These three cover almost every academic need without breaking the bank.",
      },
      {
        heading: "Susunan stack-nya",
        headingEn: "The stack",
        body: "ChatGPT Plus untuk menulis esai, menjelaskan konsep sulit, dan brainstorming. Gemini Pro untuk riset mendalam plus integrasi langsung ke Gmail, Docs, dan Sheets. API Key untuk kamu yang mulai ngoding bot atau automasi sendiri � mulai gratis lewat varian Trial.",
        bodyEn:
          "ChatGPT Plus for essays, explaining hard concepts, and brainstorming. Gemini Pro for deep research plus direct integration with Gmail, Docs, and Sheets. An API Key for those starting to build bots or automation � start free with the Trial variant.",
      },
      {
        heading: "Tips biar maksimal",
        headingEn: "Tips to get the most out of it",
        body: "Selalu verifikasi fakta dari AI dengan sumber asli, pakai AI untuk draf pertama lalu edit dengan gayamu sendiri, dan cantumkan kutipan saat memakai hasil riset. Hemat waktu, tetap jaga integritas akademik.",
        bodyEn:
          "Always verify AI facts against original sources, use AI for first drafts then edit in your own voice, and cite when using research output. Save time while keeping your academic integrity.",
      },
    ],
    relatedSlugs: ["chatgpt-plus", "gemini-pro", "api-key"],
  },
  {
    slug: "chatgpt-plus-vs-gratis-2026",
    title: "ChatGPT Plus vs Versi Gratis: Masih Worth It di 2026?",
    titleEn: "ChatGPT Plus vs Free: Still Worth It in 2026?",
    excerpt:
      "Versi gratis makin pintar � tapi apakah Plus masih layak dibeli? Ini perbandingan jujurnya.",
    excerptEn:
      "The free tier keeps getting smarter � but is Plus still worth it? Here's the honest comparison.",
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
        bodyEn:
          "Access to the latest models without queues, much higher message limits, priority during busy hours, plus features like file analysis and image generation. For daily users, the difference in speed and answer quality is very noticeable.",
      },
      {
        heading: "Kapan versi gratis sudah cukup",
        headingEn: "When the free tier is enough",
        body: "Kalau kamu cuma sesekali bertanya hal ringan, versi gratis 2026 sudah sangat mumpuni. Plus jadi worth it ketika AI sudah jadi bagian alur kerja harian � coding, menulis panjang, atau riset intens.",
        bodyEn:
          "If you only occasionally ask light questions, the 2026 free tier is already very capable. Plus becomes worth it once AI is part of your daily workflow � coding, long-form writing, or intense research.",
      },
      {
        heading: "Putusan akhir",
        headingEn: "The verdict",
        body: "Untuk pelajar dan profesional yang produktif, Plus tetap salah satu langganan dengan ROI terbaik. Apalagi kalau kamu bisa dapat dengan harga yang lebih ramah kantong.",
        bodyEn:
          "For productive students and professionals, Plus remains one of the best-ROI subscriptions � especially if you can get it at a more budget-friendly price.",
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
        bodyEn:
          "A sharing account is used together by a few users at a much friendlier price. Great if you need Plus access occasionally and don't store sensitive data in it. The key rule: don't change the account email or password.",
      },
      {
        heading: "Apa itu akun Private",
        headingEn: "What a Private account is",
        body: "Akun private sepenuhnya milikmu dengan login pribadi. Cocok untuk kamu yang pakai ChatGPT Plus tiap hari, butuh riwayat chat tersimpan, dan menjaga privasi obrolan. Harganya lebih tinggi, tapi sebanding dengan kenyamanannya.",
        bodyEn:
          "A private account is fully yours with your own login. Ideal if you use ChatGPT Plus daily, need your chat history saved, and value conversation privacy. It costs more, but the comfort is worth it.",
      },
      {
        heading: "Jadi, pilih yang mana?",
        headingEn: "So which one?",
        body: "Butuh hemat dan pemakaian ringan? Ambil Sharing. Pakai harian dan ingin akun pribadi penuh? Private jawabannya. Apa pun pilihanmu, pastikan akun bergaransi selama masa aktif.",
        bodyEn:
          "Want to save and only use it lightly? Go Sharing. Use it daily and want a fully personal account? Private is the answer. Whichever you pick, make sure the account is warranted during its active period.",
      },
    ],
    relatedSlugs: ["chatgpt-plus"],
  },
  {
    slug: "panduan-api-key-pemula",
    title: "Panduan API Key untuk Pemula: Trial, Basic, atau Pro?",
    titleEn: "API Key Guide for Beginners: Trial, Basic, or Pro?",
    excerpt:
      "Mau bikin bot atau automasi sendiri? Mulai dari sini � pahami token dan pilih paket yang pas.",
    excerptEn:
      "Want to build your own bot or automation? Start here � understand tokens and pick the right plan.",
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
        body: "API key adalah kunci yang membuat aplikasimu bisa memanggil model AI lewat kode. Setiap permintaan menghabiskan token � satuan kecil potongan teks. Makin panjang prompt dan jawaban, makin banyak token terpakai.",
        bodyEn:
          "An API key is a key that lets your app call AI models through code. Each request consumes tokens � tiny chunks of text. The longer your prompt and response, the more tokens are used.",
      },
      {
        heading: "Beda Trial, Basic, dan Pro",
        headingEn: "Trial, Basic, and Pro compared",
        body: "Trial gratis cocok untuk coba-coba dan belajar. Basic memberi 10 juta token untuk eksperimen yang lebih serius. Pro memberi 5 juta token untuk model kelas atas � jumlah token lebih sedikit karena modelnya lebih canggih dan 'berat'.",
        bodyEn:
          "The free Trial is great for testing and learning. Basic gives 10 million tokens for more serious experiments. Pro gives 5 million tokens for higher-tier models � fewer tokens because the models are more advanced and 'heavier'.",
      },
      {
        heading: "Tips hemat token",
        headingEn: "Tips to save tokens",
        body: "Tulis prompt yang ringkas, batasi panjang jawaban lewat parameter, dan manfaatkan caching untuk konteks yang berulang. Mulai dari Trial, ukur pemakaianmu, baru naik ke Basic atau Pro sesuai kebutuhan.",
        bodyEn:
          "Write concise prompts, cap response length via parameters, and use caching for repeated context. Start with the Trial, measure your usage, then move up to Basic or Pro as needed.",
      },
    ],
    relatedSlugs: ["api-key", "gemini-pro"],
  },
  {
    slug: "aktifkan-gemini-pro-invite-vs-login",
    title: "Cara Aktifkan Gemini Pro: Via Invite vs Via Login",
    titleEn: "How to Activate Gemini Pro: via Invite vs via Login",
    excerpt:
      "Dua metode aktivasi, satu hasil yang sama: Gemini Pro aktif. Ini bedanya dan cara pakainya.",
    excerptEn:
      "Two activation methods, one same result: Gemini Pro active. Here's the difference and how to use them.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "✨",
    accent: "accent-blue",
    date: "2026-06-24",
    readMinutes: 4,
    sections: [
      {
        heading: "Apa beda Via Invite dan Via Login?",
        headingEn: "Invite vs Login: what's the difference?",
        body: "Via Invite berarti kamu diundang ke sebuah grup/family, lalu login memakai email Google milikmu sendiri � paling nyaman karena data tetap di akunmu. Via Login berarti kamu diberi kredensial untuk masuk ke akun yang sudah Pro.",
        bodyEn:
          "Via Invite means you're invited into a group/family, then sign in with your own Google email � the most comfortable since your data stays on your account. Via Login means you're given credentials to sign in to an already-Pro account.",
      },
      {
        heading: "Langkah aktivasi Via Invite",
        headingEn: "Activating via Invite",
        body: "Cek email Google-mu, buka undangan yang masuk, lalu terima. Gemini Pro langsung aktif di akunmu sendiri dalam beberapa menit. Tidak perlu ganti password apa pun.",
        bodyEn:
          "Check your Google email, open the incoming invite, then accept. Gemini Pro activates on your own account within minutes. No password changes needed.",
      },
      {
        heading: "Langkah aktivasi Via Login",
        headingEn: "Activating via Login",
        body: "Login memakai email & password yang kami kirim, dan jangan mengubah keduanya agar akun tetap stabil. Cocok jika kamu tidak masalah memakai akun terpisah dari email utamamu.",
        bodyEn:
          "Sign in with the email & password we send, and don't change either so the account stays stable. Great if you don't mind using an account separate from your main email.",
      },
    ],
    relatedSlugs: ["gemini-pro"],
  },
  {
    slug: "chatgpt-plus-logout-sendiri-solusi",
    title: "ChatGPT Plus Tiba-tiba Logout? Ini Penyebab & Solusinya",
    titleEn: "ChatGPT Plus Logging You Out? Causes & Fixes",
    excerpt:
      "Ke-logout di tengah ngerjain tugas itu nyebelin. Ini alasan umumnya dan cara cepat mengatasinya.",
    excerptEn:
      "Getting logged out mid-task is annoying. Here are the common reasons and quick fixes.",
    category: "Tips",
    categoryEn: "Tips",
    emoji: "🤖",
    accent: "accent-cyan",
    date: "2026-06-23",
    readMinutes: 3,
    sections: [
      {
        heading: "Kenapa bisa ke-logout?",
        headingEn: "Why does it log out?",
        body: "Penyebab paling umum adalah login di terlalu banyak perangkat sekaligus, atau pada akun sharing yang sedang dipakai bersamaan. Sistem keamanan akan menendang sesi paling lama untuk menjaga akun.",
        bodyEn:
          "The most common cause is signing in on too many devices at once, or a sharing account being used simultaneously. The security system kicks the oldest session to protect the account.",
      },
      {
        heading: "Solusi cepat",
        headingEn: "Quick fixes",
        body: "Login ulang dengan kredensial yang sama dan jangan mengubah password. Kalau masih sering ke-logout, hubungi CS kami � selama masa garansi kami bantu cek atau ganti akun tanpa biaya.",
        bodyEn:
          "Sign in again with the same credentials and don't change the password. If it keeps logging out, contact our support � within the warranty period we'll check or replace it free of charge.",
      },
      {
        heading: "Biar lebih stabil",
        headingEn: "For more stability",
        body: "Kalau kamu pakai ChatGPT Plus intens setiap hari, varian Private jauh lebih stabil karena akun sepenuhnya milikmu sendiri tanpa berbagi sesi.",
        bodyEn:
          "If you use ChatGPT Plus intensely every day, the Private variant is far more stable since the account is fully yours with no shared sessions.",
      },
    ],
    relatedSlugs: ["chatgpt-plus"],
  },
  {
    slug: "chatgpt-plus-atau-gemini-pro-2026",
    title: "ChatGPT Plus atau Gemini Pro? Panduan Memilih di 2026",
    titleEn: "ChatGPT Plus or Gemini Pro? A 2026 Buying Guide",
    excerpt:
      "Dua raksasa AI, dua kekuatan berbeda. Ini cara memilih yang paling pas dengan kebutuhanmu.",
    excerptEn:
      "Two AI giants, two different strengths. Here's how to pick the one that fits you best.",
    category: "Review",
    categoryEn: "Review",
    emoji: "⚖️",
    accent: "accent-purple",
    date: "2026-06-08",
    readMinutes: 5,
    sections: [
      {
        heading: "Kekuatan ChatGPT Plus",
        headingEn: "Where ChatGPT Plus shines",
        body: "Paling kuat untuk menulis, menjelaskan konsep rumit, brainstorming, dan coding. Reasoning-nya tajam dan ekosistem pluginnya luas. Pilihan utama kalau pekerjaanmu banyak berkutat dengan teks dan kode.",
        bodyEn:
          "Strongest for writing, explaining complex concepts, brainstorming, and coding. Its reasoning is sharp and its plugin ecosystem is broad. The top pick if your work revolves around text and code.",
      },
      {
        heading: "Kekuatan Gemini Pro",
        headingEn: "Where Gemini Pro shines",
        body: "Unggul untuk riset mendalam dengan sumber, plus integrasi mulus ke Gmail, Docs, dan Sheets � ditambah bonus Google One 2TB. Cocok kalau kamu hidup di ekosistem Google.",
        bodyEn:
          "Excels at deep, sourced research, plus seamless integration with Gmail, Docs, and Sheets � with a Google One 2TB bonus. Ideal if you live in the Google ecosystem.",
      },
      {
        heading: "Jadi, pilih yang mana?",
        headingEn: "So which one?",
        body: "Banyak pengguna serius justru memakai keduanya: ChatGPT Plus untuk menulis & coding, Gemini Pro untuk riset & dokumen. Kalau budget terbatas, mulai dari yang paling sering kamu butuhkan dulu.",
        bodyEn:
          "Many power users actually run both: ChatGPT Plus for writing & coding, Gemini Pro for research & documents. On a tight budget, start with the one you'll need most.",
      },
    ],
    relatedSlugs: ["chatgpt-plus", "gemini-pro"],
  },
  {
    slug: "estimasi-token-api-key",
    title: "Estimasi Token API Key: Berapa Token yang Kamu Butuh?",
    titleEn: "API Key Token Estimates: How Many Do You Need?",
    excerpt:
      "Bingung pilih Basic atau Pro? Pahami dulu berapa token yang biasanya dihabiskan tiap pemakaian.",
    excerptEn:
      "Unsure between Basic and Pro? First understand how many tokens typical usage burns.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "🔑",
    accent: "accent-lime",
    date: "2026-06-04",
    readMinutes: 4,
    sections: [
      {
        heading: "1 token itu seberapa?",
        headingEn: "How big is one token?",
        body: "Sebagai patokan kasar, 1 token kira-kira setara 4 karakter atau sekitar 0,75 kata dalam bahasa Inggris. Jadi 1.000 token kira-kira 750 kata � gabungan prompt dan jawaban.",
        bodyEn:
          "As a rough rule, 1 token is about 4 characters or roughly 0.75 English words. So 1,000 tokens is about 750 words � combining the prompt and the response.",
      },
      {
        heading: "Contoh estimasi pemakaian",
        headingEn: "Usage estimate examples",
        body: "Chatbot ringan bisa menghabiskan ratusan token per percakapan, sementara meringkas dokumen panjang bisa ribuan token sekali jalan. Automasi yang sering memanggil API tentu lebih boros.",
        bodyEn:
          "A light chatbot might burn hundreds of tokens per conversation, while summarizing a long document can take thousands in one go. Automation that calls the API frequently uses far more.",
      },
      {
        heading: "Pilih paket yang pas",
        headingEn: "Pick the right plan",
        body: "Mulai dari Trial gratis untuk mengukur pola pemakaianmu. Butuh volume? Basic memberi 10 juta token. Mau model kelas atas? Pro memberi 5 juta token dengan kualitas lebih tinggi.",
        bodyEn:
          "Start with the free Trial to measure your usage pattern. Need volume? Basic gives 10 million tokens. Want a higher-tier model? Pro gives 5 million tokens at higher quality.",
      },
    ],
    relatedSlugs: ["api-key"],
  },
  {
    slug: "cara-bayar-qris-akun-premium",
    title: "Cara Bayar QRIS untuk Akun Premium (Anti Ribet)",
    titleEn: "How to Pay with QRIS for Premium Accounts (Hassle-Free)",
    excerpt:
      "QRIS bikin bayar akun premium gampang banget � satu scan dari e-wallet mana pun. Ini langkahnya.",
    excerptEn:
      "QRIS makes paying for premium accounts super easy � one scan from any e-wallet. Here are the steps.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "💳",
    accent: "accent-cyan",
    date: "2026-06-25",
    readMinutes: 3,
    sections: [
      {
        heading: "Kenapa QRIS?",
        headingEn: "Why QRIS?",
        body: "QRIS bisa dibayar dari hampir semua e-wallet dan m-banking � GoPay, OVO, DANA, ShopeePay, sampai mobile banking. Cukup satu kode, tanpa pusing pilih channel. Pembayaran terverifikasi otomatis.",
        bodyEn:
          "QRIS can be paid from almost any e-wallet and mobile bank � GoPay, OVO, DANA, ShopeePay, even mobile banking. Just one code, no need to pick a channel. Payment is auto-verified.",
      },
      {
        heading: "Langkah bayar",
        headingEn: "Payment steps",
        body: "Pilih produk & varian, lanjut ke checkout, pilih metode QRIS, lalu scan kode yang muncul dengan aplikasi e-wallet kamu. Setelah terbayar, detail akun otomatis dikirim ke email dan dashboard.",
        bodyEn:
          "Pick a product & variant, go to checkout, choose QRIS, then scan the code with your e-wallet app. Once paid, account details are sent automatically to your email and dashboard.",
      },
    ],
    relatedSlugs: ["chatgpt-plus", "gemini-pro"],
  },
  {
    slug: "apa-itu-akun-private",
    title: "Apa Itu Akun Private dan Kenapa Lebih Aman?",
    titleEn: "What Is a Private Account and Why Is It Safer?",
    excerpt:
      "Akun private = login sepenuhnya milikmu. Ini kelebihannya dibanding sharing, dan kapan kamu butuh.",
    excerptEn:
      "A private account = a login that's fully yours. Here are its advantages over sharing, and when you need it.",
    category: "Tips",
    categoryEn: "Tips",
    emoji: "🔒",
    accent: "accent-blue",
    date: "2026-06-20",
    readMinutes: 3,
    sections: [
      {
        heading: "Definisi singkat",
        headingEn: "Quick definition",
        body: "Akun private adalah akun yang hanya kamu yang pakai, dengan login sendiri. Tidak ada pengguna lain yang berbagi sesi, sehingga lebih stabil dan privasimu lebih terjaga.",
        bodyEn:
          "A private account is one only you use, with your own login. No other users share the session, so it's more stable and your privacy is better protected.",
      },
      {
        heading: "Kapan butuh private?",
        headingEn: "When do you need private?",
        body: "Kalau kamu memakai layanannya setiap hari, menyimpan riwayat penting, atau butuh keandalan tinggi (mis. kerja/klien), private adalah pilihan tepat. Untuk pemakaian ringan dan hemat, sharing sudah cukup.",
        bodyEn:
          "If you use the service daily, store important history, or need high reliability (e.g. work/clients), private is the right pick. For light, budget use, sharing is enough.",
      },
    ],
    relatedSlugs: ["chatgpt-plus", "gemini-pro"],
  },
  {
    slug: "gemini-pro-untuk-skripsi",
    title: "Gemini Pro untuk Skripsi: Riset & Nulis Lebih Cepat",
    titleEn: "Gemini Pro for Your Thesis: Faster Research & Writing",
    excerpt:
      "Mentok di bab 2? Gemini Pro bisa bantu riset, merapikan tulisan, dan terhubung langsung ke Docs.",
    excerptEn:
      "Stuck on chapter 2? Gemini Pro can help with research, polishing your writing, and connects right into Docs.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "📚",
    accent: "accent-purple",
    date: "2026-06-12",
    readMinutes: 4,
    sections: [
      {
        heading: "Riset literatur lebih cepat",
        headingEn: "Faster literature research",
        body: "Pakai Deep Research untuk merangkum banyak sumber sekaligus dan menemukan celah penelitian. Tetap verifikasi tiap klaim ke sumber aslinya dan catat sitasinya sejak awal.",
        bodyEn:
          "Use Deep Research to summarize many sources at once and find research gaps. Always verify each claim against the original source and note citations from the start.",
      },
      {
        heading: "Nulis & rapikan di Docs",
        headingEn: "Write & polish in Docs",
        body: "Karena terintegrasi dengan Google Docs, kamu bisa minta bantuan merapikan kalimat, memperbaiki struktur, dan menyesuaikan gaya bahasa akademik langsung di dokumenmu.",
        bodyEn:
          "Since it integrates with Google Docs, you can ask for help tidying sentences, improving structure, and matching an academic tone right inside your document.",
      },
      {
        heading: "Etika & integritas",
        headingEn: "Ethics & integrity",
        body: "Jadikan AI sebagai asisten, bukan penulis utama. Ide dan analisis tetap milikmu; AI mempercepat bagian teknis. Cek aturan kampusmu soal penggunaan AI.",
        bodyEn:
          "Treat AI as an assistant, not the main author. Ideas and analysis stay yours; AI speeds up the technical parts. Check your campus rules on AI use.",
      },
    ],
    relatedSlugs: ["gemini-pro", "chatgpt-plus"],
  },
  {
    slug: "bikin-bot-whatsapp-api-key",
    title: "Bikin Bot WhatsApp dengan API Key: Langkah Awal",
    titleEn: "Build a WhatsApp Bot with an API Key: First Steps",
    excerpt:
      "Mau bot WA yang bisa jawab otomatis pakai AI? Ini gambaran besar dan cara mulai dengan API Key.",
    excerptEn:
      "Want a WhatsApp bot that auto-replies with AI? Here's the big picture and how to start with an API Key.",
    category: "Panduan",
    categoryEn: "Guide",
    emoji: "🤖",
    accent: "accent-lime",
    date: "2026-06-06",
    readMinutes: 5,
    sections: [
      {
        heading: "Komponen yang dibutuhkan",
        headingEn: "What you'll need",
        body: "Tiga bahan utama: gateway WhatsApp (mis. API resmi atau library), server kecil untuk menerima pesan, dan API Key AI untuk menghasilkan balasan. Token dari API Key inilah yang 'menghidupkan' balasan cerdas botmu.",
        bodyEn:
          "Three main ingredients: a WhatsApp gateway (e.g. the official API or a library), a small server to receive messages, and an AI API Key to generate replies. The API Key's tokens are what 'power' your bot's smart responses.",
      },
      {
        heading: "Alur sederhananya",
        headingEn: "The simple flow",
        body: "Pesan masuk → server kirim teks ke model lewat API Key → model balas → server teruskan ke WhatsApp. Mulai dari Trial gratis untuk menguji alur, lalu naik ke Basic saat trafik bertambah.",
        bodyEn:
          "Message in → server sends the text to the model via the API Key → model replies → server forwards it to WhatsApp. Start with the free Trial to test the flow, then move to Basic as traffic grows.",
      },
      {
        heading: "Tips hemat & aman",
        headingEn: "Cost & safety tips",
        body: "Batasi panjang balasan, tambah rate-limit per pengguna, dan jangan pernah taruh API Key di sisi klien. Simpan key di server sebagai environment variable.",
        bodyEn:
          "Cap reply length, add a per-user rate-limit, and never put the API Key on the client side. Keep the key on the server as an environment variable.",
      },
    ],
    relatedSlugs: ["api-key", "gemini-pro"],
  },
  {
    slug: "tips-aman-akun-sharing",
    title: "Tips Aman Pakai Akun Sharing biar Awet",
    titleEn: "Tips for Using a Sharing Account Safely (and Keeping It Alive)",
    excerpt:
      "Akun sharing bisa awet kalau tahu aturannya. Lima tips simpel biar akunmu nggak gampang bermasalah.",
    excerptEn:
      "A sharing account can last if you know the rules. Five simple tips so yours doesn't break easily.",
    category: "Tips",
    categoryEn: "Tips",
    emoji: "🛡️",
    accent: "accent-pink",
    date: "2026-05-30",
    readMinutes: 3,
    sections: [
      {
        heading: "Aturan emas",
        headingEn: "The golden rule",
        body: "Jangan pernah mengubah email, password, atau metode pemulihan akun sharing. Perubahan ini biasanya memicu logout massal dan membuat akun tidak stabil untuk semua pengguna.",
        bodyEn:
          "Never change the email, password, or recovery method of a sharing account. These changes usually trigger mass logouts and make the account unstable for everyone.",
      },
      {
        heading: "Pakai dengan wajar",
        headingEn: "Use it reasonably",
        body: "Hindari login di terlalu banyak perangkat sekaligus dan jangan menyimpan data sensitif di akun sharing. Kalau butuh privasi penuh atau pemakaian intens, pertimbangkan upgrade ke private.",
        bodyEn:
          "Avoid logging in on too many devices at once and don't store sensitive data on a sharing account. If you need full privacy or heavy use, consider upgrading to private.",
      },
    ],
    relatedSlugs: ["chatgpt-plus"],
  },
]

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug)
}

export function relatedArticles(slug: string, limit = 3) {
  return articles.filter((a) => a.slug !== slug).slice(0, limit)
}
