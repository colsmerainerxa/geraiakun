"use client"

import { Quote, Star } from "lucide-react"
import Image from "next/image"
import type { Testimonial } from "@/types"

function Card({ item }: { item: Testimonial }) {
  return (
    <figure className="flex w-80 shrink-0 flex-col gap-3 rounded-base border-2 border-border bg-secondary-background p-5 shadow-shadow">
      <div className="flex items-center justify-between">
        <div className="flex">
          {Array.from({ length: item.rating }).map((_, i) => (
            <Star key={i} className="size-4 fill-warning text-warning" />
          ))}
        </div>
        <Quote className="size-6 text-main" />
      </div>
      <blockquote className="flex-1 text-sm text-foreground/80">
        “{item.comment}”
      </blockquote>
      <figcaption className="flex items-center gap-3 border-t-2 border-dashed border-border pt-3">
        <Image
          src={item.avatar}
          alt={item.author}
          width={40}
          height={40}
          className="size-10 rounded-base border-2 border-border bg-main"
          unoptimized
        />
        <div>
          <div className="font-heading text-sm font-bold">{item.author}</div>
          <div className="text-xs text-foreground/60">{item.role}</div>
        </div>
      </figcaption>
    </figure>
  )
}

export function TestimonialsMarquee({ items }: { items: Testimonial[] }) {
  const loop = [...items, ...items]
  return (
    <div className="relative overflow-hidden py-2">
      <div className="marquee flex w-max gap-4">
        {loop.map((item, i) => (
          <Card key={`${item.id}-${i}`} item={item} />
        ))}
      </div>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}
