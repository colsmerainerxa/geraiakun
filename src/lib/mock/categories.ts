import type { Category } from "@/types"

export const categories: Category[] = [
  {
    id: "cat-ai",
    slug: "ai-chatbot",
    name: "AI & Chatbot",
    nameEn: "AI & Chatbot",
    description: "ChatGPT, Gemini, Claude, Perplexity & asisten AI lainnya",
    descriptionEn: "ChatGPT, Gemini, Claude, Perplexity & other AI assistants",
    icon: "Bot",
    color: "accent-cyan",
    productCount: 0,
  },
  {
    id: "cat-design",
    slug: "desain-kreatif",
    name: "Desain & Kreatif",
    nameEn: "Design & Creative",
    description: "Canva, Capcut, Figma, Adobe & tools desain premium",
    descriptionEn: "Canva, Capcut, Figma, Adobe & premium design tools",
    icon: "Palette",
    color: "accent-pink",
    productCount: 0,
  },
  {
    id: "cat-streaming",
    slug: "streaming",
    name: "Streaming & Hiburan",
    nameEn: "Streaming & Entertainment",
    description: "Netflix, Spotify, YouTube Premium, Disney+ & lainnya",
    descriptionEn: "Netflix, Spotify, YouTube Premium, Disney+ & more",
    icon: "Play",
    color: "accent-purple",
    productCount: 0,
  },
  {
    id: "cat-productivity",
    slug: "produktivitas",
    name: "Produktivitas",
    nameEn: "Productivity",
    description: "Notion, Microsoft 365, Grammarly & tools kerja",
    descriptionEn: "Notion, Microsoft 365, Grammarly & work tools",
    icon: "Rocket",
    color: "accent-lime",
    productCount: 0,
  },
  {
    id: "cat-api",
    slug: "api-developer",
    name: "API & Developer",
    nameEn: "API & Developer",
    description: "OpenAI API, GitHub Copilot, kredit & key untuk developer",
    descriptionEn: "OpenAI API, GitHub Copilot, credits & keys for developers",
    icon: "Code",
    color: "accent-blue",
    productCount: 0,
  },
  {
    id: "cat-edu",
    slug: "edukasi",
    name: "Edukasi",
    nameEn: "Education",
    description: "Coursera, Duolingo Super, Skillshare & belajar online",
    descriptionEn: "Coursera, Duolingo Super, Skillshare & online learning",
    icon: "GraduationCap",
    color: "main",
    productCount: 0,
  },
]

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug)
}
