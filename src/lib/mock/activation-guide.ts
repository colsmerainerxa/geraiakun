import type { ActivationGuide, ActivationStep, CategorySlug } from "@/types"
export type { ActivationGuide, ActivationStep }

// Template umum reusable
const commonPrereqs = [
  {
    id: "Akun geraiakun & nomor invoice pesananmu",
    en: "Your geraiakun account & order invoice number",
  },
  { id: "Koneksi internet stabil", en: "A stable internet connection" },
  { id: "Email aktif untuk menerima kredensial", en: "Active email to receive credentials" },
]

const commonTrouble = [
  {
    q: {
      id: "Akun tidak bisa login?",
      en: "Can't log in to the account?",
    },
    a: {
      id: "Pastikan tidak ada spasi saat copy-paste password. Jika tetap gagal, ajukan klaim garansi via pusat bantuan — kami ganti instan.",
      en: "Make sure there are no spaces when copy-pasting the password. If it still fails, file a warranty claim in the help center — we replace instantly.",
    },
  },
  {
    q: {
      id: "Akun minta verifikasi 2FA/OTP?",
      en: "Account asks for 2FA/OTP verification?",
    },
    a: {
      id: "Hubungi CS kami via WhatsApp dengan nomor invoice. Kami bantu proses verifikasi atau ganti akun.",
      en: "Contact our CS via WhatsApp with your invoice number. We'll help with verification or replace the account.",
    },
  },
]

export const activationGuides: Record<string, ActivationGuide> = {
  // Per-brand
  OpenAI: {
    brand: "OpenAI",
    category: "ai-chatbot",
    difficulty: "easy",
    minutes: 5,
    prerequisites: commonPrereqs,
    steps: [
      {
        title: { id: "Buka ChatGPT", en: "Open ChatGPT" },
        desc: {
          id: "Kunjungi chat.openai.com atau buka aplikasi ChatGPT di perangkatmu.",
          en: "Visit chat.openai.com or open the ChatGPT app on your device.",
        },
      },
      {
        title: { id: "Login dengan kredensial", en: "Log in with credentials" },
        desc: {
          id: "Gunakan email & password yang kami kirim di email/invoice. Klik 'Log in'.",
          en: "Use the email & password we sent via email/invoice. Click 'Log in'.",
        },
      },
      {
        title: { id: "Verifikasi akun Plus aktif", en: "Verify Plus is active" },
        desc: {
          id: "Setelah login, cek pojok kiri-bawah — pastikan muncul badge 'Plus'. Pilih model GPT-5 atau GPT-4o.",
          en: "After login, check the bottom-left — make sure the 'Plus' badge appears. Select GPT-5 or GPT-4o model.",
        },
      },
      {
        title: { id: "Selesai! Mulai chat", en: "Done! Start chatting" },
        desc: {
          id: "Akun Plus aktif tanpa antre. Jangan ganti password agar garansi tetap berlaku.",
          en: "Plus is active with no queue. Don't change the password to keep your warranty valid.",
        },
      },
    ],
    troubleshooting: commonTrouble,
    tips: [
      {
        id: "Jangan aktifkan 2FA — gunakan akun sharing sebagaimana adanya.",
        en: "Don't enable 2FA — use the sharing account as-is.",
      },
      {
        id: "Logout dari perangkat lain bila terasa lambat.",
        en: "Log out from other devices if it feels slow.",
      },
    ],
  },
  Google: {
    brand: "Google",
    difficulty: "easy",
    minutes: 4,
    prerequisites: commonPrereqs,
    steps: [
      {
        title: { id: "Buka Gemini", en: "Open Gemini" },
        desc: { id: "Kunjungi gemini.google.com.", en: "Visit gemini.google.com." },
      },
      {
        title: { id: "Login akun", en: "Log in" },
        desc: {
          id: "Masuk dengan email & password dari invoice. Lewati 'Add recovery email'.",
          en: "Sign in with the email & password from the invoice. Skip 'Add recovery email'.",
        },
      },
      {
        title: { id: "Pilih model Advanced", en: "Select Advanced model" },
        desc: {
          id: "Klik dropdown model, pilih '2.5 Pro' / Advanced untuk fitur penuh.",
          en: "Click the model dropdown, select '2.5 Pro' / Advanced for full features.",
        },
      },
    ],
    troubleshooting: commonTrouble,
    tips: [
      {
        id: "Jangan ubah password atau recovery info.",
        en: "Don't change password or recovery info.",
      },
      {
        id: "Akses dari region tertentu mungkin butuh VPN.",
        en: "Access from some regions may need a VPN.",
      },
    ],
  },
  Canva: {
    brand: "Canva",
    difficulty: "easy",
    minutes: 3,
    prerequisites: commonPrereqs,
    steps: [
      {
        title: { id: "Buka Canva", en: "Open Canva" },
        desc: {
          id: "Kunjungi canva.com atau buka aplikasinya.",
          en: "Visit canva.com or open the app.",
        },
      },
      {
        title: { id: "Login & cek Pro", en: "Log in & check Pro" },
        desc: {
          id: "Login dengan kredensial dari invoice. Badge Pro/Crown muncul di pojok kanan-atas.",
          en: "Log in with credentials from the invoice. The Pro/Crown badge appears in the top-right.",
        },
      },
    ],
    troubleshooting: commonTrouble,
    tips: [{ id: "Gunakan tim yang sudah disediakan.", en: "Use the provided team." }],
  },
}

