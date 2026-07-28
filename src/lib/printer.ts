// Platform-aware printer dispatcher.
// - Electron (desktop): sends bytes via window.electronAPI.printReceipt (IPC → node-thermal-printer)
// - Capacitor (Android): sends bytes over Bluetooth LE to a paired printer
// - Browser: falls back to window.print() using an offscreen <pre> monospace layout

import { receiptBytes, receiptText, type PrinterSettings } from "./escpos";
import type { Order } from "./pos-data";
import { loadPrinterSettings } from "./printer-settings";

declare global {
  interface Window {
    electronAPI?: {
      printReceipt: (
        bytes: Uint8Array,
        settings: PrinterSettings,
      ) => Promise<{ ok: boolean; error?: string }>;
      isElectron: boolean;
    };
    Capacitor?: { isNativePlatform: () => boolean; getPlatform: () => string };
  }
}

export type PrintResult = { ok: boolean; via: string; error?: string };

export async function printOrder(order: Order): Promise<PrintResult> {
  const settings = loadPrinterSettings();

  // 1) Electron desktop path
  if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
    try {
      const bytes = receiptBytes(order, settings);
      const r = await window.electronAPI.printReceipt(bytes, settings);
      return { ok: r.ok, via: `electron/${settings.connection}`, error: r.error };
    } catch (e) {
      return { ok: false, via: "electron", error: (e as Error).message };
    }
  }

  // 2) Capacitor Android — Bluetooth LE
  if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform()) {
    try {
      const bytes = receiptBytes(order, settings);
      const mod = await import("./printer-bluetooth");
      const r = await mod.printViaBluetooth(bytes, settings);
      return { ok: r.ok, via: "bluetooth", error: r.error };
    } catch (e) {
      return { ok: false, via: "bluetooth", error: (e as Error).message };
    }
  }

  // 3) Browser fallback — window.print of monospaced text
  const html = receiptText(order, settings);
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return { ok: false, via: "browser", error: "Popup blocked" };
  win.document.write(`<!doctype html><html><head><title>Receipt ${order.id}</title>
    <style>
      @page { margin: 4mm; }
      body { font-family: 'Courier New', monospace; font-size: 12px; white-space: pre; }
    </style></head><body>${escapeHtml(html)}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 200);
  return { ok: true, via: "browser" };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
