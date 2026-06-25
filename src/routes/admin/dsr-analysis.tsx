import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  Building2,
  IndianRupee,
  PackageSearch,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  getDsrSummaryApi,
  getDsrStoreSummaryApi,
  getDsrArticleSummaryApi,
  getDsrCategorySummaryApi,
  getDsrCustomerSummaryApi,
  getDsrReplenishmentSignalApi,
  DsrSummary,
  DsrStoreSummary,
  DsrArticleSummary,
  DsrCategorySummary,
  DsrCustomerSummary,
  DsrReplenishmentSignal,
} from "@/services/dsrService";

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

export default function AdminDsrAnalysisPage() {
  const [summary, setSummary] = useState<DsrSummary | null>(null);
  const [stores, setStores] = useState<DsrStoreSummary[]>([]);
  const [articles, setArticles] = useState<DsrArticleSummary[]>([]);
  const [categories, setCategories] = useState<DsrCategorySummary[]>([]);
  const [customers, setCustomers] = useState<DsrCustomerSummary[]>([]);
  const [replenishment, setReplenishment] = useState<DsrReplenishmentSignal[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fromDate: "2026-06-01",
    toDate: "2026-06-22",
    storeCode: "",
    lob: "",
    docType: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        limit: 50,
      };

      const [summaryRes, storeRes, articleRes, categoryRes, customerRes, replRes] =
        await Promise.all([
          getDsrSummaryApi(params),
          getDsrStoreSummaryApi(params),
          getDsrArticleSummaryApi(params),
          getDsrCategorySummaryApi(params),
          getDsrCustomerSummaryApi(params),
          getDsrReplenishmentSignalApi(params),
        ]);

      setSummary(summaryRes);
      setStores(storeRes || []);
      setArticles(articleRes || []);
      setCategories(categoryRes || []);
      setCustomers(customerRes || []);
      setReplenishment(replRes || []);
    } catch (err: any) {
      alert(err.message || "Unable to load DSR analysis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell
      allow={["ADMIN", "admin"]}
      title="DSR Sales Analysis"
      subtitle="Article-wise HT June DSR 2026 historical sales intelligence"
      actions={
        <button
          onClick={loadData}
          className="rounded-xl bg-[#4B49AC] hover:opacity-90 text-white px-4 py-2 text-sm font-black inline-flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        {/* Header & Filters */}
        <section className="rounded-3xl bg-[#4B49AC] text-white p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="text-xs text-white/80 font-bold">
                Real DSR Data
              </div>
              <h1 className="text-xl font-black">
                Article-wise HT June DSR 2026
              </h1>
              <p className="text-sm text-white/85 mt-1">
                Use this page to analyze real historical sales by store,
                product, category, customer, and replenishment risk.
              </p>
            </div>
            <div className="grid sm:grid-cols-4 gap-2">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value })
                }
                className="rounded-xl px-3 py-2 text-sm text-slate-800"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value })
                }
                className="rounded-xl px-3 py-2 text-sm text-slate-800"
              />
              <input
                value={filters.storeCode}
                onChange={(e) =>
                  setFilters({ ...filters, storeCode: e.target.value })
                }
                placeholder="Store Code"
                className="rounded-xl px-3 py-2 text-sm text-slate-800"
              />
              <button
                onClick={loadData}
                className="rounded-xl bg-white text-[#4B49AC] px-4 py-2 text-sm font-black"
              >
                Apply
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white border p-10 text-center text-slate-500">
            Loading DSR sales data...
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                label="Gross Sales"
                value={formatINR(summary?.grossSales || 0)}
                icon={<IndianRupee />}
              />
              <KpiCard
                label="Total Qty"
                value={formatNumber(summary?.totalQty || 0)}
                icon={<ShoppingBag />}
              />
              <KpiCard
                label="Stores"
                value={formatNumber(summary?.storeCount || 0)}
                icon={<Building2 />}
              />
              <KpiCard
                label="Articles"
                value={formatNumber(summary?.articleCount || 0)}
                icon={<Boxes />}
              />
              <KpiCard
                label="Customers"
                value={formatNumber(summary?.customerCount || 0)}
                icon={<Users />}
              />
              <KpiCard
                label="Net Sales"
                value={formatINR(summary?.netSales || 0)}
                icon={<BarChart3 />}
              />
              <KpiCard
                label="Tax Value"
                value={formatINR(summary?.taxValue || 0)}
                icon={<IndianRupee />}
              />
              <KpiCard
                label="Margin"
                value={formatINR(summary?.marginValue || 0)}
                icon={<TrendingUp />}
              />
            </section>

            {/* Data Tables */}
            <section className="grid xl:grid-cols-2 gap-5">
              <Panel title="Store-wise Sales Ranking">
                <SimpleTable
                  rows={stores.slice(0, 15)}
                  columns={[
                    ["storeCode", "Store"],
                    ["storeName", "Name"],
                    ["qty", "Qty"],
                    ["grossSales", "Gross Sales", "money"],
                    ["customerCount", "Customers"],
                  ]}
                />
              </Panel>

              <Panel title="Top Articles">
                <SimpleTable
                  rows={articles.slice(0, 15)}
                  columns={[
                    ["sku", "SKU"],
                    ["articleDescription", "Product"],
                    ["qty", "Qty"],
                    ["grossSales", "Sales", "money"],
                  ]}
                />
              </Panel>

              <Panel title="Category / LOB Performance">
                <SimpleTable
                  rows={categories.slice(0, 15)}
                  columns={[
                    ["lob", "LOB"],
                    ["category", "Category"],
                    ["qty", "Qty"],
                    ["grossSales", "Sales", "money"],
                  ]}
                />
              </Panel>

              <Panel title="Top Customers">
                <SimpleTable
                  rows={customers.slice(0, 15)}
                  columns={[
                    ["customerPhone", "Phone"],
                    ["customerName", "Customer"],
                    ["qty", "Qty"],
                    ["grossSales", "Sales", "money"],
                  ]}
                />
              </Panel>
            </section>

            <Panel title="Replenishment Signal">
              <SimpleTable
                rows={replenishment.slice(0, 30)}
                columns={[
                  ["storeCode", "Store"],
                  ["sku", "SKU"],
                  ["articleDescription", "Product"],
                  ["qtySold", "Sold"],
                  ["currentAtpQty", "ATP"],
                  ["daysOfStockLeft", "Days Left"],
                  ["replenishmentPriority", "Priority"],
                ]}
              />
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white border border-[#E6EAFE] p-4 shadow-sm">
      <div className="flex justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-bold">{label}</div>
          <div className="mt-2 text-xl font-black text-slate-800">{value}</div>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-[#4B49AC] text-white grid place-items-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white border border-[#E6EAFE] shadow-sm p-5">
      <h2 className="text-base font-black text-slate-800 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SimpleTable({
  rows,
  columns,
}: {
  rows: any[];
  columns: Array<[string, string, string?]>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-[#F3F5FF] text-[#4B49AC]">
          <tr>
            {columns.map(([, label]) => (
              <th key={label} className="text-left px-3 py-2 whitespace-nowrap">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t">
              {columns.map(([key, , type]) => (
                <td key={key} className="px-3 py-2 whitespace-nowrap">
                  {type === "money"
                    ? formatINR(row[key])
                    : key === "daysOfStockLeft"
                    ? Number(row[key] || 0).toFixed(1)
                    : row[key] || "-"}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-slate-500"
              >
                No data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
