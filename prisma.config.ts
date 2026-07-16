import { loadEnvConfig } from "@next/env"
import { defineConfig } from "prisma/config"

loadEnvConfig(process.cwd())

const fallbackDatabaseUrl =
  "postgresql://geraiakun:geraiakun@localhost:5432/geraiakun?schema=public"

function withVerifyFull(url: string | undefined) {
  if (!url) return url
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") return url
    parsed.searchParams.set("sslmode", "verify-full")
    return parsed.toString()
  } catch {
    return url
  }
}

const datasourceUrl =
  withVerifyFull(process.env.DIRECT_URL) ??
  withVerifyFull(process.env.DIRECT_DATABASE_URL) ??
  withVerifyFull(process.env.DATABASE_URL) ??
  fallbackDatabaseUrl

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
})
