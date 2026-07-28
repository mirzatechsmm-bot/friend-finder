// Electron main process — Emerald POS desktop wrapper.
// Loads the built Vite app and exposes an IPC channel to send ESC/POS bytes
// to a USB / Network thermal printer via node-thermal-printer.

const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#052e2b",
    title: "Emerald POS",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const indexHtml = path.join(__dirname, "..", "dist", "index.html");
  mainWindow.loadFile(indexHtml);
  Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* ---------------- Printing IPC ---------------- */

ipcMain.handle("print-receipt", async (_evt, payload) => {
  try {
    const { bytes, settings } = payload;
    const buffer = Buffer.from(bytes);

    if (settings.connection === "network") {
      const net = require("net");
      const host = settings.host;
      const port = Number(settings.port || 9100);
      if (!host) throw new Error("Network printer host not set");
      await new Promise((resolve, reject) => {
        const sock = new net.Socket();
        sock.setTimeout(5000);
        sock.on("timeout", () => { sock.destroy(); reject(new Error("Timeout")); });
        sock.on("error", reject);
        sock.connect(port, host, () => {
          sock.write(buffer, () => sock.end(() => resolve(null)));
        });
      });
      return { ok: true };
    }

    if (settings.connection === "usb") {
      // Requires optional peer dep: `npm i node-thermal-printer usb`
      const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
      const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `printer:${settings.vendorId || ""}:${settings.productId || ""}`,
      });
      printer.raw(buffer);
      await printer.execute();
      return { ok: true };
    }

    // Fallback: open OS print dialog for the focused window
    if (mainWindow) mainWindow.webContents.print({ silent: false });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
});
