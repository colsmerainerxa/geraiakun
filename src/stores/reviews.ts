"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { QaQuestion, UserReview } from "@/types"

interface ReviewsState {
  reviews: UserReview[]
  addReview: (r: Omit<UserReview, "id" | "date" | "verified">) => UserReview
  reviewsForProduct: (productId: string) => UserReview[]
  /** Hapus ulasan buatan user (moderasi admin). */
  deleteReview: (id: string) => void

  questions: QaQuestion[]
  askQuestion: (
    q: Omit<QaQuestion, "id" | "date" | "answer" | "answeredBy" | "answeredAt">,
  ) => QaQuestion
  questionsForProduct: (productId: string) => QaQuestion[]
  /** Admin menjawab pertanyaan Q&A. */
  answerQuestion: (id: string, answer: string, answeredBy?: string) => void
  /** Hapus pertanyaan Q&A (moderasi admin). */
  deleteQuestion: (id: string) => void
}

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      addReview: (input) => {
        const review: UserReview = {
          ...input,
          id: `urev-${Date.now()}`,
          date: new Date().toISOString(),
          // Di demo ini anggap semua reviewer "verified" karena harus lewat
          // flow checkout untuk menulis ulasan.
          verified: true,
        }
        set((s) => ({ reviews: [review, ...s.reviews] }))
        return review
      },
      reviewsForProduct: (productId) => get().reviews.filter((r) => r.productId === productId),
      deleteReview: (id) => set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),

      questions: [],
      askQuestion: (input) => {
        const q: QaQuestion = {
          ...input,
          id: `qa-${Date.now()}`,
          date: new Date().toISOString(),
          answer: null,
          answeredBy: null,
          answeredAt: null,
        }
        set((s) => ({ questions: [q, ...s.questions] }))
        return q
      },
      questionsForProduct: (productId) => get().questions.filter((q) => q.productId === productId),
      answerQuestion: (id, answer, answeredBy = "CS beliakun") =>
        set((s) => ({
          questions: s.questions.map((q) =>
            q.id === id
              ? {
                  ...q,
                  answer,
                  answeredBy,
                  answeredAt: new Date().toISOString(),
                }
              : q,
          ),
        })),
      deleteQuestion: (id) => set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),
    }),
    { name: "beliakun-reviews" },
  ),
)
