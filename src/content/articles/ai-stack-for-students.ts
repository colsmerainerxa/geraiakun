import { sources } from "./sources"
import type { ArticleDefinition } from "./types"

export const aiStackForStudents = {
  key: "ai-stack-for-students",
  category: "guides",
  tags: ["ai", "students", "education", "productivity", "integrity"],
  relatedProductSlugs: ["chatgpt-plus", "gemini-pro"],
  authorName: "Tim Editorial geraiakun",
  reviewerName: "Tim Produk geraiakun",
  publishedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
  coverImage: "/images/articles/ai-stack-for-students.png",
  sources: [sources.unescoEducation, sources.chatgptPricing, sources.googleAiPlans],
  translations: {
    id: {
      slug: "stack-ai-untuk-mahasiswa",
      title: "Stack AI untuk Mahasiswa yang Hemat dan Bertanggung Jawab",
      excerpt:
        "Bangun alur belajar dengan alat sesedikit mungkin: satu asisten umum, sumber akademik asli, dan sistem catatan yang menjaga proses tetap terverifikasi.",
      seoTitle: "Stack AI untuk Mahasiswa: Hemat dan Aman",
      seoDescription:
        "Susun stack AI mahasiswa untuk belajar, riset, dan menulis secara hemat. Terapkan verifikasi sumber, privasi data, dan integritas akademik.",
      searchPhrases: ["ai untuk mahasiswa", "stack ai mahasiswa", "ai untuk belajar"],
      intro:
        "Mahasiswa tidak membutuhkan banyak langganan AI. Stack yang efektif terdiri dari satu asisten umum, akses ke sumber akademik asli, dan sistem catatan yang menunjukkan mana ide sendiri, kutipan, dan bantuan AI.",
      keyTakeaways: [
        "Mulai dari alat gratis dan tambah langganan hanya untuk hambatan yang terbukti.",
        "Gunakan AI untuk menjelaskan dan mengkritik, bukan menggantikan pemikiran Anda.",
        "Catat sumber asli serta bantuan AI agar proses akademik dapat dipertanggungjawabkan.",
      ],
      sections: [
        {
          id: "stack-minimal",
          heading: "Gunakan stack minimal yang mudah diawasi",
          paragraphs: [
            "Pilih satu asisten AI untuk diskusi dan draf, mesin pencarian perpustakaan atau jurnal untuk sumber, serta aplikasi catatan untuk menyimpan kutipan dan keputusan. Terlalu banyak alat membuat konteks tersebar dan biaya sulit dikendalikan.",
          ],
          bullets: [
            "Asisten AI untuk penjelasan konsep, pertanyaan latihan, dan umpan balik draf.",
            "Sumber primer seperti buku, jurnal, data resmi, dan materi dosen untuk bukti.",
            "Catatan terstruktur yang memisahkan kutipan, parafrasa, analisis, dan ide pribadi.",
          ],
        },
        {
          id: "alur-belajar",
          heading: "Bangun alur belajar yang aktif",
          paragraphs: [
            "Minta AI mengajukan pertanyaan, membuat contoh tandingan, atau menilai alasan Anda. Hindari hanya meminta ringkasan karena membaca jawaban pasif tidak menjamin pemahaman. Tutup sesi dengan menjelaskan konsep menggunakan kata-kata sendiri tanpa bantuan.",
          ],
          steps: [
            "Baca materi asli dan tandai bagian yang belum dipahami.",
            "Minta penjelasan bertahap lalu uji dengan soal atau contoh baru.",
            "Tulis ulang pemahaman Anda dan cocokkan kembali dengan sumber asli.",
          ],
        },
        {
          id: "integritas-akademik",
          heading: "Jaga integritas akademik sejak awal",
          paragraphs: [
            "Aturan penggunaan AI berbeda antar kampus, mata kuliah, dan tugas. Baca kebijakan yang berlaku, ungkapkan bantuan AI ketika diwajibkan, dan jangan menyerahkan teks yang tidak dapat Anda jelaskan atau pertanggungjawabkan.",
          ],
          table: {
            headers: ["Penggunaan", "Praktik yang bertanggung jawab"],
            rows: [
              ["Brainstorming", "Catat ide awal lalu kembangkan argumen dan bukti sendiri."],
              ["Penyuntingan", "Tinjau setiap perubahan dan pertahankan suara tulisan Anda."],
              ["Riset", "Buka, baca, dan kutip sumber asli; jangan mengutip jawaban AI."],
            ],
          },
        },
        {
          id: "privasi-dan-biaya",
          heading: "Kendalikan privasi dan biaya",
          paragraphs: [
            "Jangan unggah data pribadi responden, dokumen internal, kunci jawaban, atau materi berhak akses tanpa izin. Gunakan versi gratis lebih dulu, evaluasi manfaat per bulan, dan pilih paket pendidikan resmi bila kampus menyediakannya.",
          ],
        },
      ],
      faq: [
        {
          question: "Apakah menggunakan AI untuk tugas kuliah termasuk curang?",
          answer:
            "Jawabannya bergantung pada aturan tugas dan kampus. Penggunaan untuk belajar dapat diizinkan, sedangkan menyerahkan hasil AI sebagai karya sendiri dapat melanggar integritas akademik.",
        },
        {
          question: "Apakah mahasiswa perlu membayar dua layanan AI?",
          answer:
            "Biasanya tidak. Satu asisten dan akses sumber akademik yang baik sudah cukup. Tambahkan layanan lain hanya ketika kebutuhan spesifik tidak terpenuhi.",
        },
      ],
    },
    en: {
      slug: "ai-stack-for-students",
      title: "A Lean and Responsible AI Stack for Students",
      excerpt:
        "Build a learning workflow with fewer tools: one general assistant, original academic sources, and notes that keep every claim verifiable.",
      seoTitle: "AI Stack for Students: Lean and Responsible",
      seoDescription:
        "Build a practical AI stack for study, research, and writing while controlling cost, protecting data, verifying sources, and preserving integrity.",
      searchPhrases: ["ai for students", "student ai stack", "responsible ai study workflow"],
      intro:
        "Students do not need a collection of AI subscriptions. An effective stack combines one general assistant, access to original academic sources, and a note system that distinguishes your ideas, quotations, and AI assistance.",
      keyTakeaways: [
        "Begin with free tools and pay only after a repeated, measurable constraint appears.",
        "Use AI to explain and challenge your thinking rather than replace it.",
        "Record original sources and AI assistance so your process remains accountable.",
      ],
      sections: [
        {
          id: "minimal-stack",
          heading: "Use a minimal stack you can supervise",
          paragraphs: [
            "Choose one assistant for discussion and drafts, a library or academic search service for sources, and a note application for quotations and decisions. Too many tools scatter context and make spending difficult to control.",
          ],
          bullets: [
            "An AI assistant for concept explanations, practice questions, and draft feedback.",
            "Primary sources such as books, papers, official data, and course materials for evidence.",
            "Structured notes that separate quotations, paraphrases, analysis, and personal ideas.",
          ],
        },
        {
          id: "active-learning-workflow",
          heading: "Build an active learning workflow",
          paragraphs: [
            "Ask the assistant to question you, produce counterexamples, or evaluate your reasoning. Avoid relying only on summaries because passively reading an answer does not prove understanding. End by explaining the concept in your own words without assistance.",
          ],
          steps: [
            "Read the original material and mark the parts you do not understand.",
            "Request a staged explanation and test it with a new problem or example.",
            "Write your own explanation and compare it with the original source again.",
          ],
        },
        {
          id: "academic-integrity",
          heading: "Protect academic integrity from the start",
          paragraphs: [
            "AI rules differ between institutions, courses, and assignments. Read the applicable policy, disclose assistance when required, and never submit text that you cannot explain or defend as your own work.",
          ],
          table: {
            headers: ["Use", "Responsible practice"],
            rows: [
              [
                "Brainstorming",
                "Record initial ideas, then develop your own argument and evidence.",
              ],
              ["Editing", "Review every change and preserve your own writing voice."],
              ["Research", "Open, read, and cite the original source instead of citing AI output."],
            ],
          },
        },
        {
          id: "privacy-and-cost",
          heading: "Control privacy and cost",
          paragraphs: [
            "Do not upload respondent data, internal documents, answer keys, or access-controlled material without permission. Start with free access, review value each month, and prefer an official education plan when your institution provides one.",
          ],
        },
      ],
      faq: [
        {
          question: "Is using AI for coursework considered cheating?",
          answer:
            "It depends on the assignment and institutional policy. Assistance for learning may be allowed, while submitting AI output as your own work can violate academic integrity.",
        },
        {
          question: "Do students need to pay for two AI services?",
          answer:
            "Usually not. One assistant and reliable access to academic sources are enough. Add another service only when a specific recurring need remains unmet.",
        },
      ],
    },
  },
} satisfies ArticleDefinition
