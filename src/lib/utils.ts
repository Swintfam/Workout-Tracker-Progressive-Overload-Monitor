import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the local-time date as YYYY-MM-DD.
 * Safe replacement for `new Date().toISOString().split("T")[0]` which
 * uses UTC and can return tomorrow's date for users in negative UTC offsets.
 */
export function localDateYMD(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
