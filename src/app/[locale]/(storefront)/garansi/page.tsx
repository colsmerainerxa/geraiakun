import { ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { LegalDoc } from "@/components/storefront/legal-doc"
import { Badge } from "@/components/ui/badge"
import { seoAlternates } from "@/lib/seo/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "warranty" })
  return {
    title: t("policyTitle"),
    description: t("policySubtitle"),
    alternates: seoAlternates(locale, "/garansi"),
  }
}

// Durasi garansi per tipe akun — inti dari kepercayaan di niche akun digital.
const WARRANTY_BY_TYPE = [
  {
    type: "Private",
    days: 30,
    desc: "Akun privat bergaransi penuh. Ganti akun baru bila gagal login atau rusak.",
    descEn:
      "Private accounts are fully warranted. Get a fresh replacement if login fails or the account breaks.",
    accent: "bg-accent-lime",
  },
  {
    type: "Sharing",
    days: 7,
    desc: "Akun sharing bergaransi 7 hari sejak pembelian untuk kendala teknis di sisi kami.",
    descEn:
      "Sharing accounts carry a 7-day warranty from purchase for technical faults on our end.",
    accent: "bg-accent-cyan",
  },
  {
    type: "Invite",
    days: 14,
    desc: "Undangan resmi ke email kamu, garansi sampai kamu berhasil join.",
    descEn:
      "Official invitation to your email, warranted until you successfully join.",
    accent: "bg-accent-purple",
  },
  {
    type: "Lifetime",
    days: null,
    desc: "Akses seumur hidup. Garansi aktif selama akun berfungsi normal.",
    descEn: "Lifetime access. Warranty stays active as long as the account works.",
    accent: "bg-accent-pink",
  },
]

