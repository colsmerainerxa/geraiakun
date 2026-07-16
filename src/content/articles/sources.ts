import type { ArticleSource } from "./types"

const accessedAt = "2026-07-15"

function source(title: string, publisher: string, url: string): ArticleSource {
  return { title, publisher, url, accessedAt }
}

export const sources = {
  chatgptPricing: source("ChatGPT pricing", "OpenAI", "https://openai.com/chatgpt/pricing/"),
  chatgptPlus: source(
    "What is ChatGPT Plus?",
    "OpenAI Help Center",
    "https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus",
  ),
  openAiAuth: source(
    "API authentication",
    "OpenAI",
    "https://platform.openai.com/docs/api-reference/authentication",
  ),
  openAiPricing: source("API pricing", "OpenAI", "https://openai.com/api/pricing/"),
  openAiQuickstart: source(
    "Developer quickstart",
    "OpenAI",
    "https://platform.openai.com/docs/quickstart",
  ),
  googleAiPlans: source(
    "Google AI plans",
    "Google One",
    "https://one.google.com/about/google-ai-plans/",
  ),
  geminiLimits: source(
    "Gemini Apps limits and upgrades for Google AI subscribers",
    "Google",
    "https://support.google.com/gemini/answer/16275805",
  ),
  geminiKeys: source(
    "Using Gemini API keys",
    "Google AI for Developers",
    "https://ai.google.dev/gemini-api/docs/api-key",
  ),
  geminiTokens: source(
    "Understand and count tokens",
    "Google AI for Developers",
    "https://ai.google.dev/gemini-api/docs/tokens",
  ),
  geminiPricing: source(
    "Gemini Developer API pricing",
    "Google AI for Developers",
    "https://ai.google.dev/gemini-api/docs/pricing",
  ),
  whatsappCloud: source(
    "WhatsApp Cloud API overview",
    "Meta for Developers",
    "https://developers.facebook.com/docs/whatsapp/cloud-api/overview",
  ),
  whatsappWebhooks: source(
    "WhatsApp Cloud API webhooks",
    "Meta for Developers",
    "https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks",
  ),
  qris: source(
    "Quick Response Code Indonesian Standard (QRIS)",
    "Bank Indonesia",
    "https://www.bi.go.id/id/fungsi-utama/sistem-pembayaran/ritel/kanal-layanan/qris/default.aspx",
  ),
  consumerProtection: source(
    "Panduan Dasar Pelindungan Konsumen",
    "Bank Indonesia",
    "https://www.bi.go.id/id/Pelindungan-Konsumen/Panduan-Dasar/Default.aspx",
  ),
  unescoEducation: source(
    "Guidance for generative AI in education and research",
    "UNESCO",
    "https://unesdoc.unesco.org/ark:/48223/pf0000386693",
  ),
} as const
