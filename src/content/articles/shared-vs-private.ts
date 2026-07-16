import { sources } from "./sources"
import type { ArticleDefinition } from "./types"

export const sharedVsPrivate = {
  key: "shared-vs-private",
  category: "security",
  tags: ["accounts", "sharing", "private", "privacy", "security"],
  relatedProductSlugs: ["chatgpt-plus", "gemini-pro"],
  authorName: "Tim Editorial geraiakun",
  reviewerName: "Tim Keamanan geraiakun",
  publishedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
  coverImage: "/images/articles/shared-vs-private.png",
  sources: [sources.chatgptPlus, sources.googleAiPlans, sources.consumerProtection],
  translations: {
    id: {
      slug: "akun-sharing-vs-private",
      title: "Akun Sharing vs Private: Pahami Risiko sebelum Memilih",
      excerpt:
        "Akun private memberi kontrol dan isolasi lebih baik. Akun sharing menambah risiko privasi, gangguan sesi, pemulihan akun, dan potensi pelanggaran ketentuan penyedia.",
      seoTitle: "Akun Sharing vs Private: Risiko dan Perbedaan",
      seoDescription:
        "Bandingkan akun sharing dan private dari sisi privasi, kontrol akses, kestabilan, pemulihan, biaya, dan ketentuan layanan sebelum memilih.",
      searchPhrases: ["akun sharing vs private", "risiko akun sharing", "akun private adalah"],
      intro:
        "Akun private yang dibuat dan dikendalikan oleh pengguna adalah pilihan paling aman untuk pekerjaan, data pribadi, dan penggunaan rutin. Akun sharing menambah pihak yang dapat mengakses sesi dan sering bertentangan dengan desain akun individual.",
      keyTakeaways: [
        "Pilih akses private untuk data sensitif, pekerjaan rutin, riwayat penting, dan kontrol pemulihan.",
        "Sharing dapat mengekspos percakapan, file, sesi, dan metode pemulihan kepada pengguna lain.",
        "Periksa ketentuan penyedia karena membagikan kredensial dapat dilarang atau membatasi dukungan.",
      ],
      sections: [
        {
          id: "definisi-akses",
          heading: "Bedakan kepemilikan dan akses",
          paragraphs: [
            "Private berarti satu pengguna atau satu organisasi sah mengendalikan login, pemulihan, dan sesi sesuai paket. Sharing berarti kredensial atau satu sesi dipakai beberapa pihak yang tidak memiliki pemisahan identitas serta ruang data yang memadai.",
          ],
        },
        {
          id: "risiko-utama",
          heading: "Kenali risiko utama akun sharing",
          paragraphs: [
            "Pengguna lain dapat melihat histori, file, nama profil, atau jejak aktivitas jika layanan tidak menyediakan isolasi. Perubahan password, verifikasi, lokasi login, dan batas perangkat dapat mengeluarkan pengguna lain. Pemulihan juga bergantung pada pihak yang memegang email utama.",
          ],
          table: {
            headers: ["Faktor", "Sharing", "Private"],
            rows: [
              ["Privasi", "Bergantung pada perilaku semua pengguna", "Dikendalikan pemilik akun"],
              [
                "Stabilitas",
                "Sesi dan batas dapat saling memengaruhi",
                "Aktivitas berasal dari satu pemilik",
              ],
              [
                "Pemulihan",
                "Sering bergantung pada penjual atau pemegang email",
                "Dikelola oleh pemilik",
              ],
            ],
          },
        },
        {
          id: "ketentuan-layanan",
          heading: "Periksa ketentuan dan bentuk paket resmi",
          paragraphs: [
            "Penyedia dapat menawarkan paket individual, keluarga, tim, bisnis, atau pendidikan dengan aturan berbeda. Jangan menganggap kredensial individual boleh dibagikan. Gunakan bentuk akses resmi yang memberi identitas terpisah ketika beberapa orang perlu memakai layanan.",
          ],
          bullets: [
            "Baca halaman paket dan ketentuan terbaru langsung dari penyedia layanan.",
            "Pastikan setiap pengguna memperoleh identitas dan ruang kerja sesuai aturan paket.",
            "Hindari penjual yang meminta OTP, kode pemulihan, atau kendali email pribadi Anda.",
          ],
        },
        {
          id: "cara-memilih",
          heading: "Pilih berdasarkan dampak jika akses gagal",
          paragraphs: [
            "Untuk mencoba layanan tanpa data penting, biaya mungkin menjadi pertimbangan utama. Namun untuk kuliah, pekerjaan, klien, atau histori yang bernilai, gunakan akses private atau paket multi-pengguna resmi. Nilai kerugian ketika akses hilang, bukan hanya selisih harga bulanan.",
          ],
        },
      ],
      faq: [
        {
          question: "Apakah akun sharing aman untuk menyimpan dokumen pribadi?",
          answer:
            "Tidak disarankan. Dokumen pribadi, percakapan sensitif, data klien, dan informasi pembayaran sebaiknya hanya digunakan pada akun yang Anda kendalikan sendiri.",
        },
        {
          question: "Apakah paket keluarga atau tim sama dengan berbagi password?",
          answer:
            "Tidak. Paket resmi biasanya memberi identitas atau akses terpisah untuk setiap anggota, sedangkan berbagi password memakai satu kredensial untuk banyak orang.",
        },
      ],
    },
    en: {
      slug: "shared-vs-private-accounts",
      title: "Shared vs Private Accounts: Understand the Risks First",
      excerpt:
        "Private access offers stronger control and isolation. Shared credentials add privacy, session, recovery, reliability, and provider-policy risks.",
      seoTitle: "Shared vs Private Accounts: Risks Compared",
      seoDescription:
        "Compare shared and private accounts by privacy, access control, reliability, recovery, price, and provider terms before choosing how to subscribe.",
      searchPhrases: [
        "shared vs private account",
        "shared account risks",
        "private account meaning",
      ],
      intro:
        "A private account created and controlled by its user is the safer choice for work, personal data, and regular use. Shared credentials add people who can affect a session and often conflict with the design of an individual account.",
      keyTakeaways: [
        "Choose private access for sensitive data, recurring work, valuable history, and recovery control.",
        "Sharing can expose conversations, files, sessions, and recovery paths to other users.",
        "Check provider terms because credential sharing may be prohibited or limit support.",
      ],
      sections: [
        {
          id: "define-access",
          heading: "Separate ownership from shared access",
          paragraphs: [
            "Private means one user or authorized organization controls login, recovery, and sessions under the plan. Sharing means several unrelated people use one credential or session without reliable identity and data separation.",
          ],
        },
        {
          id: "main-risks",
          heading: "Understand the main risks of sharing",
          paragraphs: [
            "Other users may see history, files, profile details, or activity when the service does not provide isolation. Password changes, verification, login locations, and device limits can remove everyone. Recovery also depends on whoever controls the primary email.",
          ],
          table: {
            headers: ["Factor", "Shared", "Private"],
            rows: [
              ["Privacy", "Depends on every user's behavior", "Controlled by the account owner"],
              [
                "Reliability",
                "Sessions and limits affect each other",
                "Activity belongs to one owner",
              ],
              ["Recovery", "Often depends on a seller or email holder", "Managed by the owner"],
            ],
          },
        },
        {
          id: "provider-terms",
          heading: "Check terms and official multi-user plans",
          paragraphs: [
            "Providers may offer individual, family, team, business, or education plans with different rules. Do not assume an individual credential may be shared. Use an official access model with separate identities when several people need the service.",
          ],
          bullets: [
            "Read the current plan page and terms directly from the service provider.",
            "Confirm that each person receives identity and workspace separation under the plan.",
            "Avoid sellers who request an OTP, recovery code, or control of your personal email.",
          ],
        },
        {
          id: "how-to-choose",
          heading: "Choose by the impact of losing access",
          paragraphs: [
            "For a low-risk trial with no important data, price may be the primary concern. For study, work, clients, or valuable history, use private access or an official multi-user plan. Evaluate the loss from failed access, not only the monthly price difference.",
          ],
        },
      ],
      faq: [
        {
          question: "Is a shared account safe for personal documents?",
          answer:
            "It is not recommended. Personal documents, sensitive conversations, client data, and payment information should remain in an account you control yourself.",
        },
        {
          question: "Is a family or team plan the same as sharing a password?",
          answer:
            "No. An official plan normally gives each member a separate identity or access path, while password sharing gives many people one credential.",
        },
      ],
    },
  },
} satisfies ArticleDefinition
