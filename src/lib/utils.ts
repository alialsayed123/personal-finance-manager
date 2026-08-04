import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { AppLanguage, Currency } from "@/types/finance";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: Currency,
  language: AppLanguage = "en",
): string {
  return new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "SYP" ? 0 : 2,
    maximumFractionDigits: currency === "SYP" ? 0 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(
  value: string | Date,
  language: AppLanguage = "en",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;

  return new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-GB", options).format(date);
}

export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIME_ZONE || "Asia/Damascus";

export function getLocalIsoDate(
  date = new Date(),
  timeZone = APP_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getAppReferenceDate(date = new Date()): Date {
  const [year, month, day] = getLocalIsoDate(date).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function getMonthStart(value = getAppReferenceDate()): string {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${value.getFullYear()}-${month}-01`;
}

export function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function toNumber(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}

export function isValidYearMonth(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

export function safeFileName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
