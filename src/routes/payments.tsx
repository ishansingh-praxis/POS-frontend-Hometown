import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  getPaymentsApi,
  getPaymentSummaryApi,
  refundPaymentApi,
  type ApiPayment,
} from "@/services/paymentService";
import {
  Wallet,
  Search,
  ReceiptText,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Loader2,
} from "lucide-react";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const PAYMENT_MODES = ["All", "SAP_UNKNOWN", "UPI", "CARD", "CASH", "MIXED"];
const PAYMENT_STATUSES = [
  "All",
  "SUCCESS",
  "SAP_POSTED",
  "PENDING",
  "FAILED",
  "REFUNDED",
  "REFUNDED_OR_REVERSED",
  "ZERO_OR_UNKNOWN",
];
const TRANSACTION_TYPES = [
  "All",
  "SALE",
  "RETURN",
  "RETURN_OR_CANCEL",
  "SCRAP_INVOICE",
  "CANCELLED_INVOICE",
  "RETURN_TO_VENDOR",
  "OTHER",
];

const getPaymentInvoice = (p: ApiPayment) =>
  p.sapBillingDocument || p.invoiceId || p.paymentId || "—";

const getPaymentOrder = (p: ApiPayment) =>
  p.sapSalesDocument || p.orderId || p.orderReference || "—";

const getPaymentCustomer = (p: ApiPayment) =>
  p.customerName || p.customerCode || p.customerPhone || "—";

const getPaymentStore = (p: ApiPayment) =>
  p.storeOrPlant || p.storeName || p.storeCode || "—";

const getPaymentDate = (p: ApiPayment) => p.paymentDate || p.paidAt || "—";

