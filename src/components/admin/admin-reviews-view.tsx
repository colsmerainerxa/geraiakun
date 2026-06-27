"use client"

import { CheckCircle2, MessageCircleQuestion, Reply, Star, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { products } from "@/lib/mock/products"
import { cn, formatDate, initials } from "@/lib/utils"
import { useReviewsStore } from "@/stores/reviews"

const productName = (id: string) =>
  products.find((p) => p.id === id)?.name ?? "Produk tidak dikenal"

export function AdminReviewsView() {
  const reviews = useReviewsStore((s) => s.reviews)
  const deleteReview = useReviewsStore((s) => s.deleteReview)
  const questions = useReviewsStore((s) => s.questions)
  const answerQuestion = useReviewsStore((s) => s.answerQuestion)
  const deleteQuestion = useReviewsStore((s) => s.deleteQuestion)

  const [search, setSearch] = useState("")
  const [qSearch, setQSearch] = useState("")
  const [draft, setDraft] = useState<Record<string, string>>({})

  const filteredReviews = useMemo(() => {
    const q = search.toLowerCase().trim()
    return reviews.filter(
      (r) =>
        !q ||
        r.author.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        productName(r.productId).toLowerCase().includes(q),
    )
  }, [reviews, search])

  const pendingQ = useMemo(
    () =>
      questions.filter(
        (q) =>
          !q.answer &&
          (!qSearch.trim() ||
            q.question.toLowerCase().includes(qSearch.toLowerCase()) ||
            q.author.toLowerCase().includes(qSearch.toLowerCase())),
      ),
    [questions, qSearch],
  )
  const answeredQ = useMemo(() => questions.filter((q) => q.answer), [questions])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Tabs defaultValue="reviews">
        <TabsList className="grid h-auto w-full grid-cols-1 sm:inline-flex sm:h-12 sm:w-auto">
          <TabsTrigger
            value="reviews"
            className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap"
          >
            Ulasan Pembeli ({reviews.length})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap"
          >
            Tanya: Belum Dijawab ({pendingQ.length})
          </TabsTrigger>
          <TabsTrigger
            value="answered"
            className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap"
          >
            Tanya: Terjawab ({answeredQ.length})
          </TabsTrigger>
        </TabsList>

        {/* ---- Reviews ---- */}
        <TabsContent value="reviews">
          <div className="flex flex-col gap-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ulasan (penulis, isi, produk)..."
              className="max-w-sm"
            />
            {filteredReviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="Belum ada ulasan buatan pembeli"
                desc="Ulasan yang dibeli pelanggan lewat halaman produk akan muncul di sini untuk dimoderasi."
              />
            ) : (
              <div className="grid gap-3">
                {filteredReviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-base border-2 border-border bg-secondary-background p-4 shadow-shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-9">
                          <AvatarFallback>{initials(r.author)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-sm font-bold">{r.author}</span>
                            {r.verified && (
                              <Badge variant="success" className="gap-1 px-1.5 py-0 text-[10px]">
                                <CheckCircle2 className="size-3" /> Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-foreground/50">
                            <span className="inline-flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "size-3",
                                    i < r.rating
                                      ? "fill-warning text-warning"
                                      : "text-foreground/20",
                                  )}
                                />
                              ))}
                            </span>
                            <span>· {formatDate(r.date)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="icon-sm"
                        aria-label="Hapus ulasan"
                        onClick={() => {
                          deleteReview(r.id)
                          toast.success("Ulasan dihapus")
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    {r.title && <p className="mt-2.5 font-heading text-sm font-bold">{r.title}</p>}
                    <p className="mt-1 text-sm text-foreground/80">{r.comment}</p>
                    <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-border pt-2.5">
                      <Badge variant="neutral">{productName(r.productId)}</Badge>
                      <span className="text-[10px] text-foreground/40">{r.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ---- Pending Q&A ---- */}
        <TabsContent value="pending">
          <div className="flex flex-col gap-4">
            <Input
              value={qSearch}
              onChange={(e) => setQSearch(e.target.value)}
              placeholder="Cari pertanyaan belum dijawab..."
              className="max-w-sm"
            />
            {pendingQ.length === 0 ? (
              <EmptyState
                icon={MessageCircleQuestion}
                title="Tidak ada pertanyaan tertunda 🎉"
                desc="Semua pertanyaan dari pembeli sudah terbalas. Kerja bagus!"
              />
            ) : (
              <div className="grid gap-3">
                {pendingQ.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-base border-2 border-warning bg-secondary-background p-4 shadow-shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback>{initials(q.author)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-bold">{q.author}</span>
                          <p className="text-xs text-foreground/50">
                            {productName(q.productId)} · {formatDate(q.date)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="warning">Menunggu</Badge>
                    </div>
                    <p className="mt-2.5 text-sm font-semibold">{q.question}</p>
                    <div className="mt-3 flex gap-2">
                      <Textarea
                        rows={2}
                        value={draft[q.id] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [q.id]: e.target.value }))}
                        placeholder="Tulis jawaban untuk pembeli..."
                        className="text-sm"
                      />
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          deleteQuestion(q.id)
                          toast.success("Pertanyaan dihapus")
                        }}
                      >
                        <Trash2 className="size-4" /> Hapus
                      </Button>
                      <Button
                        size="sm"
                        disabled={!draft[q.id]?.trim()}
                        onClick={() => {
                          answerQuestion(q.id, draft[q.id].trim())
                          setDraft((d) => {
                            const next = { ...d }
                            delete next[q.id]
                            return next
                          })
                          toast.success("Jawaban dipublikasikan")
                        }}
                      >
                        <Reply className="size-4" /> Jawab
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ---- Answered Q&A ---- */}
        <TabsContent value="answered">
          {answeredQ.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Belum ada pertanyaan terjawab"
              desc="Pertanyaan yang sudah kamu balas akan tersimpan di sini."
            />
          ) : (
            <div className="grid gap-3">
              {answeredQ.map((q) => (
                <div
                  key={q.id}
                  className="rounded-base border-2 border-accent-lime bg-secondary-background p-4 shadow-shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback>{initials(q.author)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-bold">{q.author}</span>
                        <p className="text-xs text-foreground/50">
                          {productName(q.productId)} · {formatDate(q.date)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="icon-sm"
                      aria-label="Hapus"
                      onClick={() => {
                        deleteQuestion(q.id)
                        toast.success("Pertanyaan dihapus")
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2.5 text-sm font-semibold">{q.question}</p>
                  <div className="mt-2 rounded-base border-2 border-border bg-background p-3">
                    <p className="text-xs font-bold text-foreground/60">
                      {q.answeredBy} · {q.answeredAt ? formatDate(q.answeredAt) : ""}
                    </p>
                    <p className="mt-1 text-sm text-foreground/80">{q.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Star
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-base border-2 border-dashed border-border px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow-sm">
        <Icon className="size-6" />
      </span>
      <h3 className="font-heading text-base font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-foreground/60">{desc}</p>
    </div>
  )
}

export function AdminReviewsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96" />
    </div>
  )
}
