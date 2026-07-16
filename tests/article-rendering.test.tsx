import assert from "node:assert/strict"
import test from "node:test"
import { ServerInsertedHTMLContext } from "next/navigation"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { SectionHeading } from "../src/components/shared/section-heading"
import { ArticleBody } from "../src/components/storefront/article-body"
import { localizedArticlePath } from "../src/lib/seo/articles"
import { JsonLd } from "../src/lib/seo/json-ld"

test("renders the article listing title as the only page-level heading", () => {
  const html = renderToStaticMarkup(
    <SectionHeading eyebrow="Blog" title="Articles & Guides" titleAs="h1" />,
  )

  assert.match(html, /<h1[^>]*>Articles &amp; Guides<\/h1>/)
  assert.doesNotMatch(html, /<h2/)
})

test("maps an article detail URL to its translated slug", () => {
  assert.equal(
    localizedArticlePath("/artikel/panduan-api-key-untuk-pemula", "api-key-guide-for-beginners"),
    "/artikel/api-key-guide-for-beginners",
  )
  assert.equal(localizedArticlePath("/artikel", "ignored"), "/artikel")
})

test("renders crawlable JSON-LD during server rendering", () => {
  const callbacks: Array<() => ReactNode> = []
  renderToStaticMarkup(
    <ServerInsertedHTMLContext.Provider value={(callback) => callbacks.push(callback)}>
      <JsonLd id="article-schema" data={{ "@context": "https://schema.org" }} />
    </ServerInsertedHTMLContext.Provider>,
  )
  const html = callbacks.map((callback) => renderToStaticMarkup(callback())).join("")

  assert.match(html, /type="application\/ld\+json"/)
  assert.match(html, /{"@context":"https:\/\/schema.org"}/)
})

test("renders the complete article structure as semantic HTML", () => {
  const html = renderToStaticMarkup(
    <ArticleBody
      isEn
      content={{
        intro: "A direct introduction that gives readers the answer before the supporting detail.",
        keyTakeaways: ["First useful takeaway", "Second useful takeaway", "Third useful takeaway"],
        sections: [
          {
            id: "first-section",
            heading: "First detailed section",
            paragraphs: [
              "A detailed paragraph that explains the first idea for readers and crawlers.",
            ],
            bullets: ["A concrete bullet point", "Another concrete bullet point"],
          },
          {
            id: "second-section",
            heading: "Second detailed section",
            paragraphs: ["A second paragraph that gives the article a clear progression."],
            steps: ["Complete the first step", "Complete the second step"],
          },
          {
            id: "third-section",
            heading: "Third detailed section",
            paragraphs: ["A third paragraph introduces a comparison table for the reader."],
            table: { headers: ["Option", "Result"], rows: [["A", "Useful result"]] },
          },
          {
            id: "fourth-section",
            heading: "Fourth detailed section",
            paragraphs: ["A final section closes the structured article body."],
          },
        ],
        faq: [
          {
            question: "What is the first question?",
            answer: "The first complete answer is visible.",
          },
          {
            question: "What is the second question?",
            answer: "The second complete answer is visible.",
          },
        ],
      }}
      sources={[
        {
          title: "Official reference",
          publisher: "Example Publisher",
          url: "https://example.com/reference",
          accessedAt: "2026-07-15",
        },
      ]}
    />,
  )

  assert.match(html, /<aside/)
  assert.match(html, /<h2[^>]*>First detailed section<\/h2>/)
  assert.match(html, /<ol/)
  assert.match(html, /<table/)
  assert.match(html, /<h3[^>]*>What is the first question\?<\/h3>/)
  assert.match(html, /Official reference/)
  assert.match(html, /rel="noopener noreferrer"/)
})
