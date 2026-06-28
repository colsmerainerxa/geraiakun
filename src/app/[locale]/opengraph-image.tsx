import { ImageResponse } from "next/og"

export const alt = "beliakun — Akun Premium AI & Digital, Harga Mahasiswa"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Neobrutalist branded social card. Auto-injected as og:image + twitter:image
// for every page under [locale] (overridable per-route).
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "#fef1e0",
        padding: "72px",
        border: "18px solid #0a0a0a",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          backgroundColor: "#4dd6e0",
          border: "4px solid #0a0a0a",
          borderRadius: "12px",
          padding: "10px 22px",
          fontSize: 28,
          fontWeight: 700,
          color: "#0a0a0a",
          boxShadow: "6px 6px 0 #0a0a0a",
        }}
      >
        Marketplace Akun &amp; Langganan Digital
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "36px",
          fontSize: 132,
          fontWeight: 800,
          color: "#0a0a0a",
        }}
      >
        <span>beli</span>
        <span style={{ color: "#ff5c8a" }}>akun</span>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "8px",
          fontSize: 44,
          fontWeight: 600,
          color: "#0a0a0a",
        }}
      >
        Akun Premium AI &amp; Digital, Harga Anak Kos
      </div>

      <div style={{ display: "flex", gap: "16px", marginTop: "44px" }}>
        {[
          { t: "ChatGPT", c: "#a3e635" },
          { t: "Canva", c: "#ff5c8a" },
          { t: "Netflix", c: "#4dd6e0" },
          { t: "Spotify", c: "#ffd23f" },
        ].map((chip) => (
          <div
            key={chip.t}
            style={{
              display: "flex",
              backgroundColor: chip.c,
              border: "4px solid #0a0a0a",
              borderRadius: "10px",
              padding: "8px 20px",
              fontSize: 28,
              fontWeight: 700,
              color: "#0a0a0a",
            }}
          >
            {chip.t}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  )
}
