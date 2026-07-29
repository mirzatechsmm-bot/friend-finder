import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, Lock, LogOut, Plus, Trash2, Save, ArrowLeft, TrendingUp, Package, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES, MENU, formatPKR, loadOrders, type MenuItem } from "@/lib/pos-data";
import { PrinterSettingsDialog } from "@/components/PrinterSettingsDialog";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Super Admin — Emerald POS" },
      { name: "description", content: "Emerald POS super admin panel — menu, staff, sales & printer settings." },
    ],
  }),
});

const AUTH_KEY = "emerald-pos-admin-auth-v1";
const PASS_KEY = "emerald-pos-admin-pass-v1";
const MENU_KEY = "emerald-pos-menu-v1";
const STAFF_KEY = "emerald-pos-staff-v1";
const SHOP_KEY = "emerald-pos-shop-v1";
const DEFAULT_PASS = "admin123";

type Staff = { id: string; name: string; role: "cashier" | "waiter" | "manager"; pin: string };
type ShopConfig = { name: string; tax: number; currency: string; address: string; phone: string };

function loadMenu(): MenuItem[] {
  if (typeof window === "undefined") return MENU;
  try {
    const raw = localStorage.getItem(MENU_KEY);
    return raw ? JSON.parse(raw) : MENU;
  } catch {
    return MENU;
  }
}
function saveMenu(m: MenuItem[]) { localStorage.setItem(MENU_KEY, JSON.stringify(m)); }

function loadStaff(): Staff[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STAFF_KEY) || "[]"); } catch { return []; }
}
function saveStaff(s: Staff[]) { localStorage.setItem(STAFF_KEY, JSON.stringify(s)); }

