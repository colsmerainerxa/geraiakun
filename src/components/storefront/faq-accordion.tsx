"use client"

import { ArrowRight, MessageCircle, Search } from "lucide-react"
import { useLocale } from "next-intl"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export function FaqAccordion() {
  const isEn = useLocale() === "en"

  const faqs = [
    {
      q: isEn ? "Are accounts guaranteed?" : "Apakah akun bergaransi?",
      a: isEn
        ? "Yes. Every premium account comes with a warranty for its full duration. If your account has an issue, we'll replace it hassle-free within the warranty period."
        : "Tentu. Setiap akun premium bergaransi penuh selama masa aktifnya. Jika akun bermasalah, kami ganti tanpa ribet selama masa garansi masih berlaku.",
    },
    {
      q: isEn ? "How long is the delivery process?" : "Berapa lama proses pengiriman?",
      a: isEn
        ? "Most orders are delivered instantly. Once your payment is verified, account details are sent automatically to your email and dashboard within seconds — usually under 5 minutes."
        : "Mayoritas pesanan dikirim instan. Setelah pembayaran terverifikasi, detail akun otomatis dikirim ke email dan dashboard kamu dalam hitungan detik — umumnya di bawah 5 menit.",
    },
    {
      q: isEn ? "What payment methods are available?" : "Metode pembayaran apa saja yang tersedia?",
      a: isEn
        ? "We accept QRIS (works with every e-wallet), GoPay, OVO, DANA, and bank transfer via BCA, BNI, or Mandiri Virtual Account. All payments are auto-verified."
        : "Kami menerima QRIS (semua e-wallet), GoPay, OVO, DANA, serta transfer bank via Virtual Account BCA, BNI, atau Mandiri. Semua pembayaran terverifikasi otomatis.",
    },
    {
      q: isEn ? "What's the difference between sharing and private accounts?" : "Apa beda akun sharing dan private?",
      a: isEn
        ? "A sharing account is used together with other members at a friendlier price, while a private account is fully yours with your own login. Each product page clearly states the account type before you buy."
        : "Akun sharing digunakan bersama member lain dengan harga lebih hemat, sedangkan akun private sepenuhnya milikmu dengan login pribadi. Tipe akun selalu tertera jelas di halaman produk sebelum kamu beli.",
    },
    {
      q: isEn ? "Can I request a refund?" : "Apakah bisa minta refund?",
      a: isEn
        ? "If we can't deliver your account or fix an issue within the warranty period, you're entitled to a full refund or a replacement of equal value. Just reach out to our 24/7 support."
        : "Jika kami tidak dapat mengirim akun atau memperbaiki kendala dalam masa garansi, kamu berhak atas refund penuh atau penggantian senilai. Cukup hubungi tim support kami yang siaga 24 jam.",
    },
    {
      q: isEn ? "How do I track my order?" : "Bagaimana cara melacak pesanan?",
      a: isEn
        ? "Use the invoice number (e.g. INV-20260001) from your confirmation email on the Track Order page to see real-time status and your account details."
        : "Gunakan nomor invoice (misal INV-20260001) dari email konfirmasi pada halaman Lacak Pesanan untuk melihat status real-time dan detail akunmu.",
    },
  ]

  return (
    <div className="mt-8 flex flex-col gap-8">
      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {faqs.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger>{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="rounded-base border-2 border-border bg-main p-6 shadow-shadow sm:p-8">
        <h2 className="font-heading text-xl font-extrabold text-main-foreground">
          {isEn ? "Still need help?" : "Masih butuh bantuan?"}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-main-foreground/80">
          {isEn
            ? "Reach out to our team or track your order in real time."
            : "Hubungi tim kami atau lacak status pesananmu secara real-time."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="neutral" asChild>
            <Link href="/kontak">
              <MessageCircle className="size-4" />
              {isEn ? "Contact Us" : "Hubungi Kami"}
            </Link>
          </Button>
          <Button variant="neutral" asChild>
            <Link href="/lacak">
              <Search className="size-4" />
              {isEn ? "Track Order" : "Lacak Pesanan"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
