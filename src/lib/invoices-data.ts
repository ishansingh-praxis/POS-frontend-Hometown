// HomeTown POS — Invoice / receipt / ticketing data (mock layer)

export type InvoiceType =
  | "Sales invoice"
  | "Tax invoice"
  | "Advance receipt"
  | "Final invoice"
  | "Return invoice"
  | "Refund receipt"
  | "Credit note"
  | "Exchange invoice"
  | "Delivery challan";

export type InvoiceStatus = "Issued" | "Cancelled" | "Reprinted" | "Shared";

export type InvoiceLine = {
  sku: string;
  name: string;
  hsn: string;
  qty: number;
  mrp: number;
  discount: number;
  taxable: number;
  gstPct: number;
  gst: number;
  total: number;
};

export type Invoice = {
  id: string;            // invoice number
  type: InvoiceType;
  status: InvoiceStatus;
  date: string;
  store: string;
  storeCode: string;
  storeGstin: string;
  storeAddress: string;
  storePhone: string;
  customer: string;
  customerPhone: string;
  customerGstin?: string;
  cashier: string;
  paymentMode: string;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  taxable: number;
  gst: number;
  roundOff: number;
  total: number;
  notes?: string;
};

const ln = (
  sku: string, name: string, hsn: string, qty: number, mrp: number, sell: number, gstPct: number
): InvoiceLine => {
  const grossLine = sell * qty;
  const discount = (mrp - sell) * qty;
  const taxable = grossLine / (1 + gstPct / 100);
  const gst = grossLine - taxable;
  return {
    sku, name, hsn, qty, mrp,
    discount: Math.round(discount),
    taxable: Math.round(taxable),
    gstPct, gst: Math.round(gst), total: Math.round(grossLine),
  };
};

const sum = (l: InvoiceLine[], k: keyof InvoiceLine) =>
  l.reduce((s, x) => s + (typeof x[k] === "number" ? (x[k] as number) : 0), 0);

const build = (
  base: Omit<Invoice, "subtotal" | "discount" | "taxable" | "gst" | "roundOff" | "total">
): Invoice => {
  const subtotal = sum(base.lines, "total");
  const taxable = sum(base.lines, "taxable");
  const gst = sum(base.lines, "gst");
  const discount = sum(base.lines, "discount");
  const roundOff = Math.round(subtotal) - subtotal;
  return { ...base, subtotal: Math.round(subtotal), discount, taxable, gst, roundOff: Number(roundOff.toFixed(2)), total: Math.round(subtotal) };
};

