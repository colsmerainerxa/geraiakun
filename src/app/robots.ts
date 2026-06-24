import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/transactional areas — keep out of the index.
      disallow: ["/admin", "/checkout", "/keranjang", "/akun", "/masuk", "/daftar"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
