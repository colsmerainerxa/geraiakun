"use client"

import { Star } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatDate, initials } from "@/lib/utils"
import { useReviewsStore } from "@/stores/reviews"
import type { Product, Review } from "@/types"

type SortKey = "recent" | "highest" | "lowest"

/** Satu item review terpadu (mock atau buatan user) — bentuk seragam. */
interface FlatReview {
  id: string
  author: string
  avatar: string | null
  rating: number
  title: string | null
  comment: string
  variantLabel: string
  date: string
  verified: boolean
  userGenerated: boolean
}

function avatarFor(author: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(author)}`
}

function toFlat(r: Review): FlatReview {
  return {
    id: r.id,
    author: r.author,
    avatar: r.avatar,
    rating: r.rating,
    title: null,
    comment: r.comment,
    variantLabel: r.variantLabel,
    date: r.date,
    verified: r.verified,
    userGenerated: false,
  }
}

function StarRow({
  rating,
  size = "size-3",
}: {
  rating: number
  size?: string
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size,
            i < rating
              ? "fill-warning text-warning"
              : "text-foreground/20",
          )}
        />
      ))}
    </span>
  )
}

function RatingDistribution({
  distribution,
}: {
  distribution: number[]
  isEn: boolean
  t: ReturnType<typeof useTranslations>
}) {
  const max = Math.max(1, ...distribution)
  return (
    <div className="flex flex-col gap-3">
      {distribution.map((count, i) => {
        const stars = 5 - i
        return (
          <div key={stars} className="flex items-center gap-2">
            <span className="flex w-12 items-center gap-1 text-xs font-bold">
              {stars} <Star className="size-3 fill-warning text-warning" />
            </span>
            <Progress
              value={(count / max) * 100}
              className="h-2.5 flex-1 border-0 bg-foreground/10"
              indicatorClassName="bg-warning"
            />
            <span className="w-8 text-right text-xs font-bold text-foreground/60">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ReviewForm({
  productId,
  productName,
}: {
  productId: string
  productName: string
}) {
  const t = useTranslations("reviews")
  const tc = useTranslations("common")
  const isEn = useLocale() === "en"
  const addReview = useReviewsStore((s) => s.addReview)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [name, setName] = useState("")
  const [open, setOpen] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      toast.error(t("needRating"))
      return
    }
    addReview({
      productId,
      author: name.trim() || (isEn ? "Anonymous" : "Anonim"),
      rating,
      title: title.trim(),
      comment: comment.trim(),
      variantLabel: productName,
    })
    toast.success(t("submitted"))
    setRating(0)
    setHover(0)
    setTitle("")
    setComment("")
    setName("")
    setOpen(false)
  }

  if (!open) {
    return (
      <Button variant="neutral" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        ✍️ {t("writeButton")}
      </Button>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      onSubmit={submit}
      className="overflow-hidden rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow"
    >
      <h3 className="font-heading text-base font-extrabold">{t("writeTitle")}</h3>

      {/* Interactive stars */}
      <div className="mt-3">
        <Label>{t("ratingLabel")}</Label>
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              aria-label={`${s} star`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "size-7 transition-transform hover:scale-110",
                  (hover || rating) >= s
                    ? "fill-warning text-warning"
                    : "text-foreground/20",
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 font-heading font-bold">{rating}/5</span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <Label htmlFor="rev-title">{t("titleLabel")}</Label>
        <Input
          id="rev-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          className="mt-1.5"
        />
      </div>

      <div className="mt-3">
        <Label htmlFor="rev-comment">{t("commentLabel")}</Label>
        <Textarea
          id="rev-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
          className="mt-1.5"
          required
        />
      </div>

      <div className="mt-3">
        <Label htmlFor="rev-name">{t("nameLabel")}</Label>
        <Input
          id="rev-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="mt-1.5"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="submit">{t("submit")}</Button>
        <Button type="button" variant="neutral" onClick={() => setOpen(false)}>
          {tc("cancel")}
        </Button>
      </div>
    </motion.form>
  )
}

export function ReviewsSection({
  product,
  mockReviews,
}: {
  product: Product
  mockReviews: Review[]
}) {
  const t = useTranslations("reviews")
  const isEn = useLocale() === "en"
  const dateLocale = isEn ? "en-US" : "id-ID"
  const userReviews = useReviewsStore((s) =>
    s.reviewsForProduct(product.id),
  )

  const [sort, setSort] = useState<SortKey>("recent")
  const [filterStar, setFilterStar] = useState<number | null>(null)

  const all: FlatReview[] = useMemo(() => {
    const merged: FlatReview[] = [
      ...userReviews.map((u) => ({
        id: u.id,
        author: u.author,
        avatar: avatarFor(u.author),
        rating: u.rating,
        title: u.title,
        comment: u.comment,
        variantLabel: u.variantLabel,
        date: u.date,
        verified: u.verified,
        userGenerated: true,
      })),
      ...mockReviews.map(toFlat),
    ]
    return merged
  }, [userReviews, mockReviews])

  const distribution = useMemo(() => {
    const d = [0, 0, 0, 0, 0] // index 0 = 5 stars
    for (const r of all) {
      const idx = 5 - Math.max(1, Math.min(5, r.rating))
      d[idx] += 1
    }
    return d
  }, [all])

  const filtered = useMemo(() => {
    let list = [...all]
    if (filterStar) list = list.filter((r) => r.rating === filterStar)
    switch (sort) {
      case "highest":
        list.sort((a, b) => b.rating - a.rating)
        break
      case "lowest":
        list.sort((a, b) => a.rating - b.rating)
        break
      default:
        list.sort((a, b) => b.date.localeCompare(a.date))
    }
    return list
  }, [all, sort, filterStar])

  const avg =
    all.length > 0
      ? all.reduce((s, r) => s + r.rating, 0) / all.length
      : product.rating

  return (
    <div id="reviews" className="scroll-mt-20">
      {/* Summary */}
      <div className="grid gap-5 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow sm:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center border-b-2 border-dashed border-border pb-4 text-center sm:border-b-0 sm:border-r-2 sm:pb-0 sm:pr-5">
          <span className="font-heading text-5xl font-extrabold">
            {avg.toFixed(1)}
          </span>
          <StarRow rating={Math.round(avg)} size="size-4" />
          <span className="mt-1 text-xs text-foreground/60">
            {t("basedOn", { count: all.length })}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <RatingDistribution
            distribution={distribution}
            isEn={isEn}
            t={t}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <ReviewForm productId={product.id} productName={product.name} />
        <div className="flex flex-wrap items-center gap-2">
          {filterStar && (
            <button type="button" onClick={() => setFilterStar(null)}>
              <Badge variant="neutral" className="gap-1">
                {filterStar}★ ✕
              </Badge>
            </button>
          )}
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("sortRecent")}</SelectItem>
              <SelectItem value="highest">{t("sortHighest")}</SelectItem>
              <SelectItem value="lowest">{t("sortLowest")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick filter by star */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStar(filterStar === s ? null : s)}
            className={cn(
              "rounded-base border-2 px-2.5 py-1 text-xs font-bold transition-all",
              filterStar === s
                ? "border-border bg-main text-main-foreground shadow-shadow-sm"
                : "border-border bg-secondary-background hover:-translate-y-0.5",
            )}
          >
            {s} ★
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-5 grid gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm",
                r.userGenerated && "border-accent-lime",
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  {r.avatar && <AvatarImage src={r.avatar} alt={r.author} />}
                  <AvatarFallback>{initials(r.author)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-sm font-bold">
                      {r.author}
                    </span>
                    {r.verified && (
                      <Badge variant="success" className="gap-1">
                        ✓ {isEn ? "Verified" : "Terverifikasi"}
                      </Badge>
                    )}
                    {r.userGenerated && (
                      <Badge variant="lime">{t("yourReview")}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/50">
                    <StarRow rating={r.rating} />
                    <span>· {r.variantLabel}</span>
                    <span>· {formatDate(r.date, dateLocale)}</span>
                  </div>
                </div>
              </div>
              {r.title && (
                <p className="mt-2 font-heading text-sm font-bold">{r.title}</p>
              )}
              <p className="mt-1.5 text-sm text-foreground/80">{r.comment}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="rounded-base border-2 border-dashed border-border py-12 text-center text-sm text-foreground/60">
            {isEn ? "No reviews match this filter." : "Tidak ada ulasan untuk filter ini."}
          </div>
        )}
      </div>
    </div>
  )
}