function Payments() {
  const [items, setItems] = useState<ApiPayment[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [q, setQ] = useState("");
  const [mode, setMode] = useState("All");
  const [status, setStatus] = useState("All");
  const [transactionType, setTransactionType] = useState("All");
  const [storeCode, setStoreCode] = useState("");

  const [active, setActive] = useState<ApiPayment | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    const p: Record<string, any> = {
      page,
      limit,
      search: q,
      storeCode,
    };

    if (mode !== "All") p.paymentMode = mode;
    if (status !== "All") p.paymentStatus = status;
    if (transactionType !== "All") p.transactionType = transactionType;

    return p;
  }, [page, limit, q, mode, status, transactionType, storeCode]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const [listData, summaryData] = await Promise.all([
        getPaymentsApi(params),
        getPaymentSummaryApi(params),
      ]);

      setItems(listData.items || []);
      setTotal(listData.total || 0);
      setSummary(summaryData);

      if (!active && listData.items?.length) {
        setActive(listData.items[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mode, status, transactionType]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadPayments();
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, storeCode]);

  const modeSummary = summary?.byMode || [];

  const refundActive = async () => {
    if (!active) return;

    const reason =
      window.prompt("Refund reason", "Customer return processed") ||
      "Refund processed";

    await refundPaymentApi(active.paymentId || active._id, {
      reason,
      refundedBy: "ADMIN",
    });

    await loadPayments();
  };

  return (
    <AppShell
      allow={["cashier", "manager", "admin"]}
      title="Payments"
      subtitle="Real SAP + POS payment ledger, refunds and reconciliation"
      actions={
        <button
          onClick={loadPayments}
          className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Kpi
          tone="success"
          label="Captured / SAP posted"
          value={formatINR(summary?.capturedAmount || 0)}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Kpi
          tone="warning"
          label="Pending"
          value={formatINR(summary?.pendingAmount || 0)}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <Kpi
          tone="destructive"
          label="Refunds / Reversed"
          value={formatINR(summary?.refundedAmount || 0)}
          icon={<ArrowUpCircle className="h-4 w-4" />}
        />
        <Kpi
          tone="muted"
          label="Failed / Unknown"
          value={formatINR(summary?.failedAmount || 0)}
          icon={<RefreshCcw className="h-4 w-4" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search invoice, order, customer, store…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            <input
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              placeholder="Store code"
              className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input w-28"
            />

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input"
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input"
            >
              {TRANSACTION_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Payment</th>
                  <th className="text-left font-medium px-3 py-2.5">Invoice</th>
                  <th className="text-left font-medium px-3 py-2.5">Customer</th>
                  <th className="text-left font-medium px-3 py-2.5">Type</th>
                  <th className="text-left font-medium px-3 py-2.5">Mode</th>
                  <th className="text-left font-medium px-3 py-2.5">Status</th>
                  <th className="text-right font-medium px-5 py-2.5">Amount</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading payments...
                    </td>
                  </tr>
                )}

                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      No payments match these filters.
                    </td>
                  </tr>
                )}

                {!loading &&
                  items.map((t) => (
                    <tr
                      key={t._id || t.paymentId}
                      onClick={() => setActive(t)}
                      className="border-t border-border/60 cursor-pointer hover:bg-muted/30"
                    >
                      <td className="px-5 py-3 font-mono text-xs">
                        {t.paymentId || t._id}
                        <div className="text-[10px] text-muted-foreground">
                          {getPaymentDate(t)}
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono text-xs">
                        {getPaymentInvoice(t)}
                        <div className="text-[10px] text-muted-foreground">
                          Order {getPaymentOrder(t)}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-xs">
                        {getPaymentCustomer(t)}
                        <div className="text-[10px] text-muted-foreground">
                          {getPaymentStore(t)}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-xs">
                        {t.transactionType || t.billingType || "—"}
                      </td>

                      <td className="px-3 py-3 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                          {t.paymentMode || t.paymentMethod || "—"}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            ["SUCCESS", "SAP_POSTED"].includes(
                              t.paymentStatus || ""
                            )
                              ? "bg-success/15 text-success"
                              : ["PENDING"].includes(t.paymentStatus || "")
                              ? "bg-warning/20 text-warning-foreground"
                              : [
                                  "REFUNDED",
                                  "REFUNDED_OR_REVERSED",
                                ].includes(t.paymentStatus || "")
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {t.paymentStatus || "—"}
                        </span>
                      </td>

                      <td
                        className={`px-5 py-3 text-right font-medium ${
                          Number(t.amount || 0) < 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatINR(t.amount || 0)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
            <span>
              Page {page} · {total} payments
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base">Mode-wise summary</h3>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>

            <ul className="space-y-2">
              {modeSummary.map((m: any) => (
                <li
                  key={m._id || "UNKNOWN"}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {m._id || "UNKNOWN"}
                  </span>
                  <span className="font-medium">
                    {formatINR(m.amount)}{" "}
                    <span className="text-[10px] text-muted-foreground">
                      · {m.count}
                    </span>
                  </span>
                </li>
              ))}

              {!modeSummary.length && (
                <li className="text-xs text-muted-foreground">
                  No mode summary.
                </li>
              )}
            </ul>
          </div>

          {active ? (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-base">
                  {active.paymentId || active._id}
                </h3>
                <ReceiptText className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="text-xs text-muted-foreground">
                {getPaymentCustomer(active)} · {getPaymentStore(active)}
              </div>

              <div className="text-xs text-muted-foreground mb-3">
                Invoice {getPaymentInvoice(active)} ·{" "}
                {active.transactionType || active.paymentStatus}
              </div>

              <div className="space-y-1.5 text-sm">
                <Detail label="Payment mode" value={active.paymentMode || "—"} />
                <Detail label="Status" value={active.paymentStatus || "—"} />
                <Detail label="Billing type" value={active.billingType || "—"} />
                <Detail label="SAP order" value={active.sapSalesDocument || "—"} />
                <Detail
                  label="Reference"
                  value={active.transactionReference || "—"}
                />

                <div className="flex justify-between pt-1.5 font-semibold border-t border-border/60">
                  <span>Total</span>
                  <span>{formatINR(active.amount || 0)}</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center justify-center gap-1.5"
                >
                  <ReceiptText className="h-3.5 w-3.5" />
                  Reprint receipt
                </button>

                <button
                  onClick={refundActive}
                  className="flex-1 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center justify-center gap-1.5"
                >
                  <ArrowDownCircle className="h-3.5 w-3.5" />
                  Refund
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
              Select a payment to inspect details and refund.
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <h3 className="font-display text-base mb-3">Store summary</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(summary?.byStore || []).map((s: any) => (
                <div
                  key={s._id || s.storeOrPlant}
                  className="flex justify-between text-xs border-b border-border/60 pb-2"
                >
                  <div>
                    <div className="font-medium">
                      {s.storeName || s.storeOrPlant || s._id || "Unknown"}
                    </div>
                    <div className="text-muted-foreground">{s.count} payments</div>
                  </div>
                  <div className="font-semibold">{formatINR(s.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-1.5 gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function Kpi({
  tone,
  label,
  value,
  icon,
}: {
  tone: "success" | "warning" | "destructive" | "muted";
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  const cls =
    tone === "success"
      ? "bg-success/10 text-success border-success/20"
      : tone === "warning"
      ? "bg-warning/15 text-warning-foreground border-warning/30"
      : tone === "destructive"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-[11px] uppercase tracking-wider flex items-center gap-1.5 opacity-80">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}

export default Payments;
