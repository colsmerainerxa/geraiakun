import { ImageResponse } from "next/og"
import type { ArticleLocale } from "@/content/articles/types"
import { getPublishedArticle } from "@/lib/server/articles"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale: ArticleLocale = rawLocale === "en" ? "en" : "id"
  const article = await getPublishedArticle(locale, slug)
  if (!article) return new ImageResponse(<div style={{ display: "flex" }}>geraiakun</div>, size)

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffd447",
        color: "#111111",
        border: "12px solid #111111",
        padding: "64px 72px",
      }}
    >
      <div style={{ display: "flex", fontSize: 26, fontWeight: 800, textTransform: "uppercase" }}>
        geraiakun · {article.category}
      </div>
      <div
        style={{ display: "flex", maxWidth: 1020, fontSize: 62, lineHeight: 1.08, fontWeight: 900 }}
      >
        {article.title}
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", fontSize: 23, fontWeight: 700 }}
      >
        <span>
          {locale === "en"
            ? "Practical guides for digital tools"
            : "Panduan praktis layanan digital"}
        </span>
        <span>geraiakun.id</span>
      </div>
    </div>,
    size,
  )
}