const sections = [
  {
    heading: "Cakupan Garansi",
    headingEn: "Warranty Coverage",
    body: "Setiap akun yang dibeli di beliakun bergaransi sesuai masa aktifnya. Garansi mencakup akun yang tidak bisa login, kredensial salah, akun terkunci, atau fitur tidak berfungsi sebagaimana mestinya. Selama masa garansi berlaku, kami akan mengganti akun baru atau memperbaiki akun tersebut tanpa biaya tambahan.",
    bodyEn:
      "Every account purchased on beliakun carries a warranty matching its active period. The warranty covers accounts that cannot log in, wrong credentials, locked accounts, or features not working as described. While the warranty is valid, we will replace the account with a new one or repair it at no extra cost.",
  },
  {
    heading: "Cara Klaim Garansi",
    headingEn: "How to Claim Warranty",
    body: "Klaim garansi mudah dan cepat: (1) Catat nomor invoice pembelianmu, (2) Buka halaman Bantuan atau klik tombol 'Klaim Garansi' di detail pesanan, (3) Pilih jenis masalah 'Garansi / Ganti Akun', (4) Lampirkan screenshot kendala, (5) Tim kami merespons dalam maksimal 1×24 jam via WhatsApp atau email. Akun penggantian dikirim langsung ke dashboard & email kamu.",
    bodyEn:
      "Claiming warranty is quick and easy: (1) Note your purchase invoice number, (2) Open the Help page or click the 'Claim Warranty' button in your order details, (3) Choose the 'Warranty / Account Replacement' issue type, (4) Attach a screenshot of the problem, (5) Our team responds within max 1×24 hours via WhatsApp or email. Replacement accounts are sent straight to your dashboard & email.",
  },
  {
    heading: "Yang Membatalkan Garansi",
    headingEn: "What Voids the Warranty",
    body: "Garansi batal bila: kamu mengubah email atau kata sandi akun tanpa instruksi resmi dari kami; akun dipakai di terlalu banyak perangkat (untuk akun sharing); terjadi pelanggaran ketentuan dari provider brand (mis. banned karena aktivitas ilegal); atau kamu membagikan kembali akun ke pihak ketiga. Perubahan profil berbahaya dapat membatalkan akses dan klaim.",
    bodyEn:
      "The warranty is void if: you change the account email or password without official instruction from us; the account is used on too many devices (for sharing accounts); a brand provider's terms are violated (e.g. banned for illegal activity); or you re-share the account to third parties. Malicious profile changes may void access and claims.",
  },
  {
    heading: "Kebijakan Refund",
    headingEn: "Refund Policy",
    body: "Karena produk bersifat digital, refund tidak berlaku untuk akun yang sudah diterima dan berfungsi normal. Namun, jika kami tidak dapat mengirim akun, tidak menyelesaikan kendala dalam masa garansi, atau salah kirim produk, kamu berhak refund penuh atau penggantian senilai. Refund diproses 1–3 hari kerja ke metode pembayaran asli.",
    bodyEn:
      "Because products are digital, refunds do not apply to accounts already received and working normally. However, if we cannot deliver an account, fail to resolve an issue within the warranty period, or send the wrong product, you are entitled to a full refund or equivalent replacement. Refunds are processed within 1–3 business days to the original payment method.",
  },
  {
    heading: "Aturan Penggunaan Akun",
    headingEn: "Account Usage Rules",
    body: "Untuk menjaga garansi tetap aktif: jangan ubah email/password/PIN tanpa instruksi; keluar dari perangkat lama sebelum login di perangkat baru (untuk akun sharing); jangan aktifkan 2FA dengan nomormu sendiri; simpan kredensial di tempat aman. Panduan lengkap aktivasi tersedia di menu 'Panduan Aktivasi' setiap produk.",
    bodyEn:
      "To keep your warranty active: do not change email/password/PIN without instruction; log out of old devices before logging into a new one (for sharing accounts); do not enable 2FA with your own number; store credentials securely. Full activation guides are available in the 'Activation Guide' menu of each product.",
  },
  {
    heading: "Kontak & Eskalasi",
    headingEn: "Contact & Escalation",
    body: "Butuh bantuan mendesak? Chat WhatsApp kami 24/7 dengan menyebutkan nomor invoice. Bila tiket garansimu tidak ditangani dalam SLA, tingkatkan ke prioritas 'Tinggi' saat membuat tiket. Transparansi adalah komitmen kami — setiap klaim terlacak dengan kode tiket unik (mis. TKT-2606-001) yang bisa kamu pantau di Pusat Bantuan.",
    bodyEn:
      "Need urgent help? Chat our WhatsApp 24/7 with your invoice number. If your warranty ticket is not handled within the SLA, escalate it to 'High' priority when creating the ticket. Transparency is our commitment — every claim is tracked with a unique ticket code (e.g. TKT-2606-001) that you can monitor in the Help Center.",
  },
]

export default async function WarrantyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("warranty")
  const isEn = locale === "en"

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow={`🛡️ ${t("policyTitle")}`}
          title={t("policyTitle")}
          subtitle={t("policySubtitle")}
        />

        {/* Highlight: garansi per tipe akun */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WARRANTY_BY_TYPE.map((w) => (
            <div
              key={w.type}
              className="flex flex-col gap-2 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
            >
              <span
                className={`flex size-10 items-center justify-center rounded-base border-2 border-border ${w.accent} shadow-shadow-sm`}
              >
                <ShieldCheck className="size-5" />
              </span>
              <h3 className="font-heading text-base font-extrabold">{w.type}</h3>
              <Badge variant="neutral" className="w-fit">
                {w.days
                  ? `${w.days} hari`
                  : isEn
                    ? "Lifetime"
                    : "Seumur Hidup"}
              </Badge>
              <p className="text-xs leading-relaxed text-foreground/70">
                {isEn ? w.descEn : w.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-3xl">
          <LegalDoc sections={sections} />
        </div>

        <p className="mt-8 rounded-base border-2 border-dashed border-border bg-warning/10 p-4 text-center text-xs font-bold text-foreground/70">
          {t("policyFooter")}
        </p>
      </div>
    </Container>
  )
}
