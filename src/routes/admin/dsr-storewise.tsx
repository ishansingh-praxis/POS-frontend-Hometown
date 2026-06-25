import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  getDsrStorewiseSummaryApi,
  getDsrTopStoresApi,
  getDsrStoreBreakupsApi,
  type DsrStorewiseSummary,
  type DsrStorewiseTotals,
  type DsrStorewiseBreakups,
} from "@/services/dsrStorewiseService";
import {
  Building2,
  IndianRupee,
  Package,
  ReceiptText,
  RefreshCcw,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS } from "@/theme/posTheme";

const LOB_COLORS: Record<string, string> = {
  Furniture: COLORS.purple,
  Homeware: COLORS.blue,
  "Design Studio": COLORS.aqua,
  Others: COLORS.gold,
};
const lobColor = (lob: string, index: number) =>
  LOB_COLORS[lob] || [COLORS.purple, COLORS.blue, COLORS.aqua, COLORS.gold, COLORS.deepPurple][index % 5];

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function AdminDsrStorewisePage() {
  const [summary, setSummary] = useState<DsrStorewiseTotals | null>(null);
  const [stores, setStores] = useState<DsrStorewiseSummary[]>([]);
  const [selectedStore, setSelectedStore] = useState<DsrStorewiseSummary | null>(null);
  const [breakups, setBreakups] = useState<DsrStorewiseBreakups | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [summaryRes, storesRes] = await Promise.all([
        getDsrStorewiseSummaryApi(),
        getDsrTopStoresApi({ limit: 20 }),
      ]);

      setSummary(summaryRes);
      setStores(storesRes || []);
    } catch (err: any) {
      alert(err.message || "Unable to load DSR storewise data");
    } finally {
      setLoading(false);
    }
  };

  const openStore = async (store: DsrStorewiseSummary) => {
    setSelectedStore(store);
    setBreakups(await getDsrStoreBreakupsApi(store.storeCode));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell
      allow={["admin"]}
      title="DSR Storewise Data"
      subtitle="Real Article-wise HT June DSR 2026 store performance"
      actions={
        <button
          onClick={loadData}
          className="rounded-xl bg-[#6F42C1] hover:opacity-90 text-white px-4 py-2 text-sm font-black inline-flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-[#6F42C1] text-white p-5">
          <h1 className="text-xl font-black">Store-wise DSR Intelligence</h1>
          <p className="text-sm text-white/85 mt-1">
            Compare all stores by sales, bills, articles, customers, quantity,
            category mix, LOB split, and top products.
          </p>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-6 gap-4">
          <Kpi label="Stores" value={formatNumber(summary?.stores || 0)} icon={<Building2 />} />
          <Kpi label="Gross Sales" value={formatINR(summary?.grossSales || 0)} icon={<IndianRupee />} />
          <Kpi label="Bills" value={formatNumber(summary?.bills || 0)} icon={<ReceiptText />} />
          <Kpi label="Qty" value={formatNumber(summary?.qty || 0)} icon={<ShoppingBag />} />
          <Kpi label="Articles" value={formatNumber(summary?.articles || 0)} icon={<Package />} />
          <Kpi label="Customers" value={formatNumber(summary?.customers || 0)} icon={<Users />} />
        </section>

        <section className="rounded-3xl bg-white border border-[#E6EAFE] p-5">
          <h2 className="text-base font-black mb-4">Store Ranking by Gross Sales</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stores} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <XAxis dataKey="storeCode" tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 100000)}L`} />
              <Tooltip formatter={(value: number) => [formatINR(value), "Gross Sales"]} labelFormatter={(label) => `Store ${label}`} />
              <Bar dataKey="grossSales" name="Gross Sales" radius={[6, 6, 0, 0]}>
                {stores.map((store) => (
                  <Cell
                    key={store.storeCode}
                    fill={
                      store.salesChannel === "ONLINE" ? COLORS.cyan :
                      store.salesChannel === "MARKETPLACE" ? COLORS.gold :
                      COLORS.deepPurple
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.deepPurple }} /> Physical store</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.cyan }} /> Online (Hometown.in)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.gold }} /> Marketplace</span>
          </div>
        </section>

        <section className="grid xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 rounded-3xl bg-white border border-[#E6EAFE] p-5">
            <h2 className="text-base font-black mb-4">Store Ranking</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F3F0FF] text-[#6F42C1]">
                  <tr>
                    <th className="px-3 py-2 text-left">Store</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Channel</th>
                    <th className="px-3 py-2 text-right">Sales</th>
                    <th className="px-3 py-2 text-right">Bills</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Customers</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {stores.map((store) => (
                    <tr
                      key={store.storeCode}
                      className={`border-t ${selectedStore?.storeCode === store.storeCode ? "bg-[#F3F0FF]" : ""}`}
                    >
                      <td className="px-3 py-2 font-black">{store.storeCode}</td>
                      <td className="px-3 py-2">{store.storeName}</td>
                      <td className="px-3 py-2">
                        {store.salesChannel && store.salesChannel !== "STORE" ? (
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                            style={{ background: store.salesChannel === "ONLINE" ? COLORS.cyan : COLORS.gold }}
                          >
                            {store.salesChannel}
                          </span>
                        ) : (
                          <span className="text-slate-400">Store</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">{formatINR(store.grossSales)}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(store.bills)}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(store.qty)}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(store.customers)}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openStore(store)}
                          className="rounded-lg bg-[#6F42C1] hover:opacity-90 text-white px-3 py-1.5 text-[11px] font-black"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!stores.length && (
                <div className="py-10 text-center text-sm text-slate-500">
                  {loading ? "Loading..." : "No storewise data found."}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E6EAFE] p-5">
            <h2 className="text-base font-black mb-4">Selected Store</h2>

            {!selectedStore ? (
              <div className="text-sm text-slate-500">
                Select a store to view category, LOB, OTC vs Sales Order, articles, and customers.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#F3F0FF] border border-[#E6EAFE] p-3">
                  <div className="text-xs text-slate-500">Store</div>
                  <div className="font-black text-[#6F42C1]">
                    {selectedStore.storeCode} · {selectedStore.storeName}
                  </div>
                  <div className="mt-2 text-sm">
                    Sales: <b>{formatINR(selectedStore.grossSales)}</b>
                  </div>
                </div>

                {breakups?.otcVsSalesOrder && (
                  <div>
                    <div className="text-sm font-black text-slate-800 mb-2">OTC vs Sales Order</div>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart
                        layout="vertical"
                        data={[
                          { name: "OTC", value: breakups.otcVsSalesOrder.otcGrossSales },
                          { name: "Sales Order", value: breakups.otcVsSalesOrder.salesOrderGrossSales },
                        ]}
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: COLORS.text }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip formatter={(value: number) => formatINR(value)} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          <Cell fill={COLORS.blue} />
                          <Cell fill={COLORS.purple} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                      <div className="text-slate-500">Qty: {formatNumber(breakups.otcVsSalesOrder.otcQty)}</div>
                      <div className="text-slate-500">Qty: {formatNumber(breakups.otcVsSalesOrder.salesOrderQty)}</div>
                    </div>
                  </div>
                )}

                {!!breakups?.lobBreakup?.length && (
                  <div>
                    <div className="text-sm font-black text-slate-800 mb-2">LOB Breakup</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={breakups.lobBreakup}
                          dataKey="grossSales"
                          nameKey="lob"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {breakups.lobBreakup.map((row: any, index: number) => (
                            <Cell key={row.lob || index} fill={lobColor(row.lob, index)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatINR(value)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <Breakup title="Top Categories" rows={breakups?.topCategories} />
                <Breakup title="Top Articles" rows={breakups?.topArticles} />
                <Breakup title="Top Customers" rows={breakups?.topCustomers} />
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-[#E6EAFE] p-4">
      <div className="flex justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="mt-2 text-lg font-black text-slate-800">{value}</div>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-[#6F42C1] text-white grid place-items-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Breakup({ title, rows = [] }: { title: string; rows?: any[] }) {
  return (
    <div>
      <div className="text-sm font-black text-slate-800 mb-2">{title}</div>

      <div className="space-y-2 max-h-52 overflow-y-auto">
        {rows?.slice(0, 8).map((row: any, index: number) => (
          <div key={index} className="rounded-xl border border-[#E6EAFE] p-2 text-xs">
            <div className="font-black">
              {row.customerName || row.articleDescription || row.category || row.lob || row.sku || "-"}
            </div>
            <div className="text-slate-500">
              Sales: {formatINR(row.grossSales)} · Qty: {formatNumber(row.qty)}
            </div>
          </div>
        ))}

        {!rows?.length && <div className="text-xs text-slate-500">No data.</div>}
      </div>
    </div>
  );
}
