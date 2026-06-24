"use client"

import { RotateCcw, TriangleAlert } from "lucide-react"
import { useEffect } from "react"
import { Container } from "@/components/shared/container"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface for observability; replace with real logging in production.
    console.error(error)
  }, [error])

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-20 items-center justify-center rounded-base border-2 border-border bg-danger text-white shadow-shadow">
        <TriangleAlert className="size-10" />
      </span>
      <h1 className="mt-6 font-heading text-2xl font-extrabold sm:text-3xl">
        Terjadi kesalahan
      </h1>
      <p className="mt-2 max-w-md text-foreground/60">
        Maaf, ada yang tidak beres saat memuat halaman ini. Coba muat ulang.
      </p>
      <Button onClick={reset} size="lg" className="mt-8">
        <RotateCcw className="size-5" /> Coba Lagi
      </Button>
    </Container>
  )
}
