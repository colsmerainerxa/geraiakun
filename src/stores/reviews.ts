"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { QaQuestion, UserReview } from "@/types"

interface ReviewsState {
  reviews: UserReview[]
  addReview: (r: Omit<UserReview, "id" | "date" | "verified">) => UserReview
  reviewsForProduct: (productId: string) => UserReview[]

  questions: QaQuestion[]
  askQuestion: (
    q: Omit<QaQuestion, "id" | "date" | "answer" | "answeredBy" | "answeredAt">,
  ) => QaQuestion
  questionsForProduct: (productId: string) => QaQuestion[]
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
      reviewsForProduct: (productId) =>
        get().reviews.filter((r) => r.productId === productId),

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
      questionsForProduct: (productId) =>
        get().questions.filter((q) => q.productId === productId),
    }),
    { name: "beliakun-reviews" },
  ),
)
