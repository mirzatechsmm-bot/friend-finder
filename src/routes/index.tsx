import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ClipboardList,
  Leaf,
  X,
  CheckCircle2,
  Receipt,
  Clock,
  ChefHat,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  MENU,
  formatPKR,
  loadOrders,
  saveOrders,
  type CartItem,
  type MenuItem,
  type Order,
  type OrderStatus,
} from "@/lib/pos-data";

export const Route = createFileRoute("/")({
  component: POSPage,
});

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  preparing: { label: "Preparing", className: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  served: { label: "Served", className: "bg-primary/10 text-primary border-primary/30" },
  paid: { label: "Paid", className: "bg-emerald-600/15 text-emerald-700 border-emerald-600/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

function POSPage() {
  const [tab, setTab] = useState<"menu" | "orders">("menu");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipt, setReceipt] = useState<Order | null>(null);

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  const filtered = useMemo(() => {
    return MENU.filter((m) => {
      const inCat = category === "All" || m.category === category;
      const q = query.trim().toLowerCase();
      const inQuery = !q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [category, query]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
    const taxRate = 0.05;
    const tax = Math.round(subtotal * taxRate);
    return { subtotal, tax, taxRate, total: subtotal + tax };
  }, [cart]);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  function addItem(item: MenuItem) {
    setCart((prev) => {
      const found = prev.find((c) => c.item.id === item.id);
      if (found) return prev.map((c) => (c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { item, qty: 1 }];
    });
    toast.success(`${item.name} added`, { duration: 1200 });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((c) => c.item.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  function persistOrders(next: Order[]) {
    setOrders(next);
    saveOrders(next);
  }

  function submitOrder(form: CheckoutForm) {
    const order: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now(),
      table: form.table,
      customer: form.customer || "Walk-in",
      type: form.type,
      items: cart,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      tax: totals.tax,
      discount: form.discount,
      total: Math.max(0, totals.total - form.discount),
      paymentMethod: form.paymentMethod,
      status: "pending",
      notes: form.notes,
    };
    persistOrders([order, ...orders]);
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
    setReceipt(order);
    toast.success(`Order ${order.id} punched`);
  }

  function setOrderStatus(id: string, status: OrderStatus) {
    persistOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success(`Order ${id} → ${STATUS_META[status].label}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-emerald-gradient text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold text-gold-foreground">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">Emerald POS</h1>
              <p className="hidden text-xs text-primary-foreground/70 sm:block">
                Order punching · Kitchen ready
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={tab === "menu" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2 text-primary-foreground hover:text-primary-foreground",
                tab === "menu" && "text-secondary-foreground",
              )}
              onClick={() => setTab("menu")}
            >
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
            <Button
              variant={tab === "orders" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2 text-primary-foreground hover:text-primary-foreground",
                tab === "orders" && "text-secondary-foreground",
              )}
              onClick={() => setTab("orders")}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
              {orders.filter((o) => o.status !== "paid" && o.status !== "cancelled").length > 0 && (
                <Badge className="bg-gold text-gold-foreground">
                  {orders.filter((o) => o.status !== "paid" && o.status !== "cancelled").length}
                </Badge>
              )}
            </Button>

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  className="relative gap-2 bg-gold text-gold-foreground hover:bg-gold/90"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <CartSheet
                cart={cart}
                totals={totals}
                onChangeQty={changeQty}
                onRemove={removeItem}
                onClear={clearCart}
                onCheckout={() => setCheckoutOpen(true)}
              />
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === "menu" ? (
          <MenuView
            category={category}
            setCategory={setCategory}
            query={query}
            setQuery={setQuery}
            items={filtered}
            onAdd={addItem}
          />
        ) : (
          <OrdersView orders={orders} onSetStatus={setOrderStatus} onView={(o) => setReceipt(o)} />
        )}
      </main>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        totals={totals}
        onSubmit={submitOrder}
        disabled={cart.length === 0}
      />

      <ReceiptDialog order={receipt} onOpenChange={(open) => !open && setReceipt(null)} />
    </div>
  );
}

/* ---------------- Menu ---------------- */

function MenuView({
  category,
  setCategory,
  query,
  setQuery,
  items,
  onAdd,
}: {
  category: (typeof CATEGORIES)[number];
  setCategory: (c: (typeof CATEGORIES)[number]) => void;
  query: string;
  setQuery: (q: string) => void;
  items: MenuItem[];
  onAdd: (i: MenuItem) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search menu…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={c === category ? "default" : "outline"}
              className={cn(
                "shrink-0 rounded-full",
                c === category && "bg-primary text-primary-foreground",
              )}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No items match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <Card
              key={m.id}
              className="group relative overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex h-28 items-center justify-center bg-emerald-gradient text-5xl">
                <span>{m.emoji}</span>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{m.name}</h3>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  {m.veg && <Leaf className="h-4 w-4 shrink-0 text-emerald-600" />}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-primary">{formatPKR(m.price)}</span>
                  <Button
                    size="sm"
                    className="h-8 gap-1 bg-gold text-gold-foreground hover:bg-gold/90"
                    onClick={() => onAdd(m)}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Cart Sheet ---------------- */

function CartSheet({
  cart,
  totals,
  onChangeQty,
  onRemove,
  onClear,
  onCheckout,
}: {
  cart: CartItem[];
  totals: { subtotal: number; tax: number; taxRate: number; total: number };
  onChangeQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}) {
  return (
    <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
      <SheetHeader className="border-b p-4">
        <SheetTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Current Order
        </SheetTitle>
      </SheetHeader>

      {cart.length === 0 ? (
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted">
              <ShoppingCart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Cart is empty. Add items from the menu.
            </p>
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <ul className="divide-y">
              {cart.map((c) => (
                <li key={c.item.id} className="flex items-start gap-3 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-gradient text-2xl">
                    {c.item.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{c.item.name}</p>
                      <button
                        onClick={() => onRemove(c.item.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatPKR(c.item.price)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg border">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onChangeQty(c.item.id, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-6 text-center text-sm font-semibold">{c.qty}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onChangeQty(c.item.id, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <span className="text-sm font-bold">
                        {formatPKR(c.item.price * c.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>

          <div className="border-t bg-muted/30 p-4">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPKR(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax ({Math.round(totals.taxRate * 100)}%)</dt>
                <dd>{formatPKR(totals.tax)}</dd>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd className="text-primary">{formatPKR(totals.total)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClear}>
                <X className="mr-1 h-4 w-4" /> Clear
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={onCheckout}
              >
                Checkout
              </Button>
            </div>
          </div>
        </>
      )}
    </SheetContent>
  );
}

/* ---------------- Checkout ---------------- */

type CheckoutForm = {
  table: string;
  customer: string;
  type: "dine-in" | "takeaway" | "delivery";
  paymentMethod: "cash" | "card" | "online";
  discount: number;
  notes: string;
};

function CheckoutDialog({
  open,
  onOpenChange,
  totals,
  onSubmit,
  disabled,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  totals: { subtotal: number; tax: number; total: number };
  onSubmit: (f: CheckoutForm) => void;
  disabled: boolean;
}) {
  const [form, setForm] = useState<CheckoutForm>({
    table: "",
    customer: "",
    type: "dine-in",
    paymentMethod: "cash",
    discount: 0,
    notes: "",
  });

  const finalTotal = Math.max(0, totals.total - form.discount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Punch Order
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Order Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: CheckoutForm["type"]) => setForm({ ...form, type: v })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine-in">Dine-in</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="table">
                {form.type === "dine-in" ? "Table #" : "Reference"}
              </Label>
              <Input
                id="table"
                placeholder={form.type === "dine-in" ? "T-05" : "—"}
                value={form.table}
                onChange={(e) => setForm({ ...form, table: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer">Customer name</Label>
            <Input
              id="customer"
              placeholder="Walk-in"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pay">Payment</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v: CheckoutForm["paymentMethod"]) =>
                  setForm({ ...form, paymentMethod: v })
                }
              >
                <SelectTrigger id="pay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disc">Discount (PKR)</Label>
              <Input
                id="disc"
                type="number"
                min={0}
                value={form.discount}
                onChange={(e) =>
                  setForm({ ...form, discount: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Kitchen notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g. less spicy, no onions"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPKR(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPKR(totals.tax)}</span>
            </div>
            {form.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>-{formatPKR(form.discount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPKR(finalTotal)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={disabled}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onSubmit(form)}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" /> Confirm Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Orders ---------------- */

function OrdersView({
  orders,
  onSetStatus,
  onView,
}: {
  orders: Order[];
  onSetStatus: (id: string, s: OrderStatus) => void;
  onView: (o: Order) => void;
}) {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const stats = useMemo(() => {
    const today = new Date();
    const isToday = (t: number) => {
      const d = new Date(t);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };
    const todays = orders.filter((o) => isToday(o.createdAt));
    return {
      todayCount: todays.length,
      todaySales: todays.filter((o) => o.status === "paid").reduce((s, o) => s + o.total, 0),
      pending: orders.filter((o) => o.status === "pending" || o.status === "preparing").length,
    };
  }, [orders]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<ClipboardList className="h-4 w-4" />} label="Today's Orders" value={String(stats.todayCount)} />
        <StatCard icon={<Receipt className="h-4 w-4" />} label="Today's Sales" value={formatPKR(stats.todaySales)} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="In Progress" value={String(stats.pending)} />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="preparing">Preparing</TabsTrigger>
          <TabsTrigger value="served">Served</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4">
          {list.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center">
              <p className="text-muted-foreground">No orders here yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((o) => (
                <OrderCard key={o.id} order={o} onSetStatus={onSetStatus} onView={onView} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="text-xs sm:text-sm">{label}</span>
      </div>
      <p className="mt-2 truncate text-lg font-black text-foreground sm:text-2xl">{value}</p>
    </Card>
  );
}

function OrderCard({
  order,
  onSetStatus,
  onView,
}: {
  order: Order;
  onSetStatus: (id: string, s: OrderStatus) => void;
  onView: (o: Order) => void;
}) {
  const meta = STATUS_META[order.status];
  const next: Record<OrderStatus, OrderStatus | null> = {
    pending: "preparing",
    preparing: "served",
    served: "paid",
    paid: null,
    cancelled: null,
  };
  const nextStatus = next[order.status];

  return (
    <Card className="p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold">{order.id}</h3>
            <Badge variant="outline" className={cn("border", meta.className)}>
              {meta.label}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {order.customer} · {order.type}
            {order.table && ` · ${order.table}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-primary">{formatPKR(order.total)}</p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {order.items.slice(0, 3).map((c) => (
          <li key={c.item.id} className="flex justify-between">
            <span className="truncate text-muted-foreground">
              {c.qty}× {c.item.name}
            </span>
            <span>{formatPKR(c.item.price * c.qty)}</span>
          </li>
        ))}
        {order.items.length > 3 && (
          <li className="text-xs text-muted-foreground">+{order.items.length - 3} more…</li>
        )}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(order)}>
          <Printer className="mr-1 h-4 w-4" /> Receipt
        </Button>
        {nextStatus && (
          <Button
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onSetStatus(order.id, nextStatus)}
          >
            Mark {STATUS_META[nextStatus].label}
          </Button>
        )}
        {order.status !== "paid" && order.status !== "cancelled" && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onSetStatus(order.id, "cancelled")}
          >
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Receipt ---------------- */

function ReceiptDialog({
  order,
  onOpenChange,
}: {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Emerald POS</DialogTitle>
              <p className="text-center text-xs text-muted-foreground">
                Receipt · {order.id}
              </p>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{new Date(order.createdAt).toLocaleString()}</span>
                <span>{order.type}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{order.customer}</span>
                {order.table && <span>{order.table}</span>}
              </div>
              <Separator />
              <ul className="space-y-1">
                {order.items.map((c) => (
                  <li key={c.item.id} className="flex justify-between">
                    <span className="truncate">
                      {c.qty}× {c.item.name}
                    </span>
                    <span>{formatPKR(c.item.price * c.qty)}</span>
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPKR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPKR(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Discount</span>
                  <span>-{formatPKR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPKR(order.total)}</span>
              </div>
              {order.notes && (
                <p className="rounded bg-muted p-2 text-xs italic text-muted-foreground">
                  Note: {order.notes}
                </p>
              )}
              <p className="pt-2 text-center text-xs text-muted-foreground">
                Thank you for dining with us
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => window.print()}
              >
                <Printer className="mr-1 h-4 w-4" /> Print
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
