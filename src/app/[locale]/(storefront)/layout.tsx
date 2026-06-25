import { setRequestLocale } from "next-intl/server"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { Footer } from "@/components/storefront/footer"
import { Navbar } from "@/components/storefront/navbar"
import { SocialProofToast } from "@/components/storefront/social-proof-toast"
import { WhatsAppWidget } from "@/components/storefront/whatsapp-widget"

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-base focus:border-2 focus:border-border focus:bg-main focus:px-4 focus:py-2 focus:font-heading focus:font-bold focus:shadow-shadow"
      >
        {locale === "en" ? "Skip to content" : "Lewati ke konten"}
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SocialProofToast />
      <WhatsAppWidget />
      <ScrollToTop />
    </div>
  )
}
