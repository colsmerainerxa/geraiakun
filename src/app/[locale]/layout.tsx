import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Space_Grotesk } from "next/font/google"
import { notFound } from "next/navigation"
import { Providers } from "@/app/providers"
import { routing } from "@/i18n/routing"
import { seoAlternates, SITE_URL } from "@/lib/seo/site"
import "../globals.css"

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })
  const baseUrl = SITE_URL

  return {
    metadataBase: new URL(baseUrl),
    title: { default: t("title"), template: `%s · beliakun` },
    description: t("description"),
    keywords: [
      "jual akun digital",
      "akun ChatGPT murah",
      "Gemini Pro",
      "Canva Pro",
      "Perplexity Pro",
      "API key murah",
      "langganan premium Indonesia",
    ],
    alternates: seoAlternates(locale, ""),
    openGraph: {
      type: "website",
      locale: locale === "id" ? "id_ID" : "en_US",
      url: baseUrl,
      siteName: "beliakun",
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fef1e0" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1d24" },
  ],
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <html lang={locale} suppressHydrationWarning className={fontSans.variable}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
