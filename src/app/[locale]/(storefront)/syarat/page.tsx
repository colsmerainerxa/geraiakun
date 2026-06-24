import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { LegalDoc } from "@/components/storefront/legal-doc"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "static" })
  return {
    title: t("termsTitle"),
    alternates: seoAlternates(locale, "/syarat"),
  }
}

const sections = [
  {
    heading: "Penerimaan Ketentuan",
    headingEn: "Acceptance of Terms",
    body: "Dengan mengakses dan menggunakan beliakun, kamu setuju untuk terikat dengan Syarat & Ketentuan ini. Jika kamu tidak menyetujui salah satu poin, mohon untuk tidak menggunakan layanan kami.",
    bodyEn: "By accessing and using beliakun, you agree to be bound by these Terms & Conditions. If you do not agree with any part of them, please refrain from using our service.",
  },
  {
    heading: "Produk & Layanan",
    headingEn: "Products & Services",
    body: "beliakun menjual akun premium dan langganan digital. Tipe akun (sharing atau private) serta durasi tertera jelas di setiap halaman produk. beliakun bukan afiliasi resmi dari brand yang dijual; semua merek dagang milik pemiliknya masing-masing.",
    bodyEn: "beliakun sells premium accounts and digital subscriptions. The account type (sharing or private) and duration are clearly stated on each product page. beliakun is not officially affiliated with the brands sold; all trademarks belong to their respective owners.",
  },
  {
    heading: "Pembayaran",
    headingEn: "Payment",
    body: "Pembayaran dilakukan melalui QRIS, e-wallet, atau Virtual Account bank yang tersedia. Pesanan diproses setelah pembayaran terverifikasi secara otomatis. Harga dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.",
    bodyEn: "Payments are made via QRIS, e-wallet, or available bank Virtual Accounts. Orders are processed once payment is automatically verified. Prices may change at any time without prior notice.",
  },
  {
    heading: "Pengiriman & Garansi",
    headingEn: "Delivery & Warranty",
    body: "Detail akun dikirim ke email dan dashboard kamu, umumnya secara instan. Setiap akun bergaransi selama masa aktifnya. Akun bermasalah akan kami ganti atau perbaiki selama masa garansi masih berlaku.",
    bodyEn: "Account details are delivered to your email and dashboard, usually instantly. Each account is covered by a warranty for its full duration. Faulty accounts will be replaced or repaired while the warranty is still valid.",
  },
  {
    heading: "Refund",
    headingEn: "Refunds",
    body: "Jika kami tidak dapat mengirim akun atau menyelesaikan kendala dalam masa garansi, kamu berhak atas refund penuh atau penggantian senilai. Refund tidak berlaku untuk penyalahgunaan akun oleh pembeli.",
    bodyEn: "If we cannot deliver an account or resolve an issue within the warranty period, you are entitled to a full refund or an equivalent replacement. Refunds do not apply to account misuse by the buyer.",
  },
  {
    heading: "Tanggung Jawab Pengguna",
    headingEn: "User Responsibilities",
    body: "Kamu wajib menjaga kerahasiaan kredensial akun dan tidak mengubah email atau kata sandi tanpa instruksi kami. Penyalahgunaan dapat membatalkan garansi dan akses ke layanan.",
    bodyEn: "You must keep your account credentials confidential and must not change the email or password without our instruction. Misuse may void the warranty and your access to the service.",
  },
  {
    heading: "Perubahan Ketentuan",
    headingEn: "Changes to Terms",
    body: "Kami dapat memperbarui Syarat & Ketentuan ini sewaktu-waktu. Perubahan berlaku setelah dipublikasikan di halaman ini. Penggunaan layanan secara berkelanjutan dianggap sebagai persetujuan atas perubahan tersebut.",
    bodyEn: "We may update these Terms & Conditions at any time. Changes take effect once published on this page. Continued use of the service is considered acceptance of those changes.",
  },
]

export default async function SyaratPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("static")

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow={t("termsTitle")}
          title={t("termsTitle")}
          subtitle={`${t("lastUpdated")}: 24 Jun 2026`}
        />
        <LegalDoc sections={sections} />
      </div>
    </Container>
  )
}
