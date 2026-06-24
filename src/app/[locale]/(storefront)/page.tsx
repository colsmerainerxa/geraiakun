import {
  ArrowRight,
  Headphones,
  ShieldCheck,
  Tag,
  Zap,
} from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Container } from "@/components/shared/container"
import {
  Reveal,
  RevealGroup,
  RevealItem,
} from "@/components/shared/motion"
import { SectionHeading } from "@/components/shared/section-heading"
import { CategoryCard } from "@/components/storefront/category-card"
import { Hero } from "@/components/storefront/hero"
import { ProductCard } from "@/components/storefront/product-card"
import { RecentlyViewedStrip } from "@/components/storefront/recently-viewed-strip"
import { TestimonialsMarquee } from "@/components/storefront/testimonials-marquee"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { fakeApi } from "@/lib/mock/fake-api"
import {
  JsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld"

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("home")
  const tc = await getTranslations("common")

  const [categories, featured, testimonials] = await Promise.all([
    fakeApi.getCategories(),
    fakeApi.getFeatured(),
    fakeApi.getTestimonials(),
  ])

  const steps = [
    { n: "01", title: t("step1Title"), desc: t("step1Desc"), accent: "bg-accent-cyan" },
    { n: "02", title: t("step2Title"), desc: t("step2Desc"), accent: "bg-accent-pink" },
    { n: "03", title: t("step3Title"), desc: t("step3Desc"), accent: "bg-accent-lime" },
  ]

  const trust = [
    { icon: ShieldCheck, title: t("trust1Title"), desc: t("trust1Desc"), accent: "bg-accent-lime" },
    { icon: Zap, title: t("trust2Title"), desc: t("trust2Desc"), accent: "bg-accent-cyan" },
    { icon: Tag, title: t("trust3Title"), desc: t("trust3Desc"), accent: "bg-accent-pink" },
    { icon: Headphones, title: t("trust4Title"), desc: t("trust4Desc"), accent: "bg-main" },
  ]

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />

      <Hero />

      {/* Categories */}
      <Container className="py-16">
        <SectionHeading
          eyebrow="Kategori"
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
        />
        <RevealGroup className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <RevealItem key={c.id}>
              <CategoryCard category={c} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>

      {/* Featured products */}
      <div className="border-y-2 border-border bg-secondary-background/50">
        <Container className="py-16">
          <SectionHeading
            eyebrow="🔥 Hot"
            title={t("featuredTitle")}
            subtitle={t("featuredSubtitle")}
            action={
              <Button variant="neutral" asChild>
                <Link href="/katalog">
                  {tc("viewAll")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
          <RevealGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </div>

      {/* Recently viewed (client; hidden when empty) */}
      <RecentlyViewedStrip />

      {/* How it works */}
      <Container id="cara-kerja" className="scroll-mt-20 py-16">
        <SectionHeading
          align="center"
          eyebrow={t("howTitle")}
          title={t("howTitle")}
          subtitle={t("howSubtitle")}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="relative h-full rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow">
                <span
                  className={`flex size-14 items-center justify-center rounded-base border-2 border-border ${s.accent} font-heading text-xl font-extrabold shadow-shadow-sm`}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-foreground/70">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Trust / why us */}
      <div className="border-y-2 border-border bg-secondary-background/50">
        <Container className="py-16">
          <SectionHeading align="center" title={t("trustTitle")} />
          <RevealGroup className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map((item) => (
              <RevealItem key={item.title}>
                <div className="flex h-full flex-col items-center gap-3 rounded-base border-2 border-border bg-secondary-background p-6 text-center shadow-shadow">
                  <span
                    className={`flex size-14 items-center justify-center rounded-base border-2 border-border ${item.accent} shadow-shadow-sm`}
                  >
                    <item.icon className="size-7" />
                  </span>
                  <h3 className="font-heading text-base font-bold">
                    {item.title}
                  </h3>
                  <p className="text-sm text-foreground/70">{item.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </div>

      {/* Testimonials */}
      <Container className="py-16">
        <SectionHeading
          align="center"
          eyebrow="💬 Testimoni"
          title={t("testimonialsTitle")}
          subtitle={t("testimonialsSubtitle")}
        />
      </Container>
      <TestimonialsMarquee items={testimonials} />

      {/* CTA */}
      <Container className="py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-base border-2 border-border bg-main p-10 text-center shadow-shadow-lg sm:p-16">
            <div className="bg-dots pointer-events-none absolute inset-0 opacity-10" />
            <h2 className="relative font-heading text-3xl font-extrabold text-main-foreground text-balance sm:text-5xl">
              {t("ctaTitle")}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-main-foreground/80">
              {t("ctaSubtitle")}
            </p>
            <div className="relative mt-8">
              <Button size="xl" variant="neutral" asChild>
                <Link href="/katalog">
                  {t("ctaButton")} <ArrowRight className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </>
  )
}
