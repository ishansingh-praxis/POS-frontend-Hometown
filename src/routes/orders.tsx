// src/routes/orders.tsx

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/pos-data";
import { useAuth } from "@/lib/auth";
import {
  ORDER_STATUS_FLOW, ORDER_STATUSES, ORDER_TYPES, STATUS_TONE,
  type OrderRecord, type OrderStatus, type OrderType,
} from "@/lib/orders-data";
import {
  Search, Truck, Package, CheckCircle2, XCircle, RefreshCcw, ReceiptText,
  Wallet, Building2, AlertCircle, Filter,
} from "lucide-react";
import { toast } from "sonner";

// ---- API response interface ----
interface ApiOrder {
  _id: string;
  orderId: string;
  orderNumber: string;
  channel: "POS" | "OFFLINE_STORE" | "ONLINE_TO_STORE" | "ONLINE_WEBSITE";
  orderType: "STORE_SALE" | "HOME_DELIVERY" | "PICKUP";
  storeCode: string;
  storeName: string;
  city: string;
  state: string;
  region: string;
  zone: string;
  storeAddress: string;
  cashierId: string;
  cashierName: string;
  managerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  billingAddress: {
    name: string;
    phone: string;
    city: string;
    state: string;
    addressLine1: string;
  };
  shippingAddress: {
    name: string;
    phone: string;
    city: string;
    state: string;
    addressLine1: string;
  };
  items: any[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  itemDiscountTotal: number;
  couponCode?: string;
  couponDiscount?: number;
  taxTotal: number;
  deliveryFee: number;
  roundingAdjustment: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  currency: string;
  paymentStatus: "PAID" | "PARTIAL" | "PENDING" | "CANCELLED";
  paymentMode: "CASH" | "UPI" | "CARD" | "WALLET" | "EMI" | "MIXED";
  orderStatus: "PAID" | "PARTIALLY_PAID" | "CANCELLED";
  fulfillmentStatus: string;
  invoiceId: string | null;
  sapSyncStatus: "PENDING" | "SYNCED" | "FAILED";
  accountingStatus: "PENDING" | "POSTED";
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Helper: map API order to OrderRecord ----
function mapApiOrder(api: ApiOrder): OrderRecord {
  const statusMap: Record<ApiOrder["orderStatus"], OrderStatus> = {
    PAID: "Confirmed",
    PARTIALLY_PAID: "Confirmed",
    CANCELLED: "Cancelled",
  };
  const status = statusMap[api.orderStatus] || "Confirmed";

  // CHANNEL FIX: only "Online" for online orders, everything else is "Store"
  const isOnline = api.channel === "ONLINE_TO_STORE" || api.channel === "ONLINE_WEBSITE";
  const type: OrderType = isOnline ? "Online" : "Store";
  const channel: "Store" | "Online" = isOnline ? "Online" : "Store";

  const paid = api.paidAmount || 0;
  const balance = api.dueAmount || 0;

  return {
    id: api.orderId || api.orderNumber,
    invoice: api.invoiceId || api.orderNumber,
    customer: api.customerName,
    phone: api.customerPhone,
    type,
    channel,
    store: api.storeName,
    storeCode: api.storeCode,
    status,
    total: api.grandTotal,
    paid,
    balance,
    items: api.itemCount,
    itemSummary: `${api.totalQuantity} units`,
    deliveryDate: api.fulfillmentStatus === "DELIVERED" ? new Date(api.updatedAt).toLocaleDateString() : "",
    sapSynced: api.sapSyncStatus === "SYNCED",
    notes: api.remarks || "",
    createdAt: new Date(api.createdAt).toLocaleDateString(),
  };
}

// ---- Main component ----
function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Filter state ----
  const [search, setSearch] = useState("");
  const [storeCode, setStoreCode] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [limit, setLimit] = useState<number>(300);

  // Derived: list of unique store codes from orders
  const storeOptions = useMemo(() => {
    const stores = Array.from(new Set(orders.map((o) => o.storeCode))).filter(Boolean);
    return stores.map((code) => ({
      code,
      name: orders.find((o) => o.storeCode === code)?.store || code,
    }));
  }, [orders]);

  // ---- Fetch orders with filters ----
  const fetchOrders = async (params?: Record<string, string | number>) => {
    setLoading(true);
    setError(null);
    try {
      const token = user?.token;
      if (!token) throw new Error("No authentication token");

      const url = new URL("/api/pos/orders", window.location.origin);
      const baseParams: Record<string, string | number> = { limit };
      if (search) baseParams.q = search;
      if (storeCode) baseParams.storeCode = storeCode;
      if (paymentStatus) baseParams.paymentStatus = paymentStatus;
      if (orderStatus) baseParams.orderStatus = orderStatus;
      if (fromDate) baseParams.fromDate = fromDate;
      if (toDate) baseParams.toDate = toDate;

      const finalParams = { ...baseParams, ...params };
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch orders");
      }
      const items = result.data || [];
      const mapped = items.map(mapApiOrder);
      setOrders(mapped);
      if (mapped.length > 0) setActive(mapped[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user?.token) fetchOrders();
  }, [user]);

  // Auto-fetch on filter change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.token) fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, storeCode, paymentStatus, orderStatus, fromDate, toDate, limit]);

  // ---- Selection ----
  const [active, setActive] = useState<OrderRecord | null>(null);

  // ---- Filtered list (client-side search is redundant since API already does it) ----
  const filtered = orders;

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const open = orders.filter((o) => !["Delivered", "Cancelled", "Returned", "Refunded"].includes(o.status));
    const balance = orders.reduce((s, o) => s + Math.max(0, o.balance), 0);
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const returns = orders.filter((o) => o.status === "Returned" || o.status === "Refunded").length;
    return { open: open.length, balance, delivered, returns };
  }, [orders]);

  // ---- Advance status (local) ----
  const advance = (o: OrderRecord, next: OrderStatus) => {
    setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status: next } : x));
    setActive((a) => a && a.id === o.id ? { ...a, status: next } : a);
    toast.success(`Order ${o.id} advanced to ${next}`);
  };

  // ---- Reset filters ----
  const resetFilters = () => {
    setSearch("");
    setStoreCode("");
    setPaymentStatus("");
    setOrderStatus("");
    setFromDate("");
    setToDate("");
    setLimit(300);
    fetchOrders();
  };

  // ---- Loading / error ----
  if (loading && orders.length === 0) {
    return (
      <AppShell allow={["cashier", "manager", "admin"]} title="Orders" subtitle="Loading…">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell allow={["cashier", "manager", "admin"]} title="Orders" subtitle="Error">
        <div className="p-6 text-center text-destructive border border-destructive/30 rounded-xl bg-destructive/5">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
          <button onClick={() => fetchOrders()} className="mt-4 text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Retry</button>
        </div>
      </AppShell>
    );
  }

  // ---- Render ----
  return (
    <AppShell
      allow={["cashier", "manager", "admin"]}
      title="Orders"
      subtitle={`${orders.length} total orders · ${kpis.open} open`}
      actions={
        <button onClick={() => fetchOrders()} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Kpi label="Open orders" value={String(kpis.open)} icon={<Package className="h-4 w-4" />} />
        <Kpi label="Outstanding balance" value={formatINR(kpis.balance)} icon={<Wallet className="h-4 w-4" />} />
        <Kpi label="Delivered" value={String(kpis.delivered)} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Kpi label="Returns / Refunds" value={String(kpis.returns)} icon={<RefreshCcw className="h-4 w-4" />} />
      </div>

      {/* Filter Bar */}
      <div className="mb-5 p-4 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order, invoice, customer, phone…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </div>

          <div className="w-44">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Store</label>
            <select
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">All stores</option>
              {storeOptions.map((s) => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div className="w-44">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="w-44">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Order Status</label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="w-40">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          <div className="w-40">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          <div className="flex gap-2 items-end pb-0.5">
            <button
              onClick={() => fetchOrders()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 inline-flex items-center gap-1.5"
            >
              <Filter className="h-4 w-4" /> Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted inline-flex items-center gap-1.5"
            >
              <XCircle className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Orders table & detail */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Order</th>
                  <th className="text-left font-medium px-3 py-2.5">Customer</th>
                  <th className="text-left font-medium px-3 py-2.5">Type</th>
                  <th className="text-left font-medium px-3 py-2.5">Store</th>
                  <th className="text-left font-medium px-3 py-2.5">Status</th>
                  <th className="text-right font-medium px-3 py-2.5">Balance</th>
                  <th className="text-right font-medium px-5 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No orders match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setActive(o)}
                    className={`border-t border-border/60 cursor-pointer hover:bg-muted/30 ${
                      active?.id === o.id ? "bg-muted/40" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs">{o.id}</div>
                      <div className="text-[10px] text-muted-foreground">Inv {o.invoice} · {o.createdAt}</div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {o.customer}
                      <div className="text-[10px] text-muted-foreground">{o.phone}</div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {o.type}
                      <div className="text-[10px] text-muted-foreground">{o.channel}</div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {o.store}
                      <div className="text-[10px] text-muted-foreground font-mono">{o.storeCode}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_TONE[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-3 text-right text-xs ${
                        o.balance > 0 ? "text-warning-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {o.balance > 0 ? formatINR(o.balance) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatINR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-5">
          {active ? (
            <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <div className="px-5 py-4 border-b border-border">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {active.type} · {active.channel}
                </div>
                <h3 className="font-display text-lg mt-0.5">{active.id}</h3>
                <div className="text-xs text-muted-foreground mt-1">
                  {active.customer} · {active.phone}
                </div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3" /> {active.store}
                </div>
              </div>

              <div className="px-5 py-4 border-b border-border">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Journey</div>
                <ol className="space-y-1.5">
                  {ORDER_STATUS_FLOW.map((s, i) => {
                    const reachedIdx = ORDER_STATUS_FLOW.indexOf(active.status as OrderStatus);
                    const isCurrent = active.status === s;
                    const done = reachedIdx >= i && reachedIdx !== -1;
                    return (
                      <li key={s} className="flex items-center gap-2 text-xs">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isCurrent
                              ? "bg-primary ring-2 ring-primary/30"
                              : done
                              ? "bg-success"
                              : "bg-muted"
                          }`}
                        />
                        <span className={isCurrent ? "font-medium" : done ? "" : "text-muted-foreground"}>
                          {s}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                {["Cancelled", "Returned", "Refunded"].includes(active.status) && (
                  <div className="mt-2 text-[11px] inline-flex items-center gap-1 text-destructive">
                    <XCircle className="h-3 w-3" /> {active.status}
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-b border-border space-y-1.5 text-sm">
                <Row label="Items" value={`${active.items} · ${active.itemSummary}`} />
                <Row label="Total" value={formatINR(active.total)} />
                <Row label="Paid" value={formatINR(active.paid)} />
                <Row label="Balance" value={active.balance > 0 ? formatINR(active.balance) : "—"} highlight={active.balance > 0} />
                {active.deliveryDate && <Row label="Delivery" value={active.deliveryDate} />}
                <Row label="SAP sync" value={active.sapSynced ? "Synced" : "Pending"} />
                {active.notes && <div className="text-[11px] text-muted-foreground italic pt-1">{active.notes}</div>}
              </div>

              <div className="p-4 grid grid-cols-2 gap-2">
                {ORDER_STATUS_FLOW.includes(active.status as OrderStatus) &&
                  ORDER_STATUS_FLOW.indexOf(active.status as OrderStatus) < ORDER_STATUS_FLOW.length - 1 && (
                    <button
                      onClick={() =>
                        advance(
                          active,
                          ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(active.status as OrderStatus) + 1]
                        )
                      }
                      className="col-span-2 text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-1.5"
                    >
                      <Truck className="h-3.5 w-3.5" /> Advance to “
                      {ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(active.status as OrderStatus) + 1]}”
                    </button>
                  )}
                <button className="text-xs px-3 py-2 rounded-md border border-border hover:bg-muted inline-flex items-center justify-center gap-1.5">
                  <ReceiptText className="h-3.5 w-3.5" /> Invoice
                </button>
                <button
                  onClick={() => advance(active, "Cancelled")}
                  className="text-xs px-3 py-2 rounded-md border border-border hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
              Select an order to view journey, payments and SAP sync.
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

// ---- Helper components ----
function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`text-xs ${highlight ? "font-medium text-warning-foreground" : ""}`}>{value}</span>
    </div>
  );
}

export default Orders;