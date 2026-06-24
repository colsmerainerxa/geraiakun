export interface FaqItem {
  q: string
  qEn: string
  a: string
  aEn: string
}

// Help-center FAQ — shared by the /bantuan accordion (UI) and its FAQPage JSON-LD.
export const helpFaqs: FaqItem[] = [
  {
    q: "Apakah akun bergaransi?",
    qEn: "Are accounts guaranteed?",
    a: "Tentu. Setiap akun premium bergaransi penuh selama masa aktifnya. Jika akun bermasalah, kami ganti tanpa ribet selama masa garansi masih berlaku.",
    aEn: "Yes. Every premium account comes with a warranty for its full duration. If your account has an issue, we'll replace it hassle-free within the warranty period.",
  },
  {
    q: "Berapa lama proses pengiriman?",
    qEn: "How long is the delivery process?",
    a: "Mayoritas pesanan dikirim instan. Setelah pembayaran terverifikasi, detail akun otomatis dikirim ke email dan dashboard kamu dalam hitungan detik — umumnya di bawah 5 menit.",
    aEn: "Most orders are delivered instantly. Once your payment is verified, account details are sent automatically to your email and dashboard within seconds — usually under 5 minutes.",
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    qEn: "What payment methods are available?",
    a: "Kami menerima QRIS (semua e-wallet), GoPay, OVO, DANA, serta transfer bank via Virtual Account BCA, BNI, atau Mandiri. Semua pembayaran terverifikasi otomatis.",
    aEn: "We accept QRIS (works with every e-wallet), GoPay, OVO, DANA, and bank transfer via BCA, BNI, or Mandiri Virtual Account. All payments are auto-verified.",
  },
  {
    q: "Apa beda akun sharing dan private?",
    qEn: "What's the difference between sharing and private accounts?",
    a: "Akun sharing digunakan bersama member lain dengan harga lebih hemat, sedangkan akun private sepenuhnya milikmu dengan login pribadi. Tipe akun selalu tertera jelas di halaman produk sebelum kamu beli.",
    aEn: "A sharing account is used together with other members at a friendlier price, while a private account is fully yours with your own login. Each product page clearly states the account type before you buy.",
  },
  {
    q: "Apakah bisa minta refund?",
    qEn: "Can I request a refund?",
    a: "Jika kami tidak dapat mengirim akun atau memperbaiki kendala dalam masa garansi, kamu berhak atas refund penuh atau penggantian senilai. Cukup hubungi tim support kami yang siaga 24 jam.",
    aEn: "If we can't deliver your account or fix an issue within the warranty period, you're entitled to a full refund or a replacement of equal value. Just reach out to our 24/7 support.",
  },
  {
    q: "Bagaimana cara melacak pesanan?",
    qEn: "How do I track my order?",
    a: "Gunakan nomor invoice (misal INV-20260001) dari email konfirmasi pada halaman Lacak Pesanan untuk melihat status real-time dan detail akunmu.",
    aEn: "Use the invoice number (e.g. INV-20260001) from your confirmation email on the Track Order page to see real-time status and your account details.",
  },
]

/** Map FAQ items to plain { q, a } for the active locale. */
export function localizedFaqs(
  items: FaqItem[],
  isEn: boolean,
): { q: string; a: string }[] {
  return items.map((f) => ({ q: isEn ? f.qEn : f.q, a: isEn ? f.aEn : f.a }))
}
