import "dotenv/config"
import { defineConfig } from "prisma/config"

const fallbackDatabaseUrl =
  "postgresql://geraiakun:geraiakun@localhost:5432/geraiakun?schema=public"

const datasourceUrl =
  process.env.DIRECT_URL ??
  process.env.DIRECT_DATABASE_URL ??
  process.env.DATABASE_URL ??
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
