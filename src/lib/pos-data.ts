// ─────────────────────────────────────────────────────────────────────────────
// HomeTown POS — Mock data layer for catalogue, inventory, customers, orders
// (Frontend prototype. Wire to backend API for persistence.)
// ─────────────────────────────────────────────────────────────────────────────

export type ProductStatus = "active" | "inactive" | "discontinued";

export type ProductCategoryGroup =
  | "Furniture"
  | "Home Decor"
  | "Kitchen & Appliances"
  | "Home Furnishing"
  | "Interiors"
  | "Clearance Sale";

// Rich hierarchy mirroring the live HomeTown navigation (group → subgroup → leaves)
export const CATEGORY_HIERARCHY: Record<ProductCategoryGroup, Record<string, string[]>> = {
  Furniture: {
    "Living Room Furniture": ["Sofas", "Loungers", "Recliners", "Center Tables", "End Tables", "TV Units", "Storage Cabinets"],
    "Bar Furniture": ["Bar Cabinets", "Serving Trolleys"],
    "Dining & Kitchen Furniture": ["Dining Sets", "Dining Tables", "Dining Chairs", "Dining Benches", "Storage Sideboards"],
    "Study & Office Furniture": ["Study Tables"],
    "Utility": ["Shoe Racks"],
    "Bedroom Furniture": ["Beds", "Wardrobes", "Bedside Tables", "Chest Of Drawers", "Dressing Tables"],
    "Mattresses": ["Single Bed Mattress", "Mattresses"],
    "Kids Furniture": ["Kids Beds", "Kids Study Tables"],
  },
  "Home Decor": {
    "Vases & Planters": ["Planters", "Fountains", "Vases"],
    "Room & Wall Decor": ["Clocks", "Decor", "Hangings", "Painting & Frames"],
    "Candles & Home Fragrances": ["Candles & Tealights", "Oil & Diffusers", "Candle Holders"],
    "Lighting": ["Lighting"],
  },
  "Kitchen & Appliances": {
    "Cookware": ["Microwave Safe", "Cookware Set"],
    "Drinkware": ["Bottles & Sippers", "Drinking Glasses", "Tea & Coffee Mugs", "Teapots & Jars"],
    "Kitchen Gadgets": ["Electrical Appliances", "Kitchen Tools"],
    "Serveware": ["Bowl & Tray Sets", "Dinner Sets"],
    "Storage & Organizers": ["Casseroles", "Food Storage", "Lunch Box", "Pantry Storage"],
    "Tableware": ["Tableware"],
  },
  "Home Furnishing": {
    "Bedding": ["Bedsheets", "Comforters", "Pillows", "Pillow Covers"],
    "Bath Accessories": ["Bath Rug", "Towels"],
    "Soft Furnishing": ["Curtains", "Cushions", "Rugs"],
  },
  "Interiors": {
    "Full Home Solutions": ["Modular Kitchen", "Wardrobes", "Full Home Interiors"],
  },
  "Clearance Sale": {
    "Clearance": ["Clearance"],
  },
};

// Flat view: group → all leaf categories (used by the catalogue editor dropdowns)
export const CATEGORY_TREE: Record<ProductCategoryGroup, string[]> = Object.fromEntries(
  (Object.entries(CATEGORY_HIERARCHY) as [ProductCategoryGroup, Record<string, string[]>][]).map(
    ([g, sub]) => [g, Array.from(new Set(Object.values(sub).flat()))]
  )
) as Record<ProductCategoryGroup, string[]>;

export const PRODUCT_GROUPS = Object.keys(CATEGORY_HIERARCHY) as ProductCategoryGroup[];

export type Offer = { label: string; discountPct: number };

export type Product = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  group: ProductCategoryGroup;
  category: string;             // subcategory
  brand: string;
  collection?: string;
  material?: string;
  color?: string;
  size?: string;
  dimensions?: string;          // L x W x H cm
  mrp: number;
  price: number;                // selling price (post-list-discount)
  gstPct: number;               // 5, 12, 18, 28
  hsn: string;
  warrantyMonths: number;
  returnDays: number;
  installation: boolean;
  delivery: boolean;
  image?: string;
  status: ProductStatus;
  offer?: Offer;
  stock: number;                // convenience total at default store
};

// ─────────────────────────────────────────────────────────────────────────────
// Catalogue
// ─────────────────────────────────────────────────────────────────────────────

