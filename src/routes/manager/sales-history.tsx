import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  getDsrSummaryApi,
  getDsrArticleSummaryApi,
  getDsrCategorySummaryApi,
  getDsrCustomerSummaryApi,
  getDsrReplenishmentSignalApi,
  DsrSummary,
  DsrArticleSummary,
  DsrCategorySummary,
  DsrCustomerSummary,
  DsrReplenishmentSignal,
} from "@/services/dsrService";

const getUser = () => {
  try {
    const raw = localStorage.getItem("ht-pos-user");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
};

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

export default function ManagerSalesHistoryPage() {
  const user = getUser();

  const [summary, setSummary] = useState<DsrSummary | null>(null);
  const [articles, setArticles] = useState<DsrArticleSummary[]>([]);
  const [categories, setCategories] = useState<DsrCategorySummary[]>([]);
  const [customers, setCustomers] = useState<DsrCustomerSummary[]>([]);
  const [replenishment, setReplenishment] = useState<DsrReplenishmentSignal[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        storeCode: user.store,
        fromDate: "2026-06-01",
        toDate: "2026-06-22",
        limit: 30,
      };

      const [summaryRes, articleRes, catRes, customerRes, replRes] =
        await Promise.all([
          getDsrSummaryApi(params),
          getDsrArticleSummaryApi(params),
          getDsrCategorySummaryApi(params),
          getDsrCustomerSummaryApi(params),
          getDsrReplenishmentSignalApi(params),
        ]);

      setSummary(summaryRes);
      setArticles(articleRes || []);
      setCategories(catRes || []);
      setCustomers(customerRes || []);
      setReplenishment(replRes || []);
    } catch (err: any) {
      alert(err.message || "Unable to load sales history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell
      allow={["MANAGER", "manager"]}
      title="Sales History"
      subtitle={`${user.store} · ${user.storeName || "Store"}`}
    >
      <div className="space-y-5">
        <section className="rounded-3xl bg-[#7978E9] text-white p-5">
          <h1 className="text-xl font-black">My Store DSR Sales History</h1>
          <p className="text-sm text-white/85 mt-1">
            Real June 2026 article-wise sales, customers, categories, and
            replenishment signals for your assigned store.
          </p>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white border p-10 text-center text-slate-500">
            Loading sales history...
          </div>
        ) : (
          <>
            <section className="grid md:grid-cols-4 gap-4">
              <MiniKpi
                label="Gross Sales"
                value={formatINR(summary?.grossSales || 0)}
              />
              <MiniKpi
                label="Net Sales"
                value={formatINR(summary?.netSales || 0)}
              />
              <MiniKpi
                label="Qty Sold"
                value={formatNumber(summary?.totalQty || 0)}
              />
              <MiniKpi
                label="Articles"
                value={formatNumber(summary?.articleCount || 0)}
              />
            </section>

            <Panel title="Top Products">
              <ManagerTable
                rows={articles}
                columns={[
                  ["sku", "SKU"],
                  ["articleDescription", "Product"],
                  ["qty", "Qty"],
                  ["grossSales", "Sales", "money"],
                ]}
              />
            </Panel>

            <Panel title="Top Categories">
              <ManagerTable
                rows={categories}
                columns={[
                  ["lob", "LOB"],
                  ["category", "Category"],
                  ["qty", "Qty"],
                  ["grossSales", "Sales", "money"],
                ]}
              />
            </Panel>

            <Panel title="Top Customers">
              <ManagerTable
                rows={customers}
                columns={[
                  ["customerPhone", "Phone"],
                  ["customerName", "Customer"],
                  ["grossSales", "Sales", "money"],
                  ["lastVisit", "Last Visit"],
                ]}
              />
            </Panel>

            <Panel title="Low ATP + High Sales Replenishment Signal">
              <ManagerTable
                rows={replenishment}
                columns={[
                  ["sku", "SKU"],
                  ["articleDescription", "Product"],
                  ["qtySold", "Sold"],
                  ["currentAtpQty", "ATP"],
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

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white border border-[#E6EAFE] p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-black text-[#7978E9]">{value}</div>
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
    <section className="rounded-3xl bg-white border border-[#E6EAFE] p-5">
      <h2 className="text-base font-black mb-4">{title}</h2>
      {children}
    </section>
  );
}

function ManagerTable({
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
              <th key={label} className="px-3 py-2 text-left">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {columns.map(([key, , type]) => (
                <td key={key} className="px-3 py-2">
                  {type === "money"
                    ? formatINR(row[key])
                    : key === "lastVisit"
                    ? (row[key] as string)?.slice(0, 10) || "-"
                    : row[key] || "-"}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">
                No data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