// Fallback per-kategori bila brand tidak punya guide spesifik
const categoryFallback: Record<CategorySlug, ActivationGuide> = {
  "ai-chatbot": activationGuides.OpenAI,
  "desain-kreatif": activationGuides.Canva,
  streaming: {
    brand: undefined,
    difficulty: "easy",
    minutes: 4,
    prerequisites: commonPrereqs,
    steps: [
      {
        title: { id: "Buka platform streaming", en: "Open the streaming platform" },
        desc: {
          id: "Buka website/app platform streaming kamu.",
          en: "Open your streaming platform's website/app.",
        },
      },
      {
        title: { id: "Login dengan kredensial", en: "Log in with credentials" },
        desc: {
          id: "Masuk pakai email & password dari invoice. Profil premium otomatis aktif.",
          en: "Sign in with the email & password from the invoice. Premium profile activates automatically.",
        },
      },
      {
        title: { id: "Pilih profil & nikmati", en: "Pick a profile & enjoy" },
        desc: {
          id: "Pilih profilmu (jangan ganti PIN). Streaming 4K siap dipakai.",
          en: "Pick your profile (don't change the PIN). 4K streaming is ready.",
        },
      },
    ],
    troubleshooting: commonTrouble,
    tips: [{ id: "Jangan ubah PIN profil.", en: "Don't change the profile PIN." }],
  },
  produktivitas: activationGuides.OpenAI,
  "api-developer": {
    brand: undefined,
    category: "api-developer",
    difficulty: "medium",
    minutes: 6,
    prerequisites: [
      ...commonPrereqs,
      { id: "Familiar dasar HTTP/cURL", en: "Basic familiarity with HTTP/cURL" },
    ],
    steps: [
      {
        title: { id: "Salin API key", en: "Copy the API key" },
        desc: {
          id: "Ambil API key dari dashboard/email. Simpan aman — jangan di-commit ke repo publik.",
          en: "Get the API key from dashboard/email. Store it securely — never commit to a public repo.",
        },
      },
      {
        title: { id: "Set sebagai env variable", en: "Set as env variable" },
        desc: {
          id: 'export API_KEY="sk-..." atau simpan di .env lokal aplikasimu.',
          en: 'export API_KEY="sk-..." or store in your app\'s local .env.',
        },
      },
      {
        title: { id: "Test request pertama", en: "Test the first request" },
        desc: {
          id: "Kirim request cURL/HTTP sederhana untuk verifikasi key aktif & ada saldo/quota.",
          en: "Send a simple cURL/HTTP request to verify the key is active & has quota.",
        },
      },
    ],
    troubleshooting: [
      ...commonTrouble,
      {
        q: { id: "Error 401/invalid key?", en: "Error 401/invalid key?" },
        a: {
          id: "Cek spasi & prefix (sk-). Jika benar tapi tetap gagal, ajukan klaim garansi.",
          en: "Check for spaces & prefix (sk-). If correct but still failing, file a warranty claim.",
        },
      },
    ],
    tips: [
      {
        id: "Pantau usage agar tidak melebihi quota.",
        en: "Monitor usage to avoid exceeding quota.",
      },
      {
        id: "Gunakan header yang benar sesuai provider.",
        en: "Use the correct headers per provider.",
      },
    ],
  },
  edukasi: activationGuides.Canva,
}

export function getActivationGuide(brand: string, category: CategorySlug): ActivationGuide {
  return activationGuides[brand] ?? categoryFallback[category]
}