export const products: Product[] = [
  {
    id: "p1", sku: "HT-SF-001", barcode: "8901234500011",
    name: "Westwood 3-Seater Sofa",
    group: "Furniture", category: "Sofas", brand: "HomeTown Living", collection: "Urban Calm",
    material: "Fabric · Solid wood", color: "Charcoal Grey", size: "3-Seater",
    dimensions: "210 x 92 x 88", mrp: 49999, price: 42999, gstPct: 18, hsn: "9401",
    warrantyMonths: 24, returnDays: 7, installation: true, delivery: true,
    status: "active", stock: 6,
    offer: { label: "Monsoon Sale", discountPct: 10 },
  },
  {
    id: "p2", sku: "HT-SF-014", barcode: "8901234500028",
    name: "Lyra Fabric Recliner",
    group: "Furniture", category: "Sofas", brand: "HomeTown Living",
    material: "Fabric", color: "Beige", size: "1-Seater",
    dimensions: "92 x 96 x 102", mrp: 32999, price: 28499, gstPct: 18, hsn: "9401",
    warrantyMonths: 12, returnDays: 7, installation: true, delivery: true, status: "active", stock: 3,
  },
  {
    id: "p3", sku: "HT-BD-021", barcode: "8901234500035",
    name: "Oakland Queen Bed",
    group: "Furniture", category: "Beds", brand: "Casa Nova",
    material: "Sheesham wood", color: "Walnut", size: "Queen",
    dimensions: "210 x 165 x 110", mrp: 42999, price: 35999, gstPct: 18, hsn: "9403",
    warrantyMonths: 36, returnDays: 7, installation: true, delivery: true, status: "active", stock: 4,
  },
  {
    id: "p4", sku: "HT-BD-033", barcode: "8901234500042",
    name: "Aspen King Storage Bed",
    group: "Furniture", category: "Beds", brand: "Casa Nova", collection: "Aspen",
    material: "Engineered wood", color: "Honey Oak", size: "King",
    dimensions: "216 x 196 x 110", mrp: 56999, price: 48999, gstPct: 18, hsn: "9403",
    warrantyMonths: 36, returnDays: 7, installation: true, delivery: true,
    status: "active", stock: 2, offer: { label: "Festive Saver", discountPct: 7 },
  },
  {
    id: "p5", sku: "HT-DN-007", barcode: "8901234500059",
    name: "Mensa 6-Seater Dining Set",
    group: "Furniture", category: "Dining", brand: "HomeTown Living",
    material: "Solid acacia", color: "Natural", size: "6-Seater",
    dimensions: "180 x 90 x 76", mrp: 64999, price: 56999, gstPct: 18, hsn: "9403",
    warrantyMonths: 24, returnDays: 7, installation: true, delivery: true, status: "active", stock: 1,
  },
  {
    id: "p6", sku: "HT-DN-019", barcode: "8901234500066",
    name: "Bistro Round Coffee Table",
    group: "Furniture", category: "Living Room", brand: "Studio H",
    material: "MDF + steel", color: "Black", size: "60 cm dia",
    dimensions: "60 x 60 x 45", mrp: 9999, price: 8499, gstPct: 18, hsn: "9403",
    warrantyMonths: 12, returnDays: 14, installation: false, delivery: true, status: "active", stock: 12,
  },
  {
    id: "p7", sku: "HT-LT-002", barcode: "8901234500073",
    name: "Nordic Arc Floor Lamp",
    group: "Home Decor", category: "Lighting", brand: "Lumière",
    material: "Steel + marble", color: "Brass", size: "175 cm tall",
    dimensions: "60 x 30 x 175", mrp: 7999, price: 6499, gstPct: 18, hsn: "9405",
    warrantyMonths: 12, returnDays: 14, installation: false, delivery: true, status: "active", stock: 9,
  },
  {
    id: "p8", sku: "HT-LT-011", barcode: "8901234500080",
    name: "Lumen Pendant Light",
    group: "Home Decor", category: "Lighting", brand: "Lumière",
    material: "Glass", color: "Smoke", size: "25 cm dia",
    dimensions: "25 x 25 x 30", mrp: 3999, price: 3299, gstPct: 18, hsn: "9405",
    warrantyMonths: 12, returnDays: 14, installation: true, delivery: true, status: "active", stock: 18,
  },
  {
    id: "p9", sku: "HT-DC-045", barcode: "8901234500097",
    name: "Terracotta Vase Set of 3",
    group: "Home Decor", category: "Vases", brand: "Earthen",
    material: "Terracotta", color: "Rust", size: "Set of 3",
    dimensions: "—", mrp: 2399, price: 1899, gstPct: 12, hsn: "6913",
    warrantyMonths: 0, returnDays: 14, installation: false, delivery: true, status: "active", stock: 24,
  },
  {
    id: "p10", sku: "HT-DC-052", barcode: "8901234500103",
    name: "Hand-Woven Jute Rug 6x4",
    group: "Home Furnishing", category: "Rugs", brand: "Weaverly",
    material: "Jute", color: "Natural", size: "6 x 4 ft",
    dimensions: "183 x 122", mrp: 5999, price: 4999, gstPct: 12, hsn: "5702",
    warrantyMonths: 0, returnDays: 14, installation: false, delivery: true, status: "active", stock: 7,
  },
  {
    id: "p11", sku: "HT-ST-008", barcode: "8901234500110",
    name: "Pinewood Bookshelf",
    group: "Furniture", category: "Storage Cabinets", brand: "Studio H",
    material: "Pinewood", color: "Natural", size: "5-shelf",
    dimensions: "80 x 30 x 180", mrp: 14999, price: 12999, gstPct: 18, hsn: "9403",
    warrantyMonths: 12, returnDays: 14, installation: true, delivery: true, status: "active", stock: 5,
  },
  {
    id: "p12", sku: "HT-ST-022", barcode: "8901234500127",
    name: "Cedar 4-Door Wardrobe",
    group: "Furniture", category: "Wardrobes", brand: "Casa Nova",
    material: "Cedar wood", color: "Wenge", size: "4-Door",
    dimensions: "180 x 60 x 210", mrp: 46999, price: 39999, gstPct: 18, hsn: "9403",
    warrantyMonths: 36, returnDays: 7, installation: true, delivery: true, status: "active", stock: 2,
  },
  {
    id: "p13", sku: "HT-MT-004", barcode: "8901234500134",
    name: "CloudRest Memory Foam Mattress Queen",
    group: "Furniture", category: "Mattresses", brand: "CloudRest",
    material: "Memory foam", color: "White", size: "Queen · 6 inch",
    dimensions: "78 x 60 x 6 in", mrp: 28999, price: 22999, gstPct: 18, hsn: "9404",
    warrantyMonths: 120, returnDays: 30, installation: false, delivery: true, status: "active", stock: 8,
  },
  {
    id: "p14", sku: "HT-CR-018", barcode: "8901234500141",
    name: "Linen Blackout Curtains (Pair)",
    group: "Home Furnishing", category: "Curtains", brand: "Weaverly",
    material: "Linen blend", color: "Sage", size: "7 ft",
    dimensions: "—", mrp: 3499, price: 2499, gstPct: 12, hsn: "6303",
    warrantyMonths: 0, returnDays: 14, installation: false, delivery: true, status: "active", stock: 22,
  },
  {
    id: "p15", sku: "HT-KD-006", barcode: "8901234500158",
    name: "Bunkhouse Kids Bunk Bed",
    group: "Furniture", category: "Kids Beds", brand: "JuniorWood",
    material: "Sheesham", color: "Walnut", size: "Single + Single",
    dimensions: "200 x 100 x 160", mrp: 39999, price: 34999, gstPct: 18, hsn: "9403",
    warrantyMonths: 24, returnDays: 7, installation: true, delivery: true, status: "active", stock: 3,
  },
];

