import type { Category } from "@/types"

export const categories: Category[] = [
  {
    id: "cat-ai",
    slug: "ai-chatbot",
    name: "AI & Chatbot",
    nameEn: "AI & Chatbot",
    description: "ChatGPT Plus & Gemini Pro — asisten AI premium",
    descriptionEn: "ChatGPT Plus & Gemini Pro — premium AI assistants",
    icon: "Bot",
    color: "accent-cyan",
    productCount: 0,
  },
  {
    id: "cat-api",
    slug: "api-developer",
    name: "API & Developer",
    nameEn: "API & Developer",
    description: "API Key & kredit token untuk developer",
    descriptionEn: "API keys & token credits for developers",
    icon: "Code",
    color: "accent-lime",
    productCount: 0,
  },
]

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug)
}

export interface CategoryFaq {
  q: string
  qEn: string
  a: string
  aEn: string
}

export const categoryContent: Record<
  string,
  { intro: string; introEn: string; faqs: CategoryFaq[] }
> = {
  "ai-chatbot": {
    intro:
      "Asisten AI seperti ChatGPT Plus dan Gemini Pro membantu menulis, riset, dan menyelesaikan tugas jauh lebih cepat. Di kategori ini kamu bisa pilih akun premium dengan harga hemat — tipe sharing maupun private — lengkap dengan garansi selama masa aktif.",
    introEn:
      "AI assistants like ChatGPT Plus and Gemini Pro help you write, research, and finish tasks far faster. In this category you can pick premium accounts at affordable prices — sharing or private — all warranted during the active period.",
    faqs: [
      {
        q: "Apa beda ChatGPT Plus dan Gemini Pro?",
        qEn: "What's the difference between ChatGPT Plus and Gemini Pro?",
        a: "ChatGPT Plus unggul untuk menulis & menjelaskan konsep, sedangkan Gemini Pro kuat di riset dan integrasi Google Workspace. Banyak yang memakai keduanya sebagai kombinasi.",
        aEn: "ChatGPT Plus excels at writing & explaining concepts, while Gemini Pro is strong at research and Google Workspace integration. Many people use both together.",
      },
      {
        q: "Akun sharing atau private, pilih mana?",
        qEn: "Sharing or private account — which one?",
        a: "Sharing lebih hemat untuk pemakaian ringan; private cocok untuk pemakaian harian dengan riwayat chat pribadi.",
        aEn: "Sharing is cheaper for light use; private suits daily use with your own private chat history.",
      },
      {
        q: "Berapa lama akun aktif setelah dibeli?",
        qEn: "How long is the account active after purchase?",
        a: "Akun dikirim instan setelah pembayaran terverifikasi dan bergaransi penuh selama masa langganannya.",
        aEn: "The account is delivered instantly after payment is verified and is fully warranted for its subscription period.",
      },
    ],
  },
  "api-developer": {
    intro:
      "Butuh akses model AI langsung dari kode? Kategori API & Developer menyediakan API Key dengan kredit token — mulai dari varian Trial gratis untuk eksperimen, hingga paket Basic dan Pro untuk kebutuhan yang lebih serius.",
    introEn:
      "Need AI model access straight from your code? The API & Developer category offers API Keys with token credits — from a free Trial to experiment, to Basic and Pro plans for more serious needs.",
    faqs: [
      {
        q: "Apa itu token pada API Key?",
        qEn: "What are tokens on an API Key?",
        a: "Token adalah satuan kecil teks yang dihitung tiap permintaan API. Makin panjang prompt & jawaban, makin banyak token terpakai.",
        aEn: "Tokens are small chunks of text counted per API request. The longer your prompt & response, the more tokens are used.",
      },
      {
        q: "Kenapa paket Pro tokennya lebih sedikit?",
        qEn: "Why does the Pro plan have fewer tokens?",
        a: "Pro memakai model kelas atas yang lebih 'berat', jadi dengan harga sama kamu dapat lebih sedikit token dibanding Basic.",
        aEn: "Pro uses higher-tier, 'heavier' models, so at the same price you get fewer tokens than Basic.",
      },
      {
        q: "Bisa coba gratis dulu?",
        qEn: "Can I try it free first?",
        a: "Bisa. Ambil varian Trial gratis untuk menguji integrasimu sebelum naik ke Basic atau Pro.",
        aEn: "Yes. Grab the free Trial variant to test your integration before moving up to Basic or Pro.",
      },
    ],
  },
}
