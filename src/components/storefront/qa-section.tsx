"use client"

import { MessageCircleQuestion, Send } from "lucide-react"
import { motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatDate, initials } from "@/lib/utils"
import { useReviewsStore } from "@/stores/reviews"
import type { Product } from "@/types"

// Seed pertanyaan contoh per produk (deterministik dari slug)
function seedQuestions(product: Product) {
  const base = [
    {
      q: {
        id: "Akun ini bisa dipakai di berapa device sekaligus?",
        en: "How many devices can use this account at once?",
      },
      a: {
        id: "Untuk akun sharing, maksimal 1-2 device aktif bersamaan agar tidak bentrok. Akun private bebas dipakai sesuai kebijakan platform.",
        en: "For sharing accounts, max 1-2 active devices at once to avoid conflicts. Private accounts are free to use per platform policy.",
      },
    },
    {
      q: { id: "Berapa lama garansinya berlaku?", en: "How long is the warranty valid?" },
      a: {
        id: "Garansi mengikuti durasi varian yang kamu pilih (mis. 1 bulan, lifetime). Klaim bisa diajukan kapan saja selama masa garansi.",
        en: "Warranty follows the variant duration you choose (e.g. 1 month, lifetime). Claims can be filed anytime during the warranty period.",
      },
    },
  ]
  return base.map((b, i) => ({
    id: `seed-qa-${product.id}-${i}`,
    productId: product.id,
    author: i === 0 ? "Bagus Maulana" : "Sinta Dewi",
    question: b.q,
    answer: b.a,
    date: `2026-0${(i % 6) + 1}-1${i}`,
  }))
}

export function QaSection({ product }: { product: Product }) {
  const t = useTranslations("qa")
  const isEn = useLocale() === "en"
  const dateLocale = isEn ? "en-US" : "id-ID"
  const lang = (s: { id: string; en: string }) => (isEn ? s.en : s.id)

  const userQuestions = useReviewsStore((s) => s.questionsForProduct(product.id))
  const askQuestion = useReviewsStore((s) => s.askQuestion)

  const seeds = seedQuestions(product)

  const [question, setQuestion] = useState("")
  const [name, setName] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    askQuestion({
      productId: product.id,
      author: name.trim() || (isEn ? "Anonymous" : "Anonim"),
      question: question.trim(),
    })
    toast.success(t("submitted"))
    setQuestion("")
    setName("")
  }

  return (
    <div>
      {/* Ask form */}
      <div className="rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="size-5 text-accent-cyan" />
          <h2 className="font-heading text-base font-extrabold">{t("title")}</h2>
        </div>
        <p className="mt-1 text-sm text-foreground/60">{t("subtitle")}</p>
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("askPlaceholder")}
            required
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("askName")}
              className="sm:max-w-[200px]"
            />
            <Button type="submit" className="shrink-0">
              <Send className="size-4" /> {t("askButton")}
            </Button>
          </div>
        </form>
      </div>

      {/* Questions list */}
      <div className="mt-4 flex flex-col gap-3">
        {seeds.length === 0 && userQuestions.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">{t("noQuestions")}</p>
        ) : (
          <>
            {/* User questions first */}
            {[...userQuestions].reverse().map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-base border-2 border-accent-lime bg-secondary-background p-4 shadow-shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(q.author)}`}
                      alt={q.author}
                    />
                    <AvatarFallback className="text-[10px]">{initials(q.author)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="text-xs font-bold">{q.author}</span>
                    <span className="ml-2 text-[10px] text-foreground/60">
                      {formatDate(q.date, dateLocale)}
                    </span>
                  </div>
                  <Badge variant="lime">{t("asked")}</Badge>
                </div>
                <p className="mt-2 text-sm font-semibold">{q.question}</p>
                {q.answer ? (
                  <div className="mt-2 rounded-base border-2 border-border bg-background p-3">
                    <p className="text-xs font-bold text-foreground/60">
                      {t("answered")} {t("seller")}:
                    </p>
                    <p className="mt-1 text-sm text-foreground/80">{q.answer}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs italic text-foreground/60">
                    {isEn ? "Awaiting seller reply..." : "Menunggu balasan penjual..."}
                  </p>
                )}
              </motion.div>
            ))}

            {/* Seed questions */}
            {seeds.map((q) => (
              <div
                key={q.id}
                className={cn(
                  "rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(q.author)}`}
                      alt={q.author}
                    />
                    <AvatarFallback className="text-[10px]">{initials(q.author)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="text-xs font-bold">{q.author}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold">{lang(q.question)}</p>
                <div className="mt-2 rounded-base border-2 border-border bg-background p-3">
                  <p className="text-xs font-bold text-foreground/60">
                    {t("answered")} {t("seller")}:
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{lang(q.answer)}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
