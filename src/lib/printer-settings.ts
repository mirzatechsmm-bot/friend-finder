import { DEFAULT_PRINTER, type PrinterSettings } from "./escpos";

const KEY = "emerald-pos-printer-v1";

export function loadPrinterSettings(): PrinterSettings {
  if (typeof window === "undefined") return DEFAULT_PRINTER;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PRINTER, ...JSON.parse(raw) } : DEFAULT_PRINTER;
  } catch {
    return DEFAULT_PRINTER;
  }
}

export function savePrinterSettings(s: PrinterSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}
