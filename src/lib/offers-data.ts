// ─────────────────────────────────────────────────────────────────────────────
// HomeTown POS — Discounts, coupons and offers (mock data layer)
// ─────────────────────────────────────────────────────────────────────────────

export type OfferType =
  | "product"        // SKU specific
  | "category"       // group/subgroup
  | "bill"           // % off whole bill
  | "coupon"         // coupon code
  | "festival"       // seasonal
  | "clearance"      // clearance sale
  | "manager"        // ad-hoc manager discount
  | "bank"           // card/bank offer
  | "bundle"         // buy X get Y
  | "freeDelivery"
  | "freeInstall";

export type Approval = "auto" | "manager" | "admin";

export type Offer = {
  id: string;
  code?: string;            // coupon code (if applicable)
  name: string;
  type: OfferType;
  discountPct?: number;     // for percent offers
  discountFlat?: number;    // for flat-amount offers
  minBill?: number;
  maxDiscount?: number;
  appliesTo: string;        // "All", "Furniture", "Sofas", "SKU:HT-SF-001"...
  storeScope: "ALL" | string[]; // store codes
  validFrom: string;        // ISO date
  validTo: string;          // ISO date
  approval: Approval;
  usageCount: number;
  usageLimit?: number;
  status: "active" | "scheduled" | "expired" | "paused";
  notes?: string;
};

export const OFFER_TYPE_LABEL: Record<OfferType, string> = {
  product: "Product offer",
  category: "Category offer",
  bill: "Bill-level discount",
  coupon: "Coupon",
  festival: "Festival offer",
  clearance: "Clearance sale",
  manager: "Manager discount",
  bank: "Bank / card offer",
  bundle: "Bundle offer",
  freeDelivery: "Free delivery",
  freeInstall: "Free installation",
};

export const offers: Offer[] = [
  {
    id: "of1", code: "MONSOON10", name: "Monsoon Sale", type: "festival",
    discountPct: 10, minBill: 5000, maxDiscount: 7500,
    appliesTo: "All", storeScope: "ALL",
    validFrom: "2026-06-01", validTo: "2026-08-31",
    approval: "auto", usageCount: 184, usageLimit: 5000, status: "active",
    notes: "Auto-apply on cart total above ₹5,000.",
  },
  {
    id: "of2", code: "SOFA15", name: "Sofa Festival", type: "category",
    discountPct: 15, maxDiscount: 12000,
    appliesTo: "Sofas", storeScope: "ALL",
    validFrom: "2026-06-10", validTo: "2026-06-30",
    approval: "auto", usageCount: 42, usageLimit: 500, status: "active",
  },
  {
    id: "of3", code: "HDFC2500", name: "HDFC Card ₹2,500 off", type: "bank",
    discountFlat: 2500, minBill: 25000,
    appliesTo: "All", storeScope: "ALL",
    validFrom: "2026-04-01", validTo: "2026-09-30",
    approval: "auto", usageCount: 76, status: "active",
    notes: "Valid on HDFC credit cards & EMI ≥ 6 months.",
  },
  {
    id: "of4", code: "CLEAR40", name: "Clearance Up to 40%", type: "clearance",
    discountPct: 40,
    appliesTo: "Clearance", storeScope: ["BLR-IND", "MUM-LBS", "DEL-SKT"],
    validFrom: "2026-05-15", validTo: "2026-07-15",
    approval: "auto", usageCount: 311, status: "active",
  },
  {
    id: "of5", code: "FREEDEL", name: "Free Delivery > ₹15,000", type: "freeDelivery",
    minBill: 15000, appliesTo: "All", storeScope: "ALL",
    validFrom: "2026-01-01", validTo: "2026-12-31",
    approval: "auto", usageCount: 522, status: "active",
  },
  {
    id: "of6", code: "INSTALLFREE", name: "Free Installation — Modular Kitchen", type: "freeInstall",
    appliesTo: "Modular Kitchen", storeScope: "ALL",
    validFrom: "2026-06-01", validTo: "2026-12-31",
    approval: "auto", usageCount: 18, status: "active",
  },
  {
    id: "of7", code: "BUNDLEDINE", name: "Dining Set + Sideboard combo", type: "bundle",
    discountPct: 12, appliesTo: "Dining Sets", storeScope: "ALL",
    validFrom: "2026-06-01", validTo: "2026-08-31",
    approval: "auto", usageCount: 9, status: "active",
    notes: "12% off when Dining Set + Sideboard added together.",
  },
  {
    id: "of8", code: "MGR-SPECIAL", name: "Manager Special", type: "manager",
    discountPct: 20, maxDiscount: 15000,
    appliesTo: "All", storeScope: "ALL",
    validFrom: "2026-01-01", validTo: "2026-12-31",
    approval: "manager", usageCount: 27, status: "active",
    notes: "Requires PIN approval. Logged with reason & customer.",
  },
  {
    id: "of9", code: "DIWALI25", name: "Diwali Saver — Pre-booking", type: "festival",
    discountPct: 25, minBill: 20000, maxDiscount: 25000,
    appliesTo: "All", storeScope: "ALL",
    validFrom: "2026-10-15", validTo: "2026-11-12",
    approval: "auto", usageCount: 0, usageLimit: 10000, status: "scheduled",
  },
  {
    id: "of10", code: "SUMMER20", name: "Summer Sale (closed)", type: "festival",
    discountPct: 20, appliesTo: "All", storeScope: "ALL",
    validFrom: "2026-03-01", validTo: "2026-05-31",
    approval: "auto", usageCount: 2841, status: "expired",
  },
];

// Recent discount usage — for audit trail
export type DiscountAudit = {
  id: string;
  invoice: string;
  store: string;
  offer: string;
  type: OfferType;
  discount: number;
  cashier: string;
  approvedBy?: string;
  date: string;
};

export const discountAudit: DiscountAudit[] = [
  { id: "DA-9012", invoice: "HT-25612", store: "Indiranagar", offer: "Sofa Festival", type: "category", discount: 8550, cashier: "Manish", date: "Today 14:22" },
  { id: "DA-9011", invoice: "HT-25611", store: "Indiranagar", offer: "Monsoon Sale", type: "festival", discount: 850, cashier: "Manish", date: "Today 13:48" },
  { id: "DA-9010", invoice: "HT-25608", store: "Saket", offer: "Manager Special", type: "manager", discount: 4200, cashier: "Geeta", approvedBy: "Aditya Khanna", date: "Today 10:54" },
  { id: "DA-9009", invoice: "HT-B-1188", store: "LBS Marg", offer: "HDFC Card ₹2,500 off", type: "bank", discount: 2500, cashier: "Vikas", date: "Yesterday 18:11" },
  { id: "DA-9008", invoice: "HT-25599", store: "LBS Marg", offer: "Clearance Up to 40%", type: "clearance", discount: 11200, cashier: "Vikas", date: "Yesterday 17:02" },
  { id: "DA-9007", invoice: "HT-25593", store: "Indiranagar", offer: "Free Delivery > ₹15,000", type: "freeDelivery", discount: 1500, cashier: "Manish", date: "Yesterday 15:48" },
];
