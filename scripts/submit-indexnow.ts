import { loadEnvConfig } from "@next/env"
import { buildIndexNowPayload } from "../src/lib/seo/discovery"
import { SITE_URL } from "../src/lib/seo/site"

loadEnvConfig(process.cwd())

async function main() {
  const key = process.env.INDEXNOW_KEY
  if (!key) {
    console.log("INDEXNOW_KEY is not configured; no URLs were submitted.")
    return
  }

  const { listPublishedArticles } = await import("../src/lib/server/articles")
  const [idArticles, enArticles] = await Promise.all([
    listPublishedArticles("id"),
    listPublishedArticles("en"),
  ])
  const urls = [
    ...idArticles.map((article) => `${SITE_URL}/id/artikel/${article.slug}`),
    ...enArticles.map((article) => `${SITE_URL}/en/artikel/${article.slug}`),
  ]
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildIndexNowPayload({ key, urls })),
  })
  if (!response.ok) {
    throw new Error(`IndexNow submission failed with HTTP ${response.status}`)
  }
  console.log(JSON.stringify({ submitted: urls.length, status: response.status }))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
