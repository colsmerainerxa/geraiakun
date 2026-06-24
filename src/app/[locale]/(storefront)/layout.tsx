import { setRequestLocale } from "next-intl/server"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { Footer } from "@/components/storefront/footer"
import { Navbar } from "@/components/storefront/navbar"

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
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
