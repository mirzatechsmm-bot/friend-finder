export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  emoji: string;
  veg: boolean;
};

export const CATEGORIES = [
  "All",
  "Starters",
  "Main Course",
  "Biryani & Rice",
  "BBQ & Grill",
  "Breads",
  "Desserts",
  "Beverages",
] as const;

export const MENU: MenuItem[] = [
  { id: "m1", name: "Chicken Karahi", price: 1450, category: "Main Course", description: "Boneless chicken cooked in tomato & spices", emoji: "🍲", veg: false },
  { id: "m2", name: "Mutton Karahi", price: 2200, category: "Main Course", description: "Tender mutton, rich gravy", emoji: "🍛", veg: false },
  { id: "m3", name: "Chicken Biryani", price: 650, category: "Biryani & Rice", description: "Signature Sindhi biryani", emoji: "🍚", veg: false },
  { id: "m4", name: "Beef Biryani", price: 750, category: "Biryani & Rice", description: "Slow-cooked beef biryani", emoji: "🍛", veg: false },
  { id: "m5", name: "Veg Pulao", price: 450, category: "Biryani & Rice", description: "Fragrant basmati with vegetables", emoji: "🍚", veg: true },
  { id: "m6", name: "Seekh Kabab", price: 850, category: "BBQ & Grill", description: "Char-grilled beef seekh (6 pcs)", emoji: "🍢", veg: false },
  { id: "m7", name: "Chicken Tikka", price: 550, category: "BBQ & Grill", description: "Boneless tikka, mint chutney", emoji: "🍗", veg: false },
  { id: "m8", name: "Malai Boti", price: 950, category: "BBQ & Grill", description: "Creamy grilled chicken boti", emoji: "🥩", veg: false },
  { id: "m9", name: "Chicken Samosa", price: 80, category: "Starters", description: "Crispy fried, 1 pc", emoji: "🥟", veg: false },
  { id: "m10", name: "Veg Spring Rolls", price: 350, category: "Starters", description: "4 pcs with sweet chili sauce", emoji: "🥬", veg: true },
  { id: "m11", name: "Hot & Sour Soup", price: 380, category: "Starters", description: "Chicken hot & sour", emoji: "🍜", veg: false },
  { id: "m12", name: "Butter Naan", price: 80, category: "Breads", description: "Tandoor-fresh, buttered", emoji: "🫓", veg: true },
  { id: "m13", name: "Garlic Naan", price: 120, category: "Breads", description: "With roasted garlic", emoji: "🧄", veg: true },
  { id: "m14", name: "Roghni Roti", price: 60, category: "Breads", description: "Traditional soft roti", emoji: "🥖", veg: true },
  { id: "m15", name: "Gulab Jamun", price: 220, category: "Desserts", description: "3 pcs in sugar syrup", emoji: "🍮", veg: true },
  { id: "m16", name: "Kheer", price: 280, category: "Desserts", description: "Rice pudding, saffron & pistachio", emoji: "🥣", veg: true },
  { id: "m17", name: "Kulfi Falooda", price: 320, category: "Desserts", description: "House-made kulfi", emoji: "🍨", veg: true },
  { id: "m18", name: "Fresh Lime", price: 180, category: "Beverages", description: "Sweet, salty or plain", emoji: "🍋", veg: true },
  { id: "m19", name: "Mango Lassi", price: 260, category: "Beverages", description: "Chilled mango yogurt", emoji: "🥭", veg: true },
  { id: "m20", name: "Kashmiri Chai", price: 220, category: "Beverages", description: "Pink tea, pistachio topping", emoji: "🍵", veg: true },
  { id: "m21", name: "Soft Drink", price: 120, category: "Beverages", description: "Coke / Sprite / Fanta", emoji: "🥤", veg: true },
];

export type CartItem = { item: MenuItem; qty: number; note?: string };

export type OrderStatus = "pending" | "preparing" | "served" | "paid" | "cancelled";

export type Order = {
  id: string;
  createdAt: number;
  table: string;
  customer: string;
  type: "dine-in" | "takeaway" | "delivery";
  items: CartItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: "cash" | "card" | "online";
  status: OrderStatus;
  notes?: string;
};

const KEY = "emerald-pos-orders-v1";

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(orders));
}

export function formatPKR(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
}
