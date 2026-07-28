// Bluetooth LE thermal printer (Capacitor / Android).
// Uses @capacitor-community/bluetooth-le. This module is imported dynamically
// only when running inside Capacitor, so it never breaks the web/SSR build.

import type { PrinterSettings } from "./escpos";

// Most common ESC/POS BLE printer service / write characteristic
// (works with the majority of MTP-II / GOOJPRT / RPP compatible printers).
const PRINTER_SERVICE = "000018f0-0000-1000-8000-00805f9b34fb";
const PRINTER_WRITE = "00002af1-0000-1000-8000-00805f9b34fb";
const CHUNK_SIZE = 180;

export async function printViaBluetooth(
  bytes: Uint8Array,
  settings: PrinterSettings,
): Promise<{ ok: boolean; error?: string }> {
  try {
    // @ts-ignore optional dependency at build time
    const { BleClient } = await import("@capacitor-community/bluetooth-le");
    await BleClient.initialize({ androidNeverForLocation: true });

    let deviceId = localStorage.getItem("emerald-pos-ble-device") || "";
    if (!deviceId) {
      const device = await BleClient.requestDevice({
        services: [PRINTER_SERVICE],
        namePrefix: settings.bluetoothName || undefined,
      });
      deviceId = device.deviceId;
      localStorage.setItem("emerald-pos-ble-device", deviceId);
    }

    await BleClient.connect(deviceId);
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      const dv = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      await BleClient.writeWithoutResponse(deviceId, PRINTER_SERVICE, PRINTER_WRITE, dv);
    }
    await BleClient.disconnect(deviceId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function forgetBluetoothPrinter() {
  localStorage.removeItem("emerald-pos-ble-device");
}
