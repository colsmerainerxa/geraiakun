import { Home, Search } from "lucide-react"
import { Container } from "@/components/shared/container"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

// Rendered for notFound() within a locale segment (e.g. unknown product/category).
// not-found receives no params, so copy uses the default locale (id).
export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="font-heading text-7xl font-extrabold text-main sm:text-9xl">404</span>
      <h1 className="mt-4 font-heading text-2xl font-extrabold sm:text-3xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 max-w-md text-foreground/60">
        Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan. Yuk kembali belanja akun
        premium favoritmu.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="size-5" /> Ke Beranda
          </Link>
        </Button>
        <Button asChild size="lg" variant="neutral">
          <Link href="/katalog">
            <Search className="size-5" /> Jelajahi Katalog
          </Link>
        </Button>
      </div>
    </Container>
  )
}
