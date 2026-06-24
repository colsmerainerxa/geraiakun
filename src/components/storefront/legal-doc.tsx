"use client"

import { useLocale } from "next-intl"

type Section = {
  heading: string
  headingEn: string
  body: string
  bodyEn: string
}

export function LegalDoc({ sections }: { sections: Section[] }) {
  const isEn = useLocale() === "en"

  return (
    <ol className="mt-8 flex flex-col gap-6">
      {sections.map((s, i) => (
        <li
          key={s.heading}
          className="rounded-base border-2 border-border bg-secondary-background p-6 shadow-shadow"
        >
          <h2 className="flex items-start gap-3 font-heading text-lg font-extrabold">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading text-sm font-extrabold text-main-foreground shadow-shadow-sm">
              {i + 1}
            </span>
            <span className="pt-0.5">{isEn ? s.headingEn : s.heading}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {isEn ? s.bodyEn : s.body}
          </p>
        </li>
      ))}
    </ol>
  )
}