export const invoices: Invoice[] = [
  build({
    id: "HT-25612", type: "Tax invoice", status: "Issued", date: "2026-06-16 14:22",
    store: "Indiranagar Flagship", storeCode: "BLR-IND",
    storeGstin: "29AAACH1234F1Z5", storeAddress: "100 Ft Rd, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
    storePhone: "+91 80 4112 8800",
    customer: "Sneha Iyer", customerPhone: "+91 91234 56789",
    cashier: "Manish Rao", paymentMode: "Split (Cash + UPI + Card)",
    lines: [
      ln("HT-SF-001", "Westwood 3-Seater Sofa", "9401", 1, 49999, 42999, 18),
      ln("HT-SF-014", "Lyra Fabric Recliner", "9401", 1, 32999, 28499, 18),
      ln("HT-DN-019", "Bistro Round Coffee Table", "9403", 1, 9999, 8499, 18),
    ],
    notes: "Delivery scheduled 18-Jun. Installation included.",
  }),
  build({
    id: "HT-25611", type: "Sales invoice", status: "Issued", date: "2026-06-16 13:48",
    store: "Indiranagar Flagship", storeCode: "BLR-IND",
    storeGstin: "29AAACH1234F1Z5", storeAddress: "100 Ft Rd, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
    storePhone: "+91 80 4112 8800",
    customer: "Walk-in", customerPhone: "—",
    cashier: "Manish Rao", paymentMode: "UPI (PhonePe)",
    lines: [ln("HT-DN-019", "Bistro Round Coffee Table", "9403", 1, 9999, 8499, 18)],
  }),
  build({
    id: "HT-25610-A", type: "Advance receipt", status: "Issued", date: "2026-06-16 12:10",
    store: "Indiranagar Flagship", storeCode: "BLR-IND",
    storeGstin: "29AAACH1234F1Z5", storeAddress: "100 Ft Rd, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
    storePhone: "+91 80 4112 8800",
    customer: "Aarav Mehta", customerPhone: "+91 98200 11223",
    cashier: "Manish Rao", paymentMode: "UPI (HDFC)",
    lines: [ln("HT-BD-033", "Aspen King Storage Bed — Advance", "9403", 1, 56999, 36498, 18)],
    notes: "Advance of ₹36,498 received. Balance ₹12,000 on delivery.",
  }),
  build({
    id: "HT-25607", type: "Return invoice", status: "Issued", date: "2026-06-16 09:41",
    store: "Indiranagar Flagship", storeCode: "BLR-IND",
    storeGstin: "29AAACH1234F1Z5", storeAddress: "100 Ft Rd, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
    storePhone: "+91 80 4112 8800",
    customer: "Walk-in", customerPhone: "—",
    cashier: "Manish Rao", paymentMode: "UPI refund (HDFC)",
    lines: [ln("HT-LT-011", "Lumen Pendant Light", "9405", 1, 3999, 3299, 18)],
    notes: "Damaged on arrival. Credit note CN-2078 issued.",
  }),
  build({
    id: "CN-2078", type: "Credit note", status: "Issued", date: "2026-06-16 09:42",
    store: "Indiranagar Flagship", storeCode: "BLR-IND",
    storeGstin: "29AAACH1234F1Z5", storeAddress: "100 Ft Rd, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
    storePhone: "+91 80 4112 8800",
    customer: "Walk-in", customerPhone: "—",
    cashier: "Manish Rao", paymentMode: "UPI",
    lines: [ln("HT-LT-011", "Credit — Lumen Pendant Light", "9405", 1, 3999, 3299, 18)],
  }),
  build({
    id: "HT-25608", type: "Exchange invoice", status: "Issued", date: "2026-06-15 16:11",
    store: "Saket Select", storeCode: "DEL-SKT",
    storeGstin: "07AAACH1234F1Z3", storeAddress: "Select Citywalk, Saket District Centre, New Delhi 110017",
    storePhone: "+91 11 4080 5500",
    customer: "Rohit Verma", customerPhone: "+91 99887 76655",
    cashier: "Geeta Bansal", paymentMode: "Cash + Store credit",
    lines: [
      ln("HT-DC-052", "Hand-Woven Jute Rug 6x4 (replacement)", "5702", 1, 5999, 4999, 12),
      ln("HT-CR-018", "Linen Blackout Curtains (replacement)", "6303", 2, 3499, 2499, 12),
    ],
    notes: "Exchanged against HT-25588 (size mismatch).",
  }),
  build({
    id: "DC-9912", type: "Delivery challan", status: "Issued", date: "2026-06-15 11:00",
    store: "LBS Marg Megastore", storeCode: "MUM-LBS",
    storeGstin: "27AAACH1234F1Z7", storeAddress: "R-City Mall, LBS Marg, Ghatkopar W, Mumbai 400086",
    storePhone: "+91 22 6112 9900",
    customer: "Saraswati Furnishings Pvt Ltd", customerPhone: "+91 80012 33445",
    customerGstin: "27AABCS1234M1Z2",
    cashier: "Vikas Patil", paymentMode: "—",
    lines: [
      ln("HT-ST-022", "Cedar 4-Door Wardrobe", "9403", 4, 46999, 39999, 18),
      ln("HT-MK-001", "Modular Kitchen — Unit A", "9403", 1, 280000, 240000, 18),
    ],
    notes: "Goods moving to Bhiwandi warehouse. Invoice on installation completion.",
  }),
  build({
    id: "HT-25588", type: "Sales invoice", status: "Cancelled", date: "2026-06-15 12:11",
    store: "Saket Select", storeCode: "DEL-SKT",
    storeGstin: "07AAACH1234F1Z3", storeAddress: "Select Citywalk, Saket District Centre, New Delhi 110017",
    storePhone: "+91 11 4080 5500",
    customer: "Walk-in", customerPhone: "—",
    cashier: "Geeta Bansal", paymentMode: "Card declined",
    lines: [ln("HT-ST-022", "Cedar 4-Door Wardrobe", "9403", 1, 46999, 39999, 18)],
    notes: "Cancelled — payment failed. Customer did not rebook.",
  }),
];

export const INVOICE_TYPES: InvoiceType[] = [
  "Sales invoice", "Tax invoice", "Advance receipt", "Final invoice",
  "Return invoice", "Refund receipt", "Credit note", "Exchange invoice", "Delivery challan",
];
