import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_PRINTER, type PrinterSettings } from "@/lib/escpos";
import { loadPrinterSettings, savePrinterSettings } from "@/lib/printer-settings";
import { forgetBluetoothPrinter } from "@/lib/printer-bluetooth";

export function PrinterSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<PrinterSettings>(DEFAULT_PRINTER);

  useEffect(() => {
    if (open) setS(loadPrinterSettings());
  }, [open]);

  const set = <K extends keyof PrinterSettings>(k: K, v: PrinterSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Settings className="h-4 w-4" /> Printer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thermal Printer Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="grid gap-1">
            <Label>Shop name</Label>
            <Input value={s.shopName} onChange={(e) => set("shopName", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label>Header line 1</Label>
              <Input value={s.headerLine1 ?? ""} onChange={(e) => set("headerLine1", e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Header line 2</Label>
              <Input value={s.headerLine2 ?? ""} onChange={(e) => set("headerLine2", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Footer</Label>
            <Input value={s.footer ?? ""} onChange={(e) => set("footer", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label>Paper width</Label>
              <Select value={String(s.width)} onValueChange={(v) => set("width", Number(v) as 58 | 80)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58 mm</SelectItem>
                  <SelectItem value="80">80 mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Connection</Label>
              <Select value={s.connection} onValueChange={(v) => set("connection", v as PrinterSettings["connection"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">Browser print</SelectItem>
                  <SelectItem value="usb">USB (Electron)</SelectItem>
                  <SelectItem value="network">Network (LAN)</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth (Android)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {s.connection === "network" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Host / IP</Label>
                <Input value={s.host ?? ""} onChange={(e) => set("host", e.target.value)} placeholder="192.168.1.50" />
              </div>
              <div className="grid gap-1">
                <Label>Port</Label>
                <Input type="number" value={s.port ?? 9100} onChange={(e) => set("port", Number(e.target.value))} />
              </div>
            </div>
          )}
          {s.connection === "usb" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>USB Vendor ID (hex)</Label>
                <Input value={s.vendorId ?? ""} onChange={(e) => set("vendorId", e.target.value)} placeholder="0x0416" />
              </div>
              <div className="grid gap-1">
                <Label>USB Product ID (hex)</Label>
                <Input value={s.productId ?? ""} onChange={(e) => set("productId", e.target.value)} placeholder="0x5011" />
              </div>
            </div>
          )}
          {s.connection === "bluetooth" && (
            <div className="grid gap-1">
              <Label>Bluetooth name prefix</Label>
              <Input value={s.bluetoothName ?? ""} onChange={(e) => set("bluetoothName", e.target.value)} placeholder="e.g. MTP-2 or Printer001" />
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => { forgetBluetoothPrinter(); toast.success("Forgot paired printer"); }}>
                Forget paired printer
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => { savePrinterSettings(s); toast.success("Printer settings saved"); setOpen(false); }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
