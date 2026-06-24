import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format angka ke Rupiah, mis. 75000 -> "Rp75.000" */
export function formatIDR(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact && value >= 1_000_000) {
    return `Rp${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}jt`
  }
  if (opts?.compact && value >= 1_000) {
    return `Rp${(value / 1_000).toFixed(0)}rb`
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format harga; tampilkan "Gratis"/"Free" untuk nilai 0. */
export function formatPrice(value: number, isEn = false) {
  if (value === 0) return isEn ? "Free" : "Gratis"
  return formatIDR(value)
}

/** Format tanggal ISO -> "23 Jun 2026" sesuai locale */
export function formatDate(iso: string, locale = "id-ID") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

export function formatNumber(value: number, locale = "id-ID") {
  return new Intl.NumberFormat(locale).format(value)
}

/** Diskon persen dari harga coret -> harga jual */
export function discountPercent(original: number, price: number) {
  if (!original || original <= price) return 0
  return Math.round(((original - price) / original) * 100)
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
}
