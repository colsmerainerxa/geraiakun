import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "beliakun — Akun Premium AI & Digital",
    short_name: "beliakun",
    description:
      "Marketplace akun & langganan digital premium yang praktis, transparan, dan bergaransi.",
    start_url: "/",
    display: "standalone",
    background_color: "#fef1e0",
    theme_color: "#fef1e0",
    lang: "id",
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
