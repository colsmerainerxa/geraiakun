import { Headphones, ShieldCheck, Tag, Zap } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "static" })
  return {
    title: t("aboutTitle"),
    alternates: seoAlternates(locale, "/tentang"),
  }
}

export default async function TentangPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("static")
  const isEn = locale === "en"

  const values = [
    {
      icon: ShieldCheck,
      accent: "bg-accent-lime",
      title: isEn ? "Full Warranty" : "Garansi Penuh",
      desc: isEn
        ? "Every account is covered for its full duration. Issues get fixed or replaced, no drama."
        : "Setiap akun bergaransi penuh selama masa aktif. Ada kendala, langsung kami ganti tanpa drama.",
    },
    {
      icon: Zap,
      accent: "bg-accent-cyan",
      title: isEn ? "Instant Process" : "Proses Instan",
      desc: isEn
        ? "Payment verified automatically, account details delivered within seconds."
        : "Pembayaran terverifikasi otomatis, detail akun terkirim dalam hitungan detik.",
    },
    {
      icon: Tag,
      accent: "bg-accent-pink",
      title: isEn ? "Student Prices" : "Harga Mahasiswa",
      desc: isEn
        ? "Premium quality without the premium price tag — friendly for every kos budget."
        : "Kualitas premium tanpa harga premium — ramah di kantong anak kos.",
    },
    {
      icon: Headphones,
      accent: "bg-main",
      title: isEn ? "24/7 Support" : "Support 24/7",
      desc: isEn
        ? "A friendly team ready to help anytime, any day, straight from WhatsApp."
        : "Tim ramah siap bantu kapan saja, setiap hari, langsung dari WhatsApp.",
    },
  ]

  const stats = [
    {
      value: "10rb+",
      label: isEn ? "Happy Customers" : "Pelanggan Puas",
      accent: "bg-accent-cyan",
    },
    {
      value: "500+",
      label: isEn ? "Premium Products" : "Produk Premium",
      accent: "bg-accent-pink",
    },
    { value: "4.9/5", label: isEn ? "Store Rating" : "Rating Toko", accent: "bg-accent-lime" },
    { value: "24/7", label: isEn ? "Live Support" : "Dukungan Aktif", accent: "bg-main" },
  ]

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow={isEn ? "About" : "Tentang"}
          title={t("aboutTitle")}
          subtitle={
            isEn
              ? "A practical, transparent premium digital account marketplace."
              : "Marketplace akun digital premium yang praktis dan transparan."
          }
        />

        {/* Mission */}
        <div className="mt-8 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow sm:p-8">
          <h2 className="font-heading text-xl font-extrabold">
            {isEn ? "Our Mission" : "Misi Kami"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {isEn
              ? "beliakun exists to make premium AI and digital tools accessible to everyone — especially students and young creators. We bring ChatGPT, Gemini, Canva, Perplexity, API keys, and hundreds of other subscriptions to your fingertips with instant delivery, a real warranty, and prices that respect a student budget."
              : "beliakun hadir untuk membuat tools AI dan digital premium bisa diakses semua orang — terutama mahasiswa dan kreator muda. Kami hadirkan ChatGPT, Gemini, Canva, Perplexity, API key, dan ratusan langganan lainnya dalam genggaman dengan proses instan, garansi nyata, dan harga yang ramah kantong mahasiswa."}
          </p>
        </div>

        {/* Why beliakun */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-extrabold">
            {isEn ? "Why beliakun?" : "Kenapa beliakun?"}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="flex h-full flex-col gap-3 rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow"
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-base border-2 border-border ${v.accent} shadow-shadow-sm`}
                >
                  <v.icon className="size-6" />
                </span>
                <h3 className="font-heading text-base font-bold">{v.title}</h3>
                <p className="text-sm text-foreground/70">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`flex flex-col items-center rounded-base border-2 border-border ${s.accent} p-5 text-center shadow-shadow`}
            >
              <span className="font-heading text-3xl font-extrabold">{s.value}</span>
              <span className="mt-1 text-xs font-bold text-foreground/70">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}
