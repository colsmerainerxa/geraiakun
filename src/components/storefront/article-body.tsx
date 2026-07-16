import { ExternalLink } from "lucide-react"
import type { ArticleContent, ArticleSource } from "@/content/articles/types"

export function ArticleBody({
  content,
  sources,
  isEn,
}: {
  content: ArticleContent
  sources: ArticleSource[]
  isEn: boolean
}) {
  return (
    <div className="mt-8 space-y-10">
      <p className="text-lg leading-8 text-foreground/80">{content.intro}</p>

      <aside className="border-l-4 border-main bg-main/10 px-5 py-4">
        <h2 className="font-heading text-lg font-bold">
          {isEn ? "Key takeaways" : "Ringkasan utama"}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/80">
          {content.keyTakeaways.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>

      {content.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="font-heading text-2xl font-extrabold leading-tight">{section.heading}</h2>
          <div className="mt-4 space-y-4 text-base leading-7 text-foreground/80">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets && (
              <ul className="list-disc space-y-2 pl-6">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.steps && (
              <ol className="list-decimal space-y-2 pl-6">
                {section.steps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            )}
            {section.table && (
              <div className="overflow-x-auto border-2 border-border">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                  <thead className="bg-main text-main-foreground">
                    <tr>
                      {section.table.headers.map((header) => (
                        <th
                          key={header}
                          className="border-b-2 border-border px-4 py-3 font-heading font-bold"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row) => (
                      <tr key={row.join("|")} className="border-b border-border/50 last:border-0">
                        {row.map((cell, index) => (
                          <td key={`${index}-${cell}`} className="px-4 py-3 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ))}

      <section aria-labelledby="article-faq">
        <h2 id="article-faq" className="font-heading text-2xl font-extrabold">
          {isEn ? "Frequently asked questions" : "Pertanyaan yang sering diajukan"}
        </h2>
        <div className="mt-5 divide-y-2 divide-border border-y-2 border-border">
          {content.faq.map((item) => (
            <div key={item.question} className="py-5">
              <h3 className="font-heading text-lg font-bold">{item.question}</h3>
              <p className="mt-2 leading-7 text-foreground/80">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="article-references">
        <h2 id="article-references" className="font-heading text-2xl font-extrabold">
          {isEn ? "Sources and further reading" : "Sumber dan bacaan lanjutan"}
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-foreground/70">
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-foreground underline decoration-2 underline-offset-4"
              >
                {source.title}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>{" "}
              <span>
                - {source.publisher}, {isEn ? "accessed" : "diakses"} {source.accessedAt}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
