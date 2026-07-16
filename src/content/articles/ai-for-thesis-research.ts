import { sources } from "./sources"
import type { ArticleDefinition } from "./types"

export const aiForThesisResearch = {
  key: "ai-for-thesis-research",
  category: "guides",
  tags: ["ai", "research", "thesis", "education", "citations"],
  relatedProductSlugs: ["chatgpt-plus", "gemini-pro"],
  authorName: "Tim Editorial geraiakun",
  reviewerName: "Tim Produk geraiakun",
  publishedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
  coverImage: "/images/articles/ai-for-thesis-research.png",
  sources: [sources.unescoEducation, sources.googleAiPlans, sources.chatgptPlus],
  translations: {
    id: {
      slug: "ai-untuk-riset-dan-skripsi",
      title: "Cara Menggunakan AI untuk Riset dan Skripsi secara Bertanggung Jawab",
      excerpt:
        "Gunakan AI untuk memetakan pertanyaan, mengkritik metode, dan merapikan proses, tetapi verifikasi setiap klaim pada sumber primer yang benar-benar dibaca.",
      seoTitle: "AI untuk Riset dan Skripsi yang Bertanggung Jawab",
      seoDescription:
        "Pelajari alur penggunaan AI untuk riset dan skripsi: pencarian literatur, verifikasi sumber, metode, penulisan, privasi, dan integritas akademik.",
      searchPhrases: ["ai untuk skripsi", "ai untuk riset", "cara pakai ai akademik"],
      intro:
        "AI paling berguna dalam riset sebagai mitra berpikir yang membantu memetakan istilah, menguji asumsi, dan memberi umpan balik. Ia bukan sumber akademik dan tidak menggantikan pembacaan, metode, atau tanggung jawab peneliti.",
      keyTakeaways: [
        "Gunakan AI untuk menemukan istilah pencarian, lalu cari literatur pada basis data tepercaya.",
        "Jangan memasukkan sitasi ke naskah sebelum membuka dan membaca sumber aslinya.",
        "Lindungi data penelitian dan dokumentasikan penggunaan AI sesuai aturan institusi.",
      ],
      sections: [
        {
          id: "rumuskan-pertanyaan",
          heading: "Perjelas pertanyaan penelitian",
          paragraphs: [
            "Jelaskan topik, populasi, konteks, dan batas studi kepada AI tanpa data rahasia. Minta variasi pertanyaan, asumsi yang tersembunyi, dan konsep terkait. Gunakan hasil sebagai bahan diskusi dengan pembimbing, bukan keputusan akhir.",
          ],
        },
        {
          id: "cari-dan-verifikasi-literatur",
          heading: "Cari dan verifikasi literatur asli",
          paragraphs: [
            "AI dapat menyarankan kata kunci atau tema, tetapi referensi yang dibuatnya dapat tidak akurat. Lakukan pencarian pada perpustakaan, indeks jurnal, atau situs penerbit. Buka dokumen, periksa penulis dan tahun, lalu baca bagian yang mendukung klaim Anda.",
          ],
          steps: [
            "Minta daftar istilah, sinonim, dan konsep yang berhubungan dengan pertanyaan riset.",
            "Cari istilah tersebut pada basis data akademik dan simpan metadata sumber asli.",
            "Baca sumber, catat bukti serta keterbatasan, kemudian susun sitasi dengan pengelola referensi.",
          ],
        },
        {
          id: "kritik-metode",
          heading: "Gunakan AI untuk mengkritik metode",
          paragraphs: [
            "Berikan rancangan metode yang sudah dianonimkan dan minta AI mencari variabel pengganggu, bias, atau penjelasan alternatif. Cocokkan saran dengan buku metode, praktik disiplin ilmu, serta arahan pembimbing sebelum mengubah rancangan.",
          ],
          table: {
            headers: ["Tahap", "Peran AI", "Keputusan manusia"],
            rows: [
              ["Desain", "Mengajukan risiko dan alternatif", "Memilih metode yang sah dan layak"],
              [
                "Analisis",
                "Menjelaskan prosedur atau kode",
                "Memeriksa asumsi dan menafsirkan hasil",
              ],
              [
                "Penulisan",
                "Memberi umpan balik struktur",
                "Menentukan argumen dan menyetujui setiap kalimat",
              ],
            ],
          },
        },
        {
          id: "tulis-dan-ungkapkan",
          heading: "Tulis, periksa, dan ungkapkan dengan jujur",
          paragraphs: [
            "Tulis analisis berdasarkan catatan dan bukti sendiri. AI dapat membantu mengecek alur atau kejelasan, tetapi Anda harus memahami setiap kalimat. Ikuti aturan kampus tentang deklarasi alat, simpan catatan prompt bila diperlukan, dan jangan unggah data identitas responden.",
          ],
        },
      ],
      faq: [
        {
          question: "Bolehkah sitasi dari jawaban AI dimasukkan ke skripsi?",
          answer:
            "Jangan memasukkan sitasi hanya karena muncul dalam jawaban AI. Temukan sumber asli, periksa kecocokannya, baca isinya, lalu kutip dokumen tersebut secara langsung.",
        },
        {
          question: "Apakah aman mengunggah data penelitian ke layanan AI?",
          answer:
            "Data pribadi atau rahasia sebaiknya tidak diunggah tanpa dasar izin, anonimisasi, dan persetujuan institusi. Gunakan data sintetis untuk meminta bantuan teknis.",
        },
      ],
    },
    en: {
      slug: "ai-for-research-and-thesis-work",
      title: "How to Use AI Responsibly for Research and Thesis Work",
      excerpt:
        "Use AI to map questions, challenge methods, and organize the process, while verifying every claim against a primary source you have actually read.",
      seoTitle: "Responsible AI for Research and Thesis Work",
      seoDescription:
        "Use AI responsibly for literature discovery, source verification, methods, writing, privacy, and academic integrity throughout research and thesis work.",
      searchPhrases: ["ai for thesis", "ai for research", "responsible academic ai"],
      intro:
        "AI is most useful in research as a thinking partner that maps terminology, challenges assumptions, and provides feedback. It is not an academic source and does not replace reading, methodology, or researcher accountability.",
      keyTakeaways: [
        "Use AI to discover search terms, then locate literature through trusted databases.",
        "Never add a citation until you have opened and read the original source.",
        "Protect research data and document AI assistance according to institutional policy.",
      ],
      sections: [
        {
          id: "shape-the-question",
          heading: "Clarify the research question",
          paragraphs: [
            "Describe the topic, population, context, and boundaries without sharing confidential data. Ask for alternative questions, hidden assumptions, and related concepts. Treat the result as material for discussion with a supervisor rather than a final decision.",
          ],
        },
        {
          id: "find-and-verify-literature",
          heading: "Find and verify original literature",
          paragraphs: [
            "AI can suggest keywords or themes, but references it generates may be inaccurate. Search a library, journal index, or publisher site. Open the document, verify authorship and date, and read the section that supports your claim.",
          ],
          steps: [
            "Request terms, synonyms, and related concepts for the research question.",
            "Search those terms in academic databases and save original source metadata.",
            "Read the source, note evidence and limitations, then format citations with a reference manager.",
          ],
        },
        {
          id: "challenge-the-method",
          heading: "Use AI to challenge the method",
          paragraphs: [
            "Provide an anonymized method draft and ask the assistant to identify confounders, bias, or alternative explanations. Check every suggestion against methodology texts, disciplinary practice, and supervisor guidance before changing the design.",
          ],
          table: {
            headers: ["Stage", "AI contribution", "Human decision"],
            rows: [
              ["Design", "Raises risks and alternatives", "Selects a valid and feasible method"],
              [
                "Analysis",
                "Explains a procedure or code",
                "Checks assumptions and interprets results",
              ],
              [
                "Writing",
                "Provides structural feedback",
                "Owns the argument and approves every sentence",
              ],
            ],
          },
        },
        {
          id: "write-and-disclose",
          heading: "Write, review, and disclose honestly",
          paragraphs: [
            "Write analysis from your own notes and evidence. AI can help review structure or clarity, but you must understand every sentence. Follow institutional disclosure rules, retain prompt records when required, and never upload identifiable participant data.",
          ],
        },
      ],
      faq: [
        {
          question: "Can I put a citation from an AI answer into my thesis?",
          answer:
            "Do not add a citation merely because it appears in an AI response. Locate the original source, verify that it is relevant, read it, and cite that document directly.",
        },
        {
          question: "Is it safe to upload research data to an AI service?",
          answer:
            "Personal or confidential data should not be uploaded without permission, anonymization, and institutional approval. Use synthetic data when requesting technical help.",
        },
      ],
    },
  },
} satisfies ArticleDefinition
