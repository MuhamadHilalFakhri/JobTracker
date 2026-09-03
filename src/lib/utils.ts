import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export function formatCurrency(value: number | null | undefined, currency = "IDR", period?: string | null): string {
  if (value == null) return "-"
  try {
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency", currency, maximumFractionDigits: 0,
    }).format(value)
    return period ? `${formatted}/${period.toLowerCase()}` : formatted
  } catch {
    return `${value} ${currency}`
  }
}

export function formatDate(d: Date | string | null | undefined, locale = "id-ID"): string {
  if (!d) return "-"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
}

export function formatDateTime(d: Date | string | null | undefined, locale = "id-ID"): string {
  if (!d) return "-"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function isOverdue(due: Date | string | null | undefined): boolean {
  if (!due) return false
  return new Date(due).getTime() < Date.now()
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "-"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
