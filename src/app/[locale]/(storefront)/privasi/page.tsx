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
    title: t("privacyTitle"),
    alternates: seoAlternates(locale, "/privasi"),
  }
}

const sections = [
  {
    heading: "Data yang Kami Kumpulkan",
    headingEn: "Data We Collect",
    body: "Kami mengumpulkan data yang kamu berikan saat memesan, seperti nama, email, dan nomor WhatsApp, serta detail transaksi yang diperlukan untuk memproses pesanan kamu.",
    bodyEn:
      "We collect the data you provide when ordering, such as your name, email, and WhatsApp number, along with the transaction details needed to process your order.",
  },
  {
    heading: "Penggunaan Data",
    headingEn: "How We Use Data",
    body: "Data kamu digunakan untuk memproses pesanan, mengirim detail akun, memberikan dukungan pelanggan, serta mengirim informasi penting terkait layanan. Kami tidak akan menggunakan data kamu di luar tujuan ini tanpa izin.",
    bodyEn:
      "Your data is used to process orders, deliver account details, provide customer support, and send important service-related information. We will not use your data beyond these purposes without consent.",
  },
  {
    heading: "Keamanan Data",
    headingEn: "Data Security",
    body: "Kami menerapkan langkah keamanan yang wajar untuk melindungi data kamu, termasuk enkripsi pada proses pembayaran. Meski demikian, tidak ada metode transmisi internet yang sepenuhnya aman 100%.",
    bodyEn:
      "We apply reasonable security measures to protect your data, including encryption during payment. That said, no method of internet transmission is ever completely 100% secure.",
  },
  {
    heading: "Berbagi dengan Pihak Ketiga",
    headingEn: "Sharing with Third Parties",
    body: "Kami tidak menjual data pribadi kamu. Data hanya dibagikan kepada penyedia layanan pembayaran tepercaya sejauh diperlukan untuk menyelesaikan transaksi, atau bila diwajibkan oleh hukum.",
    bodyEn:
      "We do not sell your personal data. Data is only shared with trusted payment providers as needed to complete a transaction, or where required by law.",
  },
  {
    heading: "Cookie",
    headingEn: "Cookies",
    body: "Kami menggunakan cookie untuk meningkatkan pengalaman belanja kamu, mengingat preferensi, dan menganalisis lalu lintas situs. Kamu dapat mengatur cookie melalui pengaturan browser kamu.",
    bodyEn:
      "We use cookies to improve your shopping experience, remember preferences, and analyze site traffic. You can manage cookies through your browser settings.",
  },
  {
    heading: "Hak Kamu",
    headingEn: "Your Rights",
    body: "Kamu berhak meminta akses, pembaruan, atau penghapusan data pribadi kamu. Untuk melakukannya, cukup hubungi tim kami melalui halaman Kontak.",
    bodyEn:
      "You have the right to request access to, updates of, or deletion of your personal data. To do so, simply reach out to our team via the Contact page.",
  },
  {
    heading: "Perubahan Kebijakan",
    headingEn: "Policy Changes",
    body: "Kebijakan Privasi ini dapat diperbarui sewaktu-waktu. Versi terbaru akan selalu tersedia di halaman ini beserta tanggal pembaruannya.",
    bodyEn:
      "This Privacy Policy may be updated at any time. The latest version will always be available on this page along with its update date.",
  },
]

export default async function PrivasiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("static")

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow={t("privacyTitle")}
          title={t("privacyTitle")}
          subtitle={`${t("lastUpdated")}: 24 Jun 2026`}
        />
        <LegalDoc sections={sections} />
      </div>
    </Container>
  )
}
