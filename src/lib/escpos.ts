// ESC/POS byte builder for 58mm (32 cols) / 80mm (48 cols) thermal printers.
// Pure — safe to import in browser, Electron main, and Capacitor bridge.

import type { Order } from "./pos-data";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export type PrinterSettings = {
  width: 58 | 80;
  shopName: string;
  headerLine1?: string;
  headerLine2?: string;
  footer?: string;
  // desktop / network
  connection: "browser" | "usb" | "network" | "bluetooth";
  host?: string; // network printers
  port?: number;
  vendorId?: string; // USB (hex)
  productId?: string;
  bluetoothName?: string;
};

export const DEFAULT_PRINTER: PrinterSettings = {
  width: 80,
  shopName: "Emerald POS",
  headerLine1: "",
  headerLine2: "",
  footer: "Thank you for dining with us!",
  connection: "browser",
  port: 9100,
};

export function colsFor(width: 58 | 80) {
  return width === 58 ? 32 : 48;
}

function pad(left: string, right: string, cols: number) {
  const l = left.slice(0, cols - right.length - 1);
  const spaces = Math.max(1, cols - l.length - right.length);
  return l + " ".repeat(spaces) + right;
}

function wrap(text: string, cols: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > cols) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur ? cur + " " : "") + w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Build a plain-text receipt (used for HTML preview + fallback). */
export function receiptText(order: Order, s: PrinterSettings): string {
  const cols = colsFor(s.width);
  const line = "-".repeat(cols);
  const dbl = "=".repeat(cols);
  const center = (t: string) =>
    " ".repeat(Math.max(0, Math.floor((cols - t.length) / 2))) + t;

  const out: string[] = [];
  out.push(center(s.shopName.toUpperCase()));
  if (s.headerLine1) out.push(center(s.headerLine1));
  if (s.headerLine2) out.push(center(s.headerLine2));
  out.push(dbl);
  out.push(pad(`#${order.id}`, order.type.toUpperCase(), cols));
  out.push(pad(new Date(order.createdAt).toLocaleString(), "", cols));
  if (order.customer) out.push(`Customer: ${order.customer}`);
  if (order.table) out.push(`Table: ${order.table}`);
  out.push(line);
  for (const c of order.items) {
    out.push(pad(`${c.qty}x ${c.item.name}`, (c.item.price * c.qty).toFixed(0), cols));
  }
  out.push(line);
  out.push(pad("Subtotal", order.subtotal.toFixed(0), cols));
  out.push(pad(`Tax (${(order.taxRate * 100).toFixed(0)}%)`, order.tax.toFixed(0), cols));
  if (order.discount > 0) out.push(pad("Discount", `-${order.discount.toFixed(0)}`, cols));
  out.push(dbl);
  out.push(pad("TOTAL PKR", order.total.toFixed(0), cols));
  out.push(dbl);
  if (order.paymentMethod) out.push(`Paid via: ${order.paymentMethod.toUpperCase()}`);
  if (order.notes) {
    out.push(line);
    for (const l of wrap(`Note: ${order.notes}`, cols)) out.push(l);
  }
  out.push("");
  if (s.footer) for (const l of wrap(s.footer, cols)) out.push(center(l));
  out.push("");
  return out.join("\n");
}

/** Build raw ESC/POS bytes for direct feed to a thermal printer. */
export function receiptBytes(order: Order, s: PrinterSettings): Uint8Array {
  const chunks: number[] = [];
  const push = (...b: number[]) => chunks.push(...b);
  const text = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      chunks.push(c < 128 ? c : 0x3f); // ASCII fallback
    }
  };
  const nl = () => push(LF);

  // Init
  push(ESC, 0x40);
  // Codepage CP437
  push(ESC, 0x74, 0);

  const cols = colsFor(s.width);

  // Header - centered, double height
  push(ESC, 0x61, 1); // center
  push(GS, 0x21, 0x11); // 2x width/height
  text(s.shopName.toUpperCase());
  nl();
  push(GS, 0x21, 0x00); // normal
  if (s.headerLine1) {
    text(s.headerLine1);
    nl();
  }
  if (s.headerLine2) {
    text(s.headerLine2);
    nl();
  }
  push(ESC, 0x61, 0); // left

  text("=".repeat(cols));
  nl();
  text(pad(`#${order.id}`, order.type.toUpperCase(), cols));
  nl();
  text(new Date(order.createdAt).toLocaleString());
  nl();
  if (order.customer) {
    text(`Customer: ${order.customer}`);
    nl();
  }
  if (order.table) {
    text(`Table: ${order.table}`);
    nl();
  }
  text("-".repeat(cols));
  nl();
  for (const c of order.items) {
    text(pad(`${c.qty}x ${c.item.name}`, (c.item.price * c.qty).toFixed(0), cols));
    nl();
  }
  text("-".repeat(cols));
  nl();
  text(pad("Subtotal", order.subtotal.toFixed(0), cols));
  nl();
  text(pad(`Tax (${(order.taxRate * 100).toFixed(0)}%)`, order.tax.toFixed(0), cols));
  nl();
  if (order.discount > 0) {
    text(pad("Discount", `-${order.discount.toFixed(0)}`, cols));
    nl();
  }

  // Total - emphasized
  push(ESC, 0x45, 1);
  push(GS, 0x21, 0x01); // double height
  text(pad("TOTAL PKR", order.total.toFixed(0), cols));
  nl();
  push(GS, 0x21, 0x00);
  push(ESC, 0x45, 0);

  text("=".repeat(cols));
  nl();
  if (order.paymentMethod) {
    text(`Paid via: ${order.paymentMethod.toUpperCase()}`);
    nl();
  }
  if (order.notes) {
    for (const l of wrap(`Note: ${order.notes}`, cols)) {
      text(l);
      nl();
    }
  }
  nl();
  push(ESC, 0x61, 1);
  if (s.footer) {
    for (const l of wrap(s.footer, cols)) {
      text(l);
      nl();
    }
  }
  push(ESC, 0x61, 0);

  // Feed and cut
  nl();
  nl();
  nl();
  push(GS, 0x56, 0x42, 0x00); // partial cut

  return new Uint8Array(chunks);
}