export const productByBarcode = (code: string) =>
  products.find((p) => p.barcode === code.trim());

export const productBySku = (sku: string) =>
  products.find((p) => p.sku.toLowerCase() === sku.trim().toLowerCase());

// Legacy flat categories used by the simple POS picker (back-compat)
export const categories = ["All", "Sofas", "Beds", "Dining", "Lighting", "Decor", "Storage"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Inventory buckets — generated deterministically per product
// ─────────────────────────────────────────────────────────────────────────────

export type StockBuckets = {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  damaged: number;
  display: number;
  returned: number;
  transit: number;
  warehouse: number;
  onlineReserved: number;
};

const hash = (s: string) => Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function bucketsFor(p: Product): StockBuckets {
  const h = hash(p.sku);
  const display = 1;
  const onlineReserved = Math.max(0, (h % 3) - 1);
  const reserved = (h % 4);
  const damaged = (h % 5) === 0 ? 1 : 0;
  const returned = (h % 7) === 0 ? 1 : 0;
  const transit = h % 3;
  const warehouse = 5 + (h % 8);
  const sold = 2 + (h % 6);
  const available = Math.max(0, p.stock - display - reserved - onlineReserved - damaged);
  const total = available + reserved + display + onlineReserved + damaged + returned;
  return { total, available, reserved, sold, damaged, display, returned, transit, warehouse, onlineReserved };
}

export const BUCKET_LABELS: { key: keyof StockBuckets; label: string; tone: string }[] = [
  { key: "available",      label: "Available",       tone: "bg-success/15 text-success" },
  { key: "reserved",       label: "Reserved",        tone: "bg-warning/20 text-warning-foreground" },
  { key: "display",        label: "Display",         tone: "bg-primary/15 text-primary" },
  { key: "onlineReserved", label: "Online reserved", tone: "bg-secondary/15 text-secondary" },
  { key: "transit",        label: "In transit",      tone: "bg-muted text-muted-foreground" },
  { key: "warehouse",      label: "Warehouse",       tone: "bg-muted text-muted-foreground" },
  { key: "damaged",        label: "Damaged",         tone: "bg-destructive/15 text-destructive" },
  { key: "returned",       label: "Returned",        tone: "bg-accent text-accent-foreground" },
  { key: "sold",           label: "Sold (MTD)",      tone: "bg-muted text-muted-foreground" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Customers — phone-first, with addresses & history
// ─────────────────────────────────────────────────────────────────────────────

export type CustomerType = "Retail" | "Business" | "Interior Designer" | "Corporate";

export type Address = { label: string; line: string; city: string; pin: string };

export type PurchaseRow = { id: string; items: number; amount: number; date: string; store: string };
export type PendingRow  = { id: string; amount: number; status: "Awaiting payment" | "Awaiting delivery" | "Awaiting installation" };
export type ReturnRow   = { id: string; reason: string; amount: number; date: string };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: CustomerType;
  gstin?: string;
  billingAddress?: Address;
  deliveryAddresses: Address[];
  preferredCategory?: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  purchases: PurchaseRow[];
  pendingOrders: PendingRow[];
  returns: ReturnRow[];
};

export const customers: Customer[] = [
  {
    id: "c1", name: "Aarav Mehta", phone: "+91 98200 11223", email: "aarav@mail.com",
    type: "Retail",
    billingAddress: { label: "Home", line: "B-302, Lodha Belmondo", city: "Pune", pin: "411045" },
    deliveryAddresses: [
      { label: "Home", line: "B-302, Lodha Belmondo", city: "Pune", pin: "411045" },
      { label: "Office", line: "8th flr, World Trade Center", city: "Pune", pin: "411014" },
    ],
    preferredCategory: "Lighting",
    totalSpent: 184500, visits: 7, lastVisit: "2026-06-12",
    purchases: [
      { id: "HT-25610", items: 2, amount: 48498, date: "2026-06-12", store: "Indiranagar" },
      { id: "HT-25104", items: 1, amount: 42999, date: "2026-04-02", store: "Indiranagar" },
      { id: "HT-24887", items: 4, amount: 93003, date: "2026-02-21", store: "Saket" },
    ],
    pendingOrders: [{ id: "HT-25610", amount: 12000, status: "Awaiting delivery" }],
    returns: [{ id: "HT-24201", reason: "Damaged in transit", amount: 3299, date: "2025-12-08" }],
  },
  {
    id: "c2", name: "Priya Nair", phone: "+91 90876 54321", email: "priya.n@mail.com",
    type: "Interior Designer", gstin: "29ABCDE1234F1Z5",
    deliveryAddresses: [{ label: "Studio", line: "3rd Cross, Koramangala 4 Blk", city: "Bengaluru", pin: "560034" }],
    preferredCategory: "Furnishings",
    totalSpent: 92800, visits: 4, lastVisit: "2026-06-09",
    purchases: [
      { id: "HT-25609", items: 1, amount: 6499, date: "2026-06-09", store: "Indiranagar" },
      { id: "HT-25411", items: 6, amount: 86301, date: "2026-05-14", store: "LBS Marg" },
    ],
    pendingOrders: [],
    returns: [],
  },
  {
    id: "c3", name: "Rohit Verma", phone: "+91 99887 76655",
    type: "Retail",
    deliveryAddresses: [{ label: "Home", line: "Sector 47", city: "Gurugram", pin: "122018" }],
    totalSpent: 56200, visits: 2, lastVisit: "2026-05-28",
    purchases: [{ id: "HT-25608", items: 4, amount: 18796, date: "2026-05-28", store: "Saket" }],
    pendingOrders: [{ id: "HT-25608", amount: 5000, status: "Awaiting payment" }],
    returns: [],
  },
  {
    id: "c4", name: "Sneha Iyer", phone: "+91 91234 56789", email: "sneha@mail.com",
    type: "Retail",
    deliveryAddresses: [{ label: "Home", line: "Whitefield Main Rd", city: "Bengaluru", pin: "560066" }],
    preferredCategory: "Sofas",
    totalSpent: 311400, visits: 11, lastVisit: "2026-06-14",
    purchases: [
      { id: "HT-25612", items: 3, amount: 64498, date: "2026-06-14", store: "Indiranagar" },
      { id: "HT-25320", items: 1, amount: 56999, date: "2026-05-02", store: "Indiranagar" },
    ],
    pendingOrders: [{ id: "HT-25612", amount: 0, status: "Awaiting installation" }],
    returns: [],
  },
  {
    id: "c5", name: "Saraswati Furnishings Pvt Ltd", phone: "+91 80012 33445", email: "ops@saraswati.in",
    type: "Corporate", gstin: "27AABCS1234M1Z2",
    billingAddress: { label: "HO", line: "Andheri E", city: "Mumbai", pin: "400069" },
    deliveryAddresses: [{ label: "Warehouse", line: "Bhiwandi MIDC", city: "Thane", pin: "421302" }],
    preferredCategory: "Modular Kitchen",
    totalSpent: 1284000, visits: 14, lastVisit: "2026-06-10",
    purchases: [
      { id: "HT-B-1188", items: 18, amount: 624000, date: "2026-06-10", store: "LBS Marg" },
      { id: "HT-B-1024", items: 12, amount: 410000, date: "2026-03-22", store: "LBS Marg" },
    ],
    pendingOrders: [{ id: "HT-B-1188", amount: 180000, status: "Awaiting payment" }],
    returns: [],
  },
];

export const findCustomerByPhone = (phone: string) => {
  const norm = phone.replace(/\D/g, "");
  if (!norm) return undefined;
  return customers.find((c) => c.phone.replace(/\D/g, "").endsWith(norm));
};

// ─────────────────────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────────────────────

export type Order = {
  id: string;
  customer: string;
  items: number;
  total: number;
  channel: "Store" | "Online";
  status: "Paid" | "Pending" | "Refunded" | "Dispatched";
  date: string;
};

export const recentOrders: Order[] = [
  { id: "HT-25612", customer: "Sneha Iyer", items: 3, total: 64498, channel: "Store", status: "Paid", date: "Today 14:22" },
  { id: "HT-25611", customer: "Walk-in", items: 1, total: 8499, channel: "Store", status: "Paid", date: "Today 13:48" },
  { id: "HT-25610", customer: "Aarav Mehta", items: 2, total: 48498, channel: "Online", status: "Dispatched", date: "Today 12:10" },
  { id: "HT-25609", customer: "Priya Nair", items: 1, total: 6499, channel: "Store", status: "Paid", date: "Today 11:36" },
  { id: "HT-25608", customer: "Rohit Verma", items: 4, total: 18796, channel: "Online", status: "Pending", date: "Today 10:54" },
  { id: "HT-25607", customer: "Walk-in", items: 1, total: 3299, channel: "Store", status: "Refunded", date: "Today 09:41" },
];

export const stores = [
  { id: "s1", name: "Bengaluru — Indiranagar", sales: 482300, orders: 36 },
  { id: "s2", name: "Mumbai — Powai", sales: 612900, orders: 41 },
  { id: "s3", name: "Delhi — Saket", sales: 398700, orders: 28 },
  { id: "s4", name: "Hyderabad — Banjara Hills", sales: 271500, orders: 19 },
  { id: "s5", name: "Pune — Koregaon Park", sales: 188200, orders: 14 },
];

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
