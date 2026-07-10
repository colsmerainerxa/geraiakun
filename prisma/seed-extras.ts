import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl || databaseUrl.includes("USER:PASSWORD@HOST")) {
  throw new Error("Set DATABASE_URL to a real Postgres connection string before running db:seed.")
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  const admin = await prisma.user.findFirstOrThrow({
    where: { email: "admin@geraiakun.id" },
  })

  const chatgpt = await prisma.product.findFirstOrThrow({
    where: { slug: "chatgpt-plus" },
    include: { variants: true },
  })
  const gemini = await prisma.product.findFirstOrThrow({
    where: { slug: "gemini-pro" },
    include: { variants: true },
  })
  const apikey = await prisma.product.findFirstOrThrow({
    where: { slug: "api-key" },
    include: { variants: true },
  })

  // ── Reviews ──
  const reviews = [
    {
      productId: chatgpt.id,
      userId: admin.id,
      userName: "Rizky Pratama",
      rating: 5,
      title: "Mantap, cepat banget prosesnya",
      body: "Pesan langsung dikirim akunnya dalam 5 menit. GPT-5 nya work sempurna, dipake buat skripsi jadi ngebut.",
      verified: true,
    },
    {
      productId: chatgpt.id,
      userId: admin.id,
      userName: "Siti Nurhaliza",
      rating: 5,
      title: "Pelayanan ramah dan responsif",
      body: "Awalnya ragu karena harga murah banget, ternyata legit. Adminnya sabar jawab pertanyaan teknis.",
      verified: true,
    },
    {
      productId: chatgpt.id,
      userId: admin.id,
      userName: "Bagus Wicaksono",
      rating: 4,
      title: "Bagus, tapi kadang lag",
      body: "Akunnya work, tapi kadang sore hari agak lemot. Mungkin karena sharing. Overall tetap worth it.",
      verified: false,
    },
    {
      productId: gemini.id,
      userId: admin.id,
      userName: "Andini Putri",
      rating: 5,
      title: "Gemini Pro keren untuk riset",
      body: "Dipake buat bantu analisis data kuliah, hasilnya akurat dan cepat. Harga di GeraiAkun paling murah.",
      verified: true,
    },
    {
      productId: gemini.id,
      userId: admin.id,
      userName: "Fajar Ramadhan",
      rating: 4,
      title: "Invite langsung masuk",
      body: "Proses invite ke akun Google cepat. Kurang satu bintang karena harus tunggu max 1x24 jam, padahal saya butuh urgent.",
      verified: false,
    },
    {
      productId: gemini.id,
      userId: admin.id,
      userName: "Maya Sari",
      rating: 5,
      title: "Lebih murah dari langganan langsung",
      body: "Langganan Gemini Pro di sini hemat 70% dibanding beli langsung dari Google. Mantap GeraiAkun!",
      verified: true,
    },
    {
      productId: apikey.id,
      userId: admin.id,
      userName: "Dimas Anggara",
      rating: 5,
      title: "API key valid dan langsung dipakai",
      body: "Beli API key buat project bootcamp, langsung work tanpa masalah. Limitnya juga sesuai deskripsi.",
      verified: true,
    },
    {
      productId: apikey.id,
      userId: admin.id,
      userName: "Putra Mahesa",
      rating: 4,
      title: "Key works, dokumentasi kurang",
      body: "API key-nya valid dan aktif. Tapi dokumentasi penggunaan minim, buat pemula mungkin agak bingung.",
      verified: false,
    },
    {
      productId: chatgpt.id,
      userId: admin.id,
      userName: "Lestari Dewi",
      rating: 5,
      title: "Langganan rutin di sini",
      body: "Sudah langganan ChatGPT Plus bulan ke-3 di GeraiAkun. Selalu smooth, gak pernah ada masalah.",
      verified: true,
    },
  ]

  // ponytail: no unique field on Review — skipDuplicates won't dedupe; delete seed rows first
  await prisma.review.deleteMany({
    where: { userId: admin.id },
  })
  await prisma.review.createMany({ data: reviews })

  // ── Flash Sales ──
  const chatgptSharing = chatgpt.variants.find((v) =>
    v.label.includes("Sharing")
  )
  if (!chatgptSharing) throw new Error("ChatGPT Plus Sharing variant not found")

  const geminiVariant = gemini.variants[0]
  if (!geminiVariant) throw new Error("Gemini Pro variant not found")

  const now = new Date()

  await prisma.flashSale.upsert({
    where: { id: "flashsale-chatgpt-sharing" },
    update: {
      productId: chatgpt.id,
      variantId: chatgptSharing.id,
      salePrice: 25000,
      quota: 50,
      sold: 12,
      startsAt: now,
      endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      active: true,
    },
    create: {
      id: "flashsale-chatgpt-sharing",
      productId: chatgpt.id,
      variantId: chatgptSharing.id,
      salePrice: 25000,
      quota: 50,
      sold: 12,
      startsAt: now,
      endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      active: true,
    },
  })

  await prisma.flashSale.upsert({
    where: { id: "flashsale-gemini-pro" },
    update: {
      productId: gemini.id,
      variantId: geminiVariant.id,
      salePrice: 15000,
      quota: 30,
      sold: 8,
      startsAt: now,
      endsAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      active: true,
    },
    create: {
      id: "flashsale-gemini-pro",
      productId: gemini.id,
      variantId: geminiVariant.id,
      salePrice: 15000,
      quota: 30,
      sold: 8,
      startsAt: now,
      endsAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      active: true,
    },
  })

  // ── Articles ──
  const articles = [
    {
      slug: "tips-maksimalkan-chatgpt-plus-untuk-mahasiswa",
      title: "10 Tips Maksimalkan ChatGPT Plus untuk Mahasiswa",
      excerpt:
        "ChatGPT Plus bukan cuma buat nanya-nanya. Ini cara mahasiswa bisa memanfaatkan GPT-5 untuk belajar, riset, dan ngerjain tugas.",
      body: `ChatGPT Plus memberikan akses ke model terbaru seperti GPT-5 dan GPT-4o, yang punya kemampuan jauh lebih baik dari versi gratis. Bagi mahasiswa, ini adalah alat yang sangat powerful jika digunakan dengan benar.

Pertama, gunakan ChatGPT untuk membuat ringkasan materi kuliah. Copy-paste catatan atau transkrip dosen, lalu minta ChatGPT untuk merangkum poin-poin penting. Kedua, manfaatkan fitur upload file untuk analisis dokumen PDF jurnal atau paper akademik. Anda bisa minta ChatGPT menjelaskan bagian yang sulit dipahami.

Ketiga, gunakan untuk brainstorming ide tugas atau skripsi. Tanyakan berbagai sudut pandang tentang topik Anda, lalu kembangkan sendiri. Ingat, selalu verifikasi informasi dari ChatGPT dengan sumber kredibel karena AI bisa saja memberikan informasi yang tidak akurat.`,
      category: "tips",
      tags: ["chatgpt", "mahasiswa", "produktivitas", "ai"],
      coverImage: "",
      publishedAt: new Date("2025-01-15T08:00:00.000Z"),
    },
    {
      slug: "perbandingan-chatgpt-plus-vs-gemini-pro-2025",
      title: "ChatGPT Plus vs Gemini Pro: Mana yang Cocok untuk Anda?",
      excerpt:
        "Dua AI terbesar saat ini. Kami bandingkan fitur, harga, dan use case terbaik masing-masing untuk membantu Anda memilih.",
      body: `ChatGPT Plus dan Gemini Pro adalah dua layanan AI premium yang paling populer di 2025. Keduanya menawarkan kemampuan luar biasa, tapi punya kekuatan yang berbeda di area tertentu.

ChatGPT Plus unggul dalam kreativitas, menulis, dan coding. Model GPT-5 sangat baik dalam menghasilkan teks yang natural dan menjawab pertanyaan teknis. Sementara itu, Gemini Pro lebih kuat dalam analisis data, integrasi dengan ekosistem Google (Docs, Sheets, Drive), dan pemrosesan multi-modal.

Dari segi harga, berlangganan langsung ke OpenAI menghabiskan $20/bulan, sedangkan Google One AI Premium $19.99/bulan. Namun, melalui GeraiAkun, Anda bisa mendapatkan akses keduanya dengan hemat hingga 70%. Pilih ChatGPT Plus jika fokus pada konten dan coding, atau Gemini Pro jika Anda heavy user ekosistem Google.`,
      category: "comparison",
      tags: ["chatgpt", "gemini", "perbandingan", "ai"],
      coverImage: "",
      publishedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
      slug: "cara-aman-berlangganan-akun-ai-sharing",
      title: "Cara Aman Berlangganan Akun AI Sharing",
      excerpt:
        "Sistem sharing akun AI sedang tren karena harganya jauh lebih murah. Tapi apakah aman? Simak panduan lengkapnya di sini.",
      body: `Sistem sharing akun AI seperti ChatGPT Plus atau Gemini Pro menjadi pilihan populer karena harganya bisa 70% lebih murah dari langganan resmi. Namun, banyak yang bertanya: apakah aman?

Jawabannya bisa, asal Anda membeli dari penyedia terpercaya. GeraiAkun menggunakan sistem sharing yang terstruktur, di mana setiap akun dibagi maksimal sesuai kapasitas yang ditentukan penyedia. Data pribadi Anda tetap aman karena Anda tidak perlu memasukkan informasi sensitif.

Tips keamanan: pertama, jangan pernah menyimpan password akun sharing di browser. Kedua, gunakan mode incognito saat mengakses akun sharing. Ketiga, jangan mengubah pengaturan akun atau password. Dengan mengikuti aturan ini, pengalaman berlangganan sharing Anda akan aman dan hemat.`,
      category: "tips",
      tags: ["keamanan", "sharing", "chatgpt", "ai"],
      coverImage: "",
      publishedAt: new Date("2025-02-20T08:00:00.000Z"),
    },
    {
      slug: "manfaat-api-key-ai-untuk-developer-pemula",
      title: "5 Manfaat API Key AI untuk Developer Pemula",
      excerpt:
        "Bukan cuma buat pro. Developer pemula juga bisa dapat banyak keuntungan dari API key AI. Ini 5 manfaat utamanya.",
      body: `API key AI seperti OpenAI API atau Google Gemini API bukan hanya untuk perusahaan besar. Developer pemula pun bisa memanfaatkannya untuk berbagai keperluan, mulai dari belajar hingga membangun proyek portofolio.

Pertama, Anda bisa membangun chatbot sederhana untuk website atau aplikasi. Kedua, API AI sangat berguna untuk automasi tugas seperti summarization, sentiment analysis, atau translate teks. Ketiga, Anda bisa mengintegrasikan AI ke aplikasi yang sedang Anda kembangkan tanpa perlu membangun model dari nol.

Manfaat lainnya adalah untuk belajar prompt engineering secara praktis. Dengan API key, Anda bisa bereksperimen dengan berbagai prompt dan parameter seperti temperature dan max_tokens. GeraiAkun menyediakan API key dengan harga terjangkau, cocok untuk developer yang sedang belajar tanpa harus commit ke langganan bulanan mahal.`,
      category: "tutorial",
      tags: ["api", "developer", "ai", "tutorial"],
      coverImage: "",
      publishedAt: new Date("2025-03-05T08:00:00.000Z"),
    },
  ]

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: article,
      create: article,
    })
  }

  console.log("Seed extras completed ✓")
  console.log(`  Reviews: ${reviews.length}`)
  console.log("  FlashSales: 2")
  console.log(`  Articles: ${articles.length}`)
}

main().then(() => prisma.$disconnect())
