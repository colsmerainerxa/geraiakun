import type { Category } from "@/types"

export const categories: Category[] = [
  {
    id: "cat-ai",
    slug: "ai-chatbot",
    name: "AI & Chatbot",
    nameEn: "AI & Chatbot",
    description: "ChatGPT Plus & Gemini Pro — asisten AI premium",
    descriptionEn: "ChatGPT Plus & Gemini Pro — premium AI assistants",
    icon: "Bot",
    color: "accent-cyan",
    productCount: 0,
  },
  {
    id: "cat-api",
    slug: "api-developer",
    name: "API & Developer",
    nameEn: "API & Developer",
    description: "API Key & kredit token untuk developer",
    descriptionEn: "API keys & token credits for developers",
    icon: "Code",
    color: "accent-lime",
    productCount: 0,
  },
]

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug)
}
