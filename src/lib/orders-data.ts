// ─────────────────────────────────────────────────────────────────────────────
// HomeTown POS — Order journey model (mock data)
// ─────────────────────────────────────────────────────────────────────────────

export type OrderType =
  | "Store"
  | "Online"
  | "Advance booking"
  | "Delivery"
  | "Exchange"
  | "Return"
  | "Corporate";

export type OrderStatus =
  | "Created"
  | "Partially paid"
  | "Paid"
  | "Confirmed"
  | "Packed"
  | "Ready for delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "Created", "Partially paid", "Paid", "Confirmed",
  "Packed", "Ready for delivery", "Delivered",
];

export const STATUS_TONE: Record<OrderStatus, string> = {
  Created: "bg-muted text-muted-foreground",
  "Partially paid": "bg-warning/20 text-warning-foreground",
  Paid: "bg-success/15 text-success",
  Confirmed: "bg-primary/15 text-primary",
  Packed: "bg-primary/15 text-primary",
  "Ready for delivery": "bg-secondary/15 text-secondary",
  Delivered: "bg-success/15 text-success",
  Cancelled: "bg-destructive/15 text-destructive",
  Returned: "bg-destructive/15 text-destructive",
  Refunded: "bg-destructive/15 text-destructive",
};

export type OrderRecord = {
  id: string;
  invoice: string;
  paymentId?: string;
  customer: string;
  phone: string;
  store: string;
  storeCode: string;
  type: OrderType;
  channel: "Store" | "Online";
  items: number;
  itemSummary: string;
  total: number;
  paid: number;
  balance: number;
  status: OrderStatus;
  createdAt: string;
  deliveryDate?: string;
  sapSynced: boolean;
  notes?: string;
};

export const orders: OrderRecord[] = [
  {
    id: "ORD-25612", invoice: "HT-25612", paymentId: "PAY-77012",
    customer: "Sneha Iyer", phone: "+91 91234 56789",
    store: "Indiranagar", storeCode: "BLR-IND",
    type: "Delivery", channel: "Store",
    items: 3, itemSummary: "Westwood Sofa · Lyra Recliner · Bistro Table",
    total: 64498, paid: 64498, balance: 0,
    status: "Ready for delivery", createdAt: "Today 14:22",
    deliveryDate: "2026-06-18", sapSynced: true,
  },
  {
    id: "ORD-25611", invoice: "HT-25611", paymentId: "PAY-77011",
    customer: "Walk-in", phone: "—",
    store: "Indiranagar", storeCode: "BLR-IND",
    type: "Store", channel: "Store",
    items: 1, itemSummary: "Bistro Round Coffee Table",
    total: 8499, paid: 8499, balance: 0,
    status: "Delivered", createdAt: "Today 13:48",
    sapSynced: true,
  },
  {
    id: "ORD-25610", invoice: "HT-25610", paymentId: "PAY-77010",
    customer: "Aarav Mehta", phone: "+91 98200 11223",
    store: "Indiranagar", storeCode: "BLR-IND",
    type: "Advance booking", channel: "Online",
    items: 2, itemSummary: "Aspen King Bed · CloudRest Mattress",
    total: 48498, paid: 36498, balance: 12000,
    status: "Partially paid", createdAt: "Today 12:10",
    deliveryDate: "2026-06-22", sapSynced: false,
    notes: "Balance to be paid on delivery.",
  },
  {
    id: "ORD-25609", invoice: "HT-25609", paymentId: "PAY-77006",
    customer: "Priya Nair", phone: "+91 90876 54321",
    store: "Indiranagar", storeCode: "BLR-IND",
    type: "Store", channel: "Store",
    items: 1, itemSummary: "Nordic Arc Floor Lamp",
    total: 6499, paid: 6499, balance: 0,
    status: "Paid", createdAt: "Today 11:36", sapSynced: true,
  },
  {
    id: "ORD-25608", invoice: "HT-25608", paymentId: "PAY-77009",
    customer: "Rohit Verma", phone: "+91 99887 76655",
    store: "Saket", storeCode: "DEL-SKT",
    type: "Online", channel: "Online",
    items: 4, itemSummary: "Terracotta Vases · Linen Curtains × 2 · Jute Rug",
    total: 18796, paid: 13796, balance: 5000,
    status: "Confirmed", createdAt: "Today 10:54",
    deliveryDate: "2026-06-19", sapSynced: false,
  },
  {
    id: "ORD-25607", invoice: "HT-25607", paymentId: "PAY-77007",
    customer: "Walk-in", phone: "—",
    store: "Indiranagar", storeCode: "BLR-IND",
    type: "Return", channel: "Store",
    items: 1, itemSummary: "Lumen Pendant Light (damaged)",
    total: -3299, paid: -3299, balance: 0,
    status: "Refunded", createdAt: "Today 09:41", sapSynced: true,
    notes: "Refund to UPI source within 24h.",
  },
  {
    id: "ORD-B-1188", invoice: "HT-B-1188", paymentId: "PAY-77008",
    customer: "Saraswati Furnishings Pvt Ltd", phone: "+91 80012 33445",
    store: "LBS Marg", storeCode: "MUM-LBS",
    type: "Corporate", channel: "Store",
    items: 18, itemSummary: "Bulk order — Modular Kitchen + Wardrobes",
    total: 624000, paid: 444000, balance: 180000,
    status: "Packed", createdAt: "Yesterday 18:11",
    deliveryDate: "2026-06-25", sapSynced: true,
  },
  {
    id: "ORD-25599", invoice: "HT-25599", paymentId: "PAY-77006",
    customer: "Priya Nair", phone: "+91 90876 54321",
    store: "LBS Marg", storeCode: "MUM-LBS",
    type: "Store", channel: "Store",
    items: 2, itemSummary: "Clearance — Dining Chairs × 2",
    total: 16800, paid: 16800, balance: 0,
    status: "Delivered", createdAt: "Yesterday 17:02", sapSynced: true,
  },
  {
    id: "ORD-25588", invoice: "HT-25588", paymentId: "PAY-77003",
    customer: "Walk-in", phone: "—",
    store: "Saket", storeCode: "DEL-SKT",
    type: "Store", channel: "Store",
    items: 1, itemSummary: "Cedar 4-Door Wardrobe",
    total: 39999, paid: 0, balance: 39999,
    status: "Cancelled", createdAt: "Yesterday 12:11", sapSynced: false,
    notes: "Card declined. Customer left without rebooking.",
  },
];

export const ORDER_TYPES: OrderType[] = [
  "Store", "Online", "Advance booking", "Delivery", "Exchange", "Return", "Corporate",
];
export const ORDER_STATUSES: OrderStatus[] = [
  "Created", "Partially paid", "Paid", "Confirmed", "Packed",
  "Ready for delivery", "Delivered", "Cancelled", "Returned", "Refunded",
];
