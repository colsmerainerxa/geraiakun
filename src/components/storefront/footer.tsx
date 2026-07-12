"use client"

import { Send, Shield, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import { Container } from "@/components/shared/container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/navigation"

export function Footer() {
  const t = useTranslations("footer")
  const tn = useTranslations("nav")

  const cols = [
    {
      title: t("explore"),
      links: [
        { href: "/katalog", label: tn("catalog") },
        { href: "/wishlist", label: t("wishlist") },
        { href: "/akun/vault", label: t("vault") },
        { href: "/artikel", label: tn("blog") },
        { href: "/kategori/ai-chatbot", label: "AI & Chatbot" },
        { href: "/kategori/api-developer", label: "API & Developer" },
      ],
    },
    {
      title: t("support"),
      links: [
        { href: "/lacak", label: t("track") },
        { href: "/bantuan", label: t("faq") },
        { href: "/garansi", label: t("warranty") },
        { href: "/refund", label: t("refund") },
        { href: "/syarat", label: t("terms") },
        { href: "/privasi", label: t("privacy") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/tentang", label: t("about") },
        { href: "/kontak", label: t("contact") },
      ],
    },
  ]

  return (
    <footer className="mt-16 border-t-4 border-border bg-secondary-background">
      <Container className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand + newsletter */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow-sm">
                <Sparkles className="size-5" />
              </span>
              <span className="font-heading text-xl font-extrabold">
                beli<span className="text-accent-pink">akun</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-foreground/70">{t("tagline")}</p>
            <form className="mt-4 flex max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder={t("newsletterPlaceholder")}
                aria-label={t("newsletter")}
              />
              <Button type="submit" size="icon" variant="pink" aria-label={t("subscribe")}>
                <Send className="size-4" />
              </Button>
            </form>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading text-sm font-extrabold uppercase tracking-wide">
                {col.title}
              </h3>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-accent-pink hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t-2 border-dashed border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-foreground/60">© 2026 geraiakun. {t("rights")}</p>
          <span className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-success px-2.5 py-1 text-xs font-bold text-main-foreground">
            <Shield className="size-3.5" /> {t("secure")}
          </span>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-foreground/60">{t("disclaimer")}</p>
      </Container>
    </footer>
  )
}
