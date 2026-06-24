"use client"

import { ArrowRight, MessageCircle, Search } from "lucide-react"
import { useLocale } from "next-intl"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { helpFaqs, localizedFaqs } from "@/lib/faq"

export function FaqAccordion() {
  const isEn = useLocale() === "en"
  const faqs = localizedFaqs(helpFaqs, isEn)

  return (
    <div className="mt-8 flex flex-col gap-8">
      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {faqs.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger>{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="rounded-base border-2 border-border bg-main p-6 shadow-shadow sm:p-8">
        <h2 className="font-heading text-xl font-extrabold text-main-foreground">
          {isEn ? "Still need help?" : "Masih butuh bantuan?"}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-main-foreground/80">
          {isEn
            ? "Reach out to our team or track your order in real time."
            : "Hubungi tim kami atau lacak status pesananmu secara real-time."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="neutral" asChild>
            <Link href="/kontak">
              <MessageCircle className="size-4" />
              {isEn ? "Contact Us" : "Hubungi Kami"}
            </Link>
          </Button>
          <Button variant="neutral" asChild>
            <Link href="/lacak">
              <Search className="size-4" />
              {isEn ? "Track Order" : "Lacak Pesanan"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
