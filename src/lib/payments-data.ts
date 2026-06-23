// ─────────────────────────────────────────────────────────────────────────────
// HomeTown POS — Payment modes, scenarios & reconciliation (mock data layer)
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMode =
  | "Cash"
  | "UPI"
  | "Credit card"
  | "Debit card"
  | "Net banking"
  | "Wallet"
  | "EMI"
  | "Finance"
  | "Gift card"
  | "Store credit"
  | "Bank transfer";

export const PAYMENT_MODES: PaymentMode[] = [
  "Cash", "UPI", "Credit card", "Debit card", "Net banking",
  "Wallet", "EMI", "Finance", "Gift card", "Store credit", "Bank transfer",
];

export type PaymentStatus = "captured" | "pending" | "failed" | "refunded" | "partial";

export type PaymentScenario =
  | "Full"
  | "Partial"
  | "Advance"
  | "Balance"
  | "Split"
  | "Refund"
  | "Store credit";

export type PaymentSplit = { mode: PaymentMode; amount: number; ref?: string };

export type PaymentTxn = {
  id: string;
  invoice: string;
  order: string;
  customer: string;
  store: string;
  scenario: PaymentScenario;
  splits: PaymentSplit[];
  total: number;            // sum of splits
  status: PaymentStatus;
  date: string;
  cashier: string;
};

export const paymentTxns: PaymentTxn[] = [
  {
    id: "PAY-77012", invoice: "HT-25612", order: "ORD-25612", customer: "Sneha Iyer",
    store: "Indiranagar", scenario: "Split", status: "captured", date: "Today 14:22",
    cashier: "Manish",
    splits: [
      { mode: "Cash", amount: 20000 },
      { mode: "UPI", amount: 24498, ref: "UPI/HDFC/9X8X" },
      { mode: "Credit card", amount: 20000, ref: "VISA ****4421" },
    ], total: 64498,
  },
  {
    id: "PAY-77011", invoice: "HT-25611", order: "ORD-25611", customer: "Walk-in",
    store: "Indiranagar", scenario: "Full", status: "captured", date: "Today 13:48",
    cashier: "Manish",
    splits: [{ mode: "UPI", amount: 8499, ref: "UPI/PhonePe" }], total: 8499,
  },
  {
    id: "PAY-77010", invoice: "HT-25610", order: "ORD-25610", customer: "Aarav Mehta",
    store: "Indiranagar", scenario: "Advance", status: "partial", date: "Today 12:10",
    cashier: "Manish",
    splits: [{ mode: "UPI", amount: 36498, ref: "UPI/HDFC" }], total: 36498,
  },
  {
    id: "PAY-77009", invoice: "HT-25608", order: "ORD-25608", customer: "Rohit Verma",
    store: "Saket", scenario: "Partial", status: "pending", date: "Today 10:54",
    cashier: "Geeta",
    splits: [{ mode: "Cash", amount: 13796 }], total: 13796,
  },
  {
    id: "PAY-77008", invoice: "HT-B-1188", order: "ORD-B-1188", customer: "Saraswati Furnishings",
    store: "LBS Marg", scenario: "Balance", status: "captured", date: "Yesterday 18:11",
    cashier: "Vikas",
    splits: [
      { mode: "Bank transfer", amount: 300000, ref: "NEFT/ICICI" },
      { mode: "EMI", amount: 144000, ref: "Bajaj EMI 12m" },
    ], total: 444000,
  },
  {
    id: "PAY-77007", invoice: "HT-25607", order: "ORD-25607", customer: "Walk-in",
    store: "Indiranagar", scenario: "Refund", status: "refunded", date: "Today 09:41",
    cashier: "Manish",
    splits: [{ mode: "UPI", amount: -3299, ref: "Refund UPI/HDFC" }], total: -3299,
  },
  {
    id: "PAY-77006", invoice: "HT-25599", order: "ORD-25599", customer: "Priya Nair",
    store: "LBS Marg", scenario: "Full", status: "captured", date: "Yesterday 17:02",
    cashier: "Vikas",
    splits: [{ mode: "Credit card", amount: 16800, ref: "MC ****1180" }], total: 16800,
  },
  {
    id: "PAY-77005", invoice: "HT-25593", order: "ORD-25593", customer: "Walk-in",
    store: "Indiranagar", scenario: "Full", status: "captured", date: "Yesterday 15:48",
    cashier: "Manish",
    splits: [
      { mode: "Cash", amount: 8500 },
      { mode: "Gift card", amount: 5000, ref: "GC-2241" },
    ], total: 13500,
  },
  {
    id: "PAY-77004", invoice: "HT-25590", order: "ORD-25590", customer: "Aarav Mehta",
    store: "Indiranagar", scenario: "Store credit", status: "captured", date: "Yesterday 14:00",
    cashier: "Manish",
    splits: [{ mode: "Store credit", amount: 3299, ref: "SC-Aarav-001" }], total: 3299,
  },
  {
    id: "PAY-77003", invoice: "HT-25588", order: "ORD-25588", customer: "Walk-in",
    store: "Saket", scenario: "Full", status: "failed", date: "Yesterday 12:11",
    cashier: "Geeta",
    splits: [{ mode: "Credit card", amount: 22000, ref: "Decline 51" }], total: 22000,
  },
];

// Aggregated mode-wise summary for today
export type ModeSummary = { mode: PaymentMode; amount: number; count: number };

export function summarizeByMode(txns: PaymentTxn[] = paymentTxns): ModeSummary[] {
  const map = new Map<PaymentMode, ModeSummary>();
  for (const t of txns) {
    if (t.status === "failed") continue;
    for (const s of t.splits) {
      const cur = map.get(s.mode) ?? { mode: s.mode, amount: 0, count: 0 };
      cur.amount += s.amount;
      cur.count += 1;
      map.set(s.mode, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}