function loadShop(): ShopConfig {
  const d = { name: "Emerald POS", tax: 5, currency: "PKR", address: "", phone: "" };
  if (typeof window === "undefined") return d;
  try { return { ...d, ...JSON.parse(localStorage.getItem(SHOP_KEY) || "{}") }; } catch { return d; }
}
function saveShop(s: ShopConfig) { localStorage.setItem(SHOP_KEY, JSON.stringify(s)); }

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
  }, []);

  const handleLogin = () => {
    const stored = localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
    if (pass === stored) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      toast.success("Welcome, Super Admin");
    } else {
      toast.error("Wrong password");
    }
  };
  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPass("");
  };

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md p-8 space-y-6 border-primary/20 shadow-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Super Admin</h1>
            <p className="text-sm text-muted-foreground text-center">Restricted access — enter admin password to continue.</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="pass">Password</Label>
            <Input
              id="pass"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              autoFocus
            />
            <Button className="w-full" onClick={handleLogin}>
              <Lock className="h-4 w-4 mr-2" /> Unlock Panel
            </Button>
            <p className="text-xs text-muted-foreground text-center">Default password: <code className="font-mono">admin123</code> — change it inside the panel.</p>
          </div>
          <Link to="/" className="block text-center text-sm text-primary hover:underline">← Back to POS</Link>
        </Card>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> POS</Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-bold text-lg">Super Admin Panel</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrinterSettingsDialog />
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
          <TabsContent value="menu" className="mt-6"><MenuTab /></TabsContent>
          <TabsContent value="staff" className="mt-6"><StaffTab /></TabsContent>
          <TabsContent value="shop" className="mt-6"><ShopTab /></TabsContent>
          <TabsContent value="security" className="mt-6"><SecurityTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DashboardTab() {
  const orders = loadOrders();
  const today = new Date().setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => o.createdAt >= today);
  const paidToday = todayOrders.filter((o) => o.status === "paid");
  const salesToday = paidToday.reduce((s, o) => s + o.total, 0);
  const salesAll = orders.filter(o => o.status === "paid").reduce((s, o) => s + o.total, 0);
  const avgOrder = paidToday.length ? salesToday / paidToday.length : 0;

  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const c of o.items) {
        const cur = map.get(c.item.id) || { name: c.item.name, qty: 0, revenue: 0 };
        cur.qty += c.qty;
        cur.revenue += c.qty * c.item.price;
        map.set(c.item.id, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [orders]);

  const stats = [
    { icon: DollarSign, label: "Today's Sales", value: formatPKR(salesToday), tone: "text-emerald-600" },
    { icon: Package, label: "Orders Today", value: todayOrders.length, tone: "text-blue-600" },
    { icon: TrendingUp, label: "Avg Order", value: formatPKR(avgOrder), tone: "text-primary" },
    { icon: DollarSign, label: "Total Revenue", value: formatPKR(salesAll), tone: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.tone}`} />
            </div>
            <div className="text-2xl font-bold mt-2">{s.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Top Selling Items</h3>
        {topItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          <div className="space-y-2">
            {topItems.map((it, i) => (
              <div key={it.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 justify-center">{i + 1}</Badge>
                  <span className="font-medium">{it.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{it.qty} sold</span>
                  <span className="font-semibold">{formatPKR(it.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MenuTab() {
  const [items, setItems] = useState<MenuItem[]>(() => loadMenu());
  const [draft, setDraft] = useState<MenuItem>({
    id: "", name: "", price: 0, category: "Main Course", description: "", emoji: "🍽️", veg: false,
  });

  const persist = (next: MenuItem[]) => { setItems(next); saveMenu(next); };

  const add = () => {
    if (!draft.name.trim() || draft.price <= 0) return toast.error("Name & price required");
    persist([...items, { ...draft, id: `m${Date.now()}` }]);
    setDraft({ id: "", name: "", price: 0, category: "Main Course", description: "", emoji: "🍽️", veg: false });
    toast.success("Item added");
  };
  const remove = (id: string) => { persist(items.filter(i => i.id !== id)); toast.success("Removed"); };
  const update = (id: string, patch: Partial<MenuItem>) => persist(items.map(i => i.id === id ? { ...i, ...patch } : i));

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="p-5 md:col-span-1 h-fit sticky top-24">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Add New Item</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input className="w-16 text-center text-xl" value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} maxLength={2} />
            <Input placeholder="Item name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <Input type="number" placeholder="Price (PKR)" value={draft.price || ""} onChange={(e) => setDraft({ ...draft, price: +e.target.value })} />
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            {CATEGORIES.filter(c => c !== "All").map((c) => <option key={c}>{c}</option>)}
          </select>
          <Input placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.veg} onChange={(e) => setDraft({ ...draft, veg: e.target.checked })} /> Vegetarian
          </label>
          <Button className="w-full" onClick={add}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
        </div>
      </Card>

      <Card className="p-0 md:col-span-2 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Menu Items ({items.length})</h3>
          <Button variant="ghost" size="sm" onClick={() => { persist(MENU); toast.success("Reset to defaults"); }}>Reset</Button>
        </div>
        <ScrollArea className="h-[600px]">
          <div className="divide-y">
            {items.map((it) => (
              <div key={it.id} className="p-3 flex items-center gap-3">
                <span className="text-2xl">{it.emoji}</span>
                <div className="flex-1 min-w-0">
                  <Input className="h-8 font-medium" value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} />
                  <div className="text-xs text-muted-foreground mt-1">{it.category}{it.veg ? " • Veg" : ""}</div>
                </div>
                <Input className="w-24 h-8" type="number" value={it.price} onChange={(e) => update(it.id, { price: +e.target.value })} />
                <Button variant="ghost" size="icon" onClick={() => remove(it.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

function StaffTab() {
  const [staff, setStaff] = useState<Staff[]>(() => loadStaff());
  const [draft, setDraft] = useState<Staff>({ id: "", name: "", role: "cashier", pin: "" });

  const persist = (n: Staff[]) => { setStaff(n); saveStaff(n); };
  const add = () => {
    if (!draft.name.trim() || draft.pin.length < 4) return toast.error("Name & 4-digit PIN required");
    persist([...staff, { ...draft, id: `u${Date.now()}` }]);
    setDraft({ id: "", name: "", role: "cashier", pin: "" });
    toast.success("Staff added");
  };
  const remove = (id: string) => { persist(staff.filter(s => s.id !== id)); };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="p-5 md:col-span-1 h-fit">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-4 w-4" /> Add Staff</h3>
        <div className="space-y-3">
          <Input placeholder="Full name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Staff["role"] })}>
            <option value="cashier">Cashier</option>
            <option value="waiter">Waiter</option>
            <option value="manager">Manager</option>
          </select>
          <Input placeholder="4-digit PIN" maxLength={6} value={draft.pin} onChange={(e) => setDraft({ ...draft, pin: e.target.value.replace(/\D/g, "") })} />
          <Button className="w-full" onClick={add}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </div>
      </Card>

      <Card className="p-0 md:col-span-2">
        <div className="p-4 border-b"><h3 className="font-semibold">Team ({staff.length})</h3></div>
        {staff.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No staff yet. Add cashiers, waiters and managers here.</p>
        ) : (
          <div className="divide-y">
            {staff.map((s) => (
              <div key={s.id} className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center font-semibold text-primary">{s.name[0]?.toUpperCase()}</div>
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">PIN: •••{s.pin.slice(-1)}</div>
                </div>
                <Badge variant="outline" className="capitalize">{s.role}</Badge>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ShopTab() {
  const [shop, setShop] = useState<ShopConfig>(() => loadShop());
  const save = () => { saveShop(shop); toast.success("Shop settings saved"); };

  return (
    <Card className="p-6 max-w-2xl space-y-4">
      <h3 className="font-semibold text-lg">Shop Configuration</h3>
      <div className="grid gap-4">
        <div className="space-y-2"><Label>Shop Name</Label><Input value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Tax %</Label><Input type="number" value={shop.tax} onChange={(e) => setShop({ ...shop, tax: +e.target.value })} /></div>
          <div className="space-y-2"><Label>Currency</Label><Input value={shop.currency} onChange={(e) => setShop({ ...shop, currency: e.target.value })} /></div>
        </div>
        <div className="space-y-2"><Label>Address</Label><Input value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} /></div>
      </div>
      <Button onClick={save}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
    </Card>
  );
}

function SecurityTab() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const change = () => {
    const stored = localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
    if (cur !== stored) return toast.error("Current password wrong");
    if (next.length < 6) return toast.error("New password min 6 chars");
    if (next !== confirm) return toast.error("Passwords don't match");
    localStorage.setItem(PASS_KEY, next);
    setCur(""); setNext(""); setConfirm("");
    toast.success("Admin password updated");
  };

  return (
    <Card className="p-6 max-w-md space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2"><Lock className="h-4 w-4" /> Change Admin Password</h3>
      <div className="space-y-3">
        <div className="space-y-2"><Label>Current password</Label><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="space-y-2"><Label>New password</Label><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
        <div className="space-y-2"><Label>Confirm new password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <Button onClick={change} className="w-full"><Save className="h-4 w-4 mr-2" /> Update Password</Button>
      </div>
    </Card>
  );
}
