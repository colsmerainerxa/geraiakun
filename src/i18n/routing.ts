import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  // Default locale (id) lives at "/", English at "/en" — best for Indonesian market + clean hreflang.
  localePrefix: "as-needed",
})

export type Locale = (typeof routing.locales)[number]
