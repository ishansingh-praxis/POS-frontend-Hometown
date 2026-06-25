import { useEffect, useState } from "react";
import {
  Banknote, Boxes, Building2, CreditCard, Globe, IndianRupee, Loader2,
  PackageX, Pause, QrCode, ReceiptText, RefreshCcw, ShieldAlert, ShoppingBag,
  ShoppingCart, Store, Undo2, Wallet, BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@/lib/routerCompat";
import { getAdminDashboardApi } from "@/services/adminDashboardService";
import { getDsrSummaryApi } from "@/services/dsrService";
import {
  getDsrTopStoresApi,
  getDsrChannelSummaryApi,
  type DsrStorewiseSummary,
  type DsrChannelSummary,
} from "@/services/dsrStorewiseService";
import { COLORS, ROLE_THEME } from "@/theme/posTheme";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businessDate, setBusinessDate] = useState(today());
  const [dashboard, setDashboard] = useState<any>(null);
  const [dsrSummary, setDsrSummary] = useState<any>(null);
  const [topStores, setTopStores] = useState<DsrStorewiseSummary[]>([]);
  const [channelSummary, setChannelSummary] = useState<DsrChannelSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [response, dsr, top, channels]: any = await Promise.all([
        getAdminDashboardApi({ businessDate }),
        getDsrSummaryApi({ fromDate: "2026-06-01", toDate: "2026-06-22" }).catch(() => null),
        // STORE only — Hometown.in (online) and Marketplace are real channels but not physical stores,
        // so they're excluded from the store ranking widget and shown separately in Channel Mix.
        getDsrTopStoresApi({ limit: 5, channel: "STORE" }).catch(() => []),
        getDsrChannelSummaryApi().catch(() => null),
      ]);
      setDashboard(response?.data || response);
      setDsrSummary(dsr);
      setTopStores(top || []);
      setChannelSummary(channels);
    } catch (err: any) {
      setError(err.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, businessDate]);

  if (!user) return null;

  const overview = dashboard?.overview || {};
  const sales = overview.sales || {};
  const invoices = overview.invoices || {};
  const payments = overview.payments || {};
  const partialPayments = overview.partialPayments || {};
  const operations = overview.operations || {};
  const inventory = overview.inventory || {};
  const storePerformance: any[] = dashboard?.storePerformance || [];

  return (
    <AppShell
      allow={["admin"]}
      title="Head Office Command Center"
      subtitle={`All stores overview · ${overview.storeCount ?? "—"} stores`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadDashboard}
            className="text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted inline-flex items-center gap-1.5 font-bold"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl text-white p-6 shadow-lg" style={{ background: ROLE_THEME.ADMIN.header }}>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold mb-3">
                <Building2 className="h-4 w-4" /> Head Office
              </div>
              <h1 className="text-3xl font-black">All-Store Performance</h1>
              <p className="mt-2 text-sm text-white/80 max-w-4xl">
                Cross-store sales, payments, sessions, returns, credit notes, and inventory risk —
                business governance, not per-transaction approval.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/15 border border-white/20 p-4">
                <div className="text-xs text-white/70">Admin</div>
                <div className="font-black">{user.name || "Admin"}</div>
                <div className="text-xs text-white/75">{user.email}</div>
              </div>
              <label className="rounded-2xl bg-white/15 border border-white/20 p-4 block">
                <div className="text-xs text-white/70 mb-1">Business Date</div>
                <input
                  type="date"
                  value={businessDate}
                  onChange={(e) => setBusinessDate(e.target.value)}
                  className="w-full rounded-xl bg-white/90 text-slate-950 px-3 py-2 text-sm font-bold outline-none"
                />
              </label>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4">{error}</div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white border shadow-sm p-10 grid place-items-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.deepPurple }} />
            <div className="mt-3 text-sm text-gray-500">Loading admin dashboard...</div>
          </div>
        ) : (
          <>
            {dsrSummary && (
              <Panel title="DSR Historical Sales (June 2026)" icon={<BarChart3 className="h-5 w-5" />}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <KpiCard label="Gross Sales" value={formatINR(dsrSummary.grossSales)} icon={<IndianRupee className="h-5 w-5" />} tone="gold" />
                  <KpiCard label="Total Qty" value={formatNumber(dsrSummary.totalQty)} icon={<ShoppingCart className="h-5 w-5" />} />
                  <KpiCard label="Stores" value={formatNumber(dsrSummary.storeCount)} icon={<Building2 className="h-5 w-5" />} />
                  <KpiCard label="Articles" value={formatNumber(dsrSummary.articleCount)} icon={<Boxes className="h-5 w-5" />} />
                </div>
                <button
                  onClick={() => navigate({ to: "/admin/dsr-analysis" })}
                  className="rounded-xl text-white px-4 py-2 text-sm font-black hover:opacity-90 transition-colors"
                  style={{ background: COLORS.deepPurple }}
                >
                  Open DSR Analysis
                </button>
              </Panel>
            )}

            {topStores.length > 0 && (
              <Panel title="Top 5 Physical Stores (June DSR)" icon={<Store className="h-5 w-5" />}>
                <div className="divide-y">
                  {topStores.map((store) => (
                    <div key={store.storeCode} className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-black">{store.storeCode}</div>
                        <div className="text-xs text-gray-500">{store.storeName}</div>
                      </div>
                      <div className="font-black" style={{ color: COLORS.gold }}>{formatINR(store.grossSales)}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate({ to: "/admin/dsr-storewise" })}
                  className="mt-4 rounded-xl text-white px-4 py-2 text-sm font-black hover:opacity-90 transition-colors"
                  style={{ background: COLORS.purple }}
                >
                  View Storewise DSR
                </button>
              </Panel>
            )}

            {channelSummary && (
              <Panel title="Sales Channel Mix (June DSR)" icon={<Globe className="h-5 w-5" />}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <KpiCard label="Physical Store Sales" value={formatINR(channelSummary.storeSales)} icon={<Store className="h-5 w-5" />} tone="indigo" />
                  <KpiCard label="Online Sales" value={formatINR(channelSummary.onlineSales)} icon={<Globe className="h-5 w-5" />} tone="green" />
                  <KpiCard label="Marketplace Sales" value={formatINR(channelSummary.marketplaceSales)} icon={<ShoppingBag className="h-5 w-5" />} tone="amber" />
                  <KpiCard label="Total Digital Sales" value={formatINR(channelSummary.digitalSales)} icon={<IndianRupee className="h-5 w-5" />} tone="gold" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="py-2 pr-3">Channel</th>
                        <th className="py-2 pr-3">Stores</th>
                        <th className="py-2 pr-3">Sales</th>
                        <th className="py-2 pr-3">Bills</th>
                        <th className="py-2 pr-3">Customers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channelSummary.channels.map((c) => (
                        <tr key={c.salesChannel} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-black">{c.salesChannel}</td>
                          <td className="py-2 pr-3">{formatNumber(c.stores)}</td>
                          <td className="py-2 pr-3 font-bold">{formatINR(c.grossSales)}</td>
                          <td className="py-2 pr-3">{formatNumber(c.bills)}</td>
                          <td className="py-2 pr-3">{formatNumber(c.customers)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            <Panel title="Sales & Payments" icon={<IndianRupee className="h-5 w-5" />}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Total Sales" value={formatINR(sales.totalSales)} icon={<IndianRupee className="h-5 w-5" />} tone="gold" />
                <KpiCard label="Total Orders" value={formatNumber(sales.totalOrders)} icon={<ShoppingCart className="h-5 w-5" />} />
                <KpiCard label="Total Invoices" value={formatNumber(invoices.totalInvoices)} icon={<ReceiptText className="h-5 w-5" />} />
                <KpiCard label="Avg Order Value" value={formatINR(sales.avgOrderValue)} icon={<IndianRupee className="h-5 w-5" />} />
                <KpiCard label="Cash Collection" value={formatINR(payments.CASH)} icon={<Banknote className="h-5 w-5" />} tone="green" />
                <KpiCard label="UPI Collection" value={formatINR(payments.UPI)} icon={<QrCode className="h-5 w-5" />} tone="green" />
                <KpiCard label="Card Collection" value={formatINR(payments.CARD)} icon={<CreditCard className="h-5 w-5" />} tone="green" />
                <KpiCard label="Credit Note Tender" value={formatINR(payments.CREDIT_NOTE)} icon={<Wallet className="h-5 w-5" />} tone="amber" />
                <KpiCard label="Partial Orders" value={formatNumber(partialPayments.partialOrders)} icon={<Pause className="h-5 w-5" />} tone="amber" />
                <KpiCard label="Partial Collected" value={formatINR(partialPayments.collectedAmount)} icon={<IndianRupee className="h-5 w-5" />} tone="amber" />
                <KpiCard label="Due Pending" value={formatINR(sales.dueAmount)} icon={<ShieldAlert className="h-5 w-5" />} tone="red" />
              </div>
            </Panel>

            <Panel title="Operations & Risk" icon={<ShieldAlert className="h-5 w-5" />}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Open Sessions" value={formatNumber(operations.openSessions)} icon={<Store className="h-5 w-5" />} />
                <KpiCard label="Exception Sessions" value={formatNumber(operations.exceptionSessions)} icon={<ShieldAlert className="h-5 w-5" />} tone={operations.exceptionSessions > 0 ? "red" : "default"} />
                <KpiCard label="Held Bills" value={formatNumber(operations.heldBills)} icon={<Pause className="h-5 w-5" />} />
                <KpiCard label="Returns" value={formatNumber(operations.returns)} icon={<Undo2 className="h-5 w-5" />} />
                <KpiCard label="Return Value" value={formatINR(operations.returnAmount)} icon={<Undo2 className="h-5 w-5" />} />
                <KpiCard label="Credit Notes Issued" value={formatNumber(operations.creditNotesIssued)} icon={<Wallet className="h-5 w-5" />} />
                <KpiCard label="Credit Note Value" value={formatINR(operations.creditNoteValue)} icon={<Wallet className="h-5 w-5" />} />
                <KpiCard label="Credit Note Redeemed" value={formatINR(operations.creditNoteRedeemed)} icon={<Wallet className="h-5 w-5" />} tone="green" />
              </div>
            </Panel>

            <Panel title="Inventory Risk" icon={<Boxes className="h-5 w-5" />}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Total SKUs (Stores)" value={formatNumber(inventory.totalSkus)} icon={<Boxes className="h-5 w-5" />} />
                <KpiCard label="Total ATP Qty" value={formatNumber(inventory.totalAtpQty)} icon={<Boxes className="h-5 w-5" />} />
                <KpiCard label="Inventory Value" value={formatINR(inventory.totalMapValue)} icon={<IndianRupee className="h-5 w-5" />} />
                <KpiCard label="Low Stock SKUs" value={formatNumber(inventory.lowStockSkus)} icon={<PackageX className="h-5 w-5" />} tone="amber" />
                <KpiCard label="Out of Stock SKUs" value={formatNumber(inventory.outOfStockSkus)} icon={<PackageX className="h-5 w-5" />} tone="red" />
              </div>
            </Panel>

            <Panel title="Store Performance" icon={<Store className="h-5 w-5" />}>
              {storePerformance.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No store activity for this business date.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="py-2 pr-3">Store</th>
                        <th className="py-2 pr-3">Orders</th>
                        <th className="py-2 pr-3">Sales</th>
                        <th className="py-2 pr-3">Due</th>
                        <th className="py-2 pr-3">Open</th>
                        <th className="py-2 pr-3">Exceptions</th>
                        <th className="py-2 pr-3">Low Stock</th>
                        <th className="py-2 pr-3">Returns</th>
                        <th className="py-2 pr-3">Credit Notes</th>
                        <th className="py-2 pr-3">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storePerformance.map((s) => (
                        <tr key={s.storeCode} className="border-b last:border-0">
                          <td className="py-2 pr-3">
                            <div className="font-black">{s.storeCode}</div>
                            <div className="text-xs text-gray-500">{s.storeName}</div>
                          </td>
                          <td className="py-2 pr-3">{formatNumber(s.orders)}</td>
                          <td className="py-2 pr-3 font-bold">{formatINR(s.sales)}</td>
                          <td className="py-2 pr-3">{s.dueAmount > 0 ? <span className="text-amber-700 font-bold">{formatINR(s.dueAmount)}</span> : formatINR(0)}</td>
                          <td className="py-2 pr-3">{s.openSessions > 0 ? <span className="text-amber-700 font-bold">{s.openSessions}</span> : 0}</td>
                          <td className="py-2 pr-3">{s.exceptionSessions > 0 ? <span className="text-red-700 font-bold">{s.exceptionSessions}</span> : 0}</td>
                          <td className="py-2 pr-3">{s.lowStockSkus > 0 ? <span className="text-amber-700">{s.lowStockSkus}</span> : 0}</td>
                          <td className="py-2 pr-3">{s.returns}</td>
                          <td className="py-2 pr-3">{s.creditNotesIssued}</td>
                          <td className="py-2 pr-3"><ClosingBadge status={s.closingStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}

function KpiCard({
  label, value, icon, tone = "default",
}: { label: string; value: string; icon: React.ReactNode; tone?: "default" | "indigo" | "green" | "red" | "amber" | "gold" }) {
  const hex =
    tone === "indigo" ? COLORS.indigo
    : tone === "green" ? COLORS.teal
    : tone === "red" ? COLORS.coral
    : tone === "amber" ? COLORS.orange
    : tone === "gold" ? COLORS.gold
    : COLORS.deepPurple;

  return (
    <div className="rounded-3xl bg-white border shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500 font-semibold">{label}</div>
          <div className="mt-2 text-xl font-black text-gray-950">{value}</div>
        </div>
        <div className="h-11 w-11 rounded-2xl grid place-items-center text-white" style={{ background: hex }}>{icon}</div>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white border shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-11 w-11 rounded-2xl grid place-items-center text-white"
          style={{ background: COLORS.deepPurple }}
        >
          {icon}
        </div>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ClosingBadge({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();
  const cls =
    s === "CLOSED" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : s === "READY_TO_CLOSE" ? "bg-teal-50 text-teal-700 border-teal-200"
    : s === "BLOCKED_OPEN_SESSION" || s === "BLOCKED_EXCEPTION" ? "bg-red-50 text-red-700 border-red-200"
    : "bg-gray-50 text-gray-700 border-gray-200";

  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${cls}`}>{s.replace(/_/g, " ")}</span>;
}
