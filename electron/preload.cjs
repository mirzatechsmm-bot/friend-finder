const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  printReceipt: (bytes, settings) =>
    ipcRenderer.invoke("print-receipt", {
      bytes: Array.from(bytes),
      settings,
    }),
});
