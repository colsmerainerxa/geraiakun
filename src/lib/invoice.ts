import { formatDate, formatIDR, initials, paymentLabel } from "@/lib/utils"
import type { Order } from "@/types"

// Helper label status (id) — keep this file backend-agnostic / dependency-light.
const STATUS_LABEL: Record<string, string> = {
  "menunggu-pembayaran": "Menunggu Pembayaran",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  refund: "Refund",
}

/**
 * Generate a standalone, print-ready HTML invoice the user can download & open.
 * It mirrors the neobrutalism design tokens inline (no Tailwind/CSS deps), and
 * auto-triggers the browser print dialog on load — so "Save as PDF" is one
 * click. This keeps the app dependency-free while still delivering a real file.
 */
export function buildInvoiceHTML(order: Order, locale: "id" | "en" = "id"): string {
  const isEn = locale === "en"
  const date = formatDate(order.createdAt, isEn ? "en-US" : "id-ID")
  const paidDate = order.paidAt
    ? formatDate(order.paidAt, isEn ? "en-US" : "id-ID")
    : "—"
  const statusLabel =
    STATUS_LABEL[order.status] ?? order.status

  const itemsRows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:2px solid #0a0a0a;">
          <div style="font-weight:700;">${escapeHtml(it.productName)}</div>
          <div style="font-size:12px;opacity:.6;">${escapeHtml(it.variantLabel)}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:2px solid #0a0a0a;text-align:center;">${it.qty}</td>
        <td style="padding:10px 12px;border-bottom:2px solid #0a0a0a;text-align:right;font-weight:700;">${formatIDR(it.price)}</td>
        <td style="padding:10px 12px;border-bottom:2px solid #0a0a0a;text-align:right;font-weight:700;">${formatIDR(it.price * it.qty)}</td>
      </tr>`,
    )
    .join("")

  const summaryRow = (label: string, value: string, bold = false) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:${bold ? 800 : 400};">
      <span style="opacity:.7;">${label}</span>
      <span>${value}</span>
    </div>`

  const customerName = order.customerName || "—"
  const avatar = initials(customerName)

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${isEn ? "Invoice" : "Invoice"} ${escapeHtml(order.invoice)} · beliakun</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #fef1e0; color: #0a0a0a; margin: 0; padding: 32px 16px;
  }
  .sheet {
    max-width: 720px; margin: 0 auto; background: #fff;
    border: 3px solid #0a0a0a; border-radius: 10px;
    box-shadow: 8px 8px 0 0 #0a0a0a; overflow: hidden;
  }
  .head { display:flex; align-items:center; justify-content:space-between;
    background:#ffd23f; border-bottom:3px solid #0a0a0a; padding:20px 28px; }
  .brand { display:flex; align-items:center; gap:10px; }
  .logo { width:40px;height:40px;border:2px solid #0a0a0a;border-radius:8px;
    background:#0a0a0a;color:#ffd23f;display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:18px; }
  .brandname { font-weight:800; font-size:22px; letter-spacing:-.02em; }
  .pill { background:#0a0a0a; color:#fff; padding:6px 14px; border-radius:999px;
    font-weight:700; font-size:12px; text-transform:uppercase; }
  .body { padding: 28px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin: 4px 0 24px; }
  .box { border:2px solid #0a0a0a; border-radius:8px; padding:14px 16px; }
  .box h3 { margin:0 0 8px; font-size:11px; text-transform:uppercase; letter-spacing:.06em; opacity:.55; }
  .box p { margin:2px 0; font-size:14px; }
  .avatar { display:inline-flex;width:34px;height:34px;border:2px solid #0a0a0a;border-radius:999px;
    background:#a3e635;align-items:center;justify-content:center;font-weight:800;margin-right:8px; }
  h1.inv { font-size:30px; font-weight:800; letter-spacing:-.03em; margin:0; }
  table { width:100%; border-collapse:collapse; margin:8px 0 20px; font-size:14px; }
  thead th { background:#0a0a0a; color:#fff; padding:10px 12px; text-align:left; font-size:11px;
    text-transform:uppercase; letter-spacing:.05em; }
  .sum { border:2px solid #0a0a0a; border-radius:8px; padding:8px 16px; margin-left:auto; max-width:300px; }
  .sum.total { border-top:4px solid #0a0a0a; padding-top:10px; margin-top:6px;
    font-size:20px; font-weight:800; }
  .foot { margin-top:28px; padding-top:18px; border-top:2px dashed #0a0a0a;
    font-size:11px; opacity:.6; line-height:1.6; text-align:center; }
  .sec-title { font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:.05em;
    margin:4px 0 10px; }
  @media print {
    body { background:#fff; padding:0; }
    .sheet { box-shadow:none; border-width:2px; max-width:100%; border-radius:0; }
    .noprint { display:none !important; }
  }
  .printbtn { display:block; margin:0 auto 18px; background:#ffd23f; color:#0a0a0a;
    border:2px solid #0a0a0a; border-radius:8px; padding:12px 22px; font-weight:800;
    cursor:pointer; box-shadow:4px 4px 0 0 #0a0a0a; font-size:14px; }
  .printbtn:hover { transform:translate(-1px,-1px); box-shadow:6px 6px 0 0 #0a0a0a; }
</style>
</head>
<body onload="window.print()">
  <button class="printbtn noprint" onclick="window.print()">
    🖨️ ${isEn ? "Print / Save as PDF" : "Cetak / Simpan PDF"}
  </button>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        <div class="logo">✦</div>
        <span class="brandname">beli<span style="color:#ff5c8a;">akun</span></span>
      </div>
      <span class="pill">${isEn ? "Invoice" : "Invoice"}</span>
    </div>

    <div class="body">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:12px;opacity:.5;text-transform:uppercase;letter-spacing:.06em;">${isEn ? "Invoice no." : "No. Invoice"}</div>
          <h1 class="inv">${escapeHtml(order.invoice)}</h1>
        </div>
        <span class="pill" style="background:#2fbf71;">${statusLabel}</span>
      </div>

      <div class="grid2">
        <div class="box">
          <h3>${isEn ? "Billed To" : "Ditagihkan Kepada"}</h3>
          <p><span class="avatar">${avatar}</span><strong>${escapeHtml(customerName)}</strong></p>
          <p style="opacity:.7;">${escapeHtml(order.customerEmail)}</p>
          <p style="opacity:.7;">${isEn ? "WA" : "WA"}: ${escapeHtml(order.whatsapp)}</p>
        </div>
        <div class="box">
          <h3>${isEn ? "Details" : "Detail"}</h3>
          <p>${isEn ? "Order date" : "Tanggal"}: <strong>${date}</strong></p>
          <p>${isEn ? "Paid" : "Dibayar"}: <strong>${paidDate}</strong></p>
          <p>${isEn ? "Payment" : "Pembayaran"}: <strong>${paymentLabel(order.paymentMethod)}</strong></p>
        </div>
      </div>

      <div class="sec-title">${isEn ? "Items" : "Item Pesanan"}</div>
      <table>
        <thead>
          <tr>
            <th>${isEn ? "Product" : "Produk"}</th>
            <th style="text-align:center;">${isEn ? "Qty" : "Jml"}</th>
            <th style="text-align:right;">${isEn ? "Price" : "Harga"}</th>
            <th style="text-align:right;">${isEn ? "Subtotal" : "Subtotal"}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="sum">
        ${summaryRow(isEn ? "Subtotal" : "Subtotal", formatIDR(order.subtotal))}
        ${order.discount > 0 ? summaryRow(isEn ? "Discount" : "Diskon", `- ${formatIDR(order.discount)}`) : ""}
        ${summaryRow(isEn ? "Admin fee" : "Biaya admin", formatIDR(order.fee))}
        <div class="sum total">
          <span>${isEn ? "Total" : "Total"}</span>
          <span style="float:right;">${formatIDR(order.total)}</span>
        </div>
      </div>

      <div class="foot">
        ${isEn ? "Thank you for your purchase!" : "Terima kasih atas pembelianmu!"} 🙌<br/>
        ${isEn
          ? "This invoice was issued electronically by beliakun. Keep it as proof of purchase for warranty claims."
          : "Invoice ini diterbitkan secara elektronik oleh beliakun. Simpan sebagai bukti pembelian untuk klaim garansi."}
        <br/>© 2026 beliakun · beliakun.com
      </div>
    </div>
  </div>
  <script>
    // Close the pop-up window automatically after printing is done/cancelled.
    window.onafterprint = function(){ /* allow user to keep window open */ };
  </script>
</body>
</html>`
}

/** Escape user-provided strings so they cannot break the HTML invoice. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Open the invoice in a new window for print/save-as-PDF, and also trigger a
 * direct download of the .html file. Works fully client-side, no backend.
 */
export function downloadInvoice(order: Order, locale: "id" | "en" = "id") {
  const html = buildInvoiceHTML(order, locale)

  // 1) Direct file download (.html — opens in any browser, prints to PDF).
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${order.invoice}-beliakun.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
