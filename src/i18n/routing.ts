import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  // Prefix both locales to avoid default-locale redirect loops on current Next/next-intl.
  localePrefix: "always",
})

export type Locale = (typeof routing.locales)[number]
