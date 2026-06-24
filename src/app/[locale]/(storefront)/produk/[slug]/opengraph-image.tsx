import { ImageResponse } from "next/og"
import { getProduct, productMinPrice } from "@/lib/mock/products"
import { formatPrice } from "@/lib/utils"

export const alt = "beliakun — produk premium"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const accentHex: Record<string, string> = {
  "accent-pink": "#ff5c8a",
  "accent-cyan": "#4dd6e0",
  "accent-lime": "#a3e635",
  "accent-purple": "#b78cff",
  "accent-blue": "#5b9dff",
  main: "#ffd23f",
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const product = getProduct(slug)
  const name = product?.name ?? "beliakun"
  const brand = product?.brand ?? ""
  const tagline = product?.tagline ?? "Akun Premium AI & Digital"
  const bg = accentHex[product?.accent ?? "main"] ?? "#ffd23f"
  const price = product ? formatPrice(productMinPrice(product)) : ""

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: bg,
        padding: "72px",
        border: "18px solid #0a0a0a",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 38, fontWeight: 800, color: "#0a0a0a" }}>
          beliakun
        </span>
        <span
          style={{
            display: "flex",
            backgroundColor: "#fef1e0",
            border: "4px solid #0a0a0a",
            borderRadius: "10px",
            padding: "8px 20px",
            fontSize: 28,
            fontWeight: 700,
            color: "#0a0a0a",
          }}
        >
          {brand}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: "#0a0a0a",
            lineHeight: 1.05,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontSize: 38,
            fontWeight: 600,
            color: "#0a0a0a",
            marginTop: "14px",
          }}
        >
          {tagline}
        </span>
      </div>

      <div style={{ display: "flex" }}>
        <span
          style={{
            display: "flex",
            backgroundColor: "#ffd23f",
            border: "5px solid #0a0a0a",
            borderRadius: "12px",
            padding: "12px 28px",
            fontSize: 38,
            fontWeight: 800,
            color: "#0a0a0a",
            boxShadow: "7px 7px 0 #0a0a0a",
          }}
        >
          Mulai {price}
        </span>
      </div>
    </div>,
    { ...size },
  )
}
