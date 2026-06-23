import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/routerCompat";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Filter,
  IndianRupee,
  Layers3,
  Loader2,
  PackageSearch,
  RefreshCcw,
  Search,
  ShieldCheck,
  Store,
  Tags,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  getManagerCategorySummaryApi,
  getManagerCatalogByCategoryApi,
  getManagerInventorySummaryApi,
  getManagerReplenishmentApi,
} from "@/services/managerCategoriesService";

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

type ViewMode = "LOB" | "CATEGORY";

export default function ManagerCategoriesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // "ALL" (head office / admin) has no single store to scope by — fall back to network-wide
  const storeCode = user?.store && user.store !== "ALL" ? user.store : undefined;

  const [viewMode, setViewMode] = useState<ViewMode>("LOB");
  const [search, setSearch] = useState("");
  const [selectedLob, setSelectedLob] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [replenishment, setReplenishment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState("");

  const baseParams = {
    storeCode,
    posOnly: true,
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryRes, summaryRes, replRes]: any = await Promise.all([
        getManagerCategorySummaryApi({
          level: viewMode,
          search,
        }),
        getManagerInventorySummaryApi({
          storeCode,
          locationType: "Store",
        }),
        getManagerReplenishmentApi({
          storeCode,
        }),
      ]);

      const categoryData = categoryRes?.data || categoryRes;
      const summaryData = summaryRes?.data || summaryRes;
      const replData = replRes?.data || replRes;

      setCategories(categoryData?.items || categoryData || []);
      setInventorySummary(summaryData || null);
      setReplenishment(Array.isArray(replData) ? replData : replData?.items || []);
    } catch (err: any) {
      setError(err.message || "Unable to load categories");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (params: Record<string, any>) => {
    try {
      setProductsLoading(true);

      const res: any = await getManagerCatalogByCategoryApi({
        ...baseParams,
        ...params,
        limit: 100,
      });

      const data = res?.data || res;
      setCatalogProducts(data?.items || data || []);
    } catch (err: any) {
      alert(err.message || "Unable to load category products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewMode, search]);

  useEffect(() => {
    if (!user?.token) return;

    const params: Record<string, any> = {};

    if (selectedLob) params.lob = selectedLob;
    if (selectedCategory) params.category = selectedCategory;
    if (stockFilter) params.stockStatus = stockFilter;

    loadProducts(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedLob, selectedCategory, stockFilter]);

  const overall = inventorySummary?.overall || inventorySummary?.summary || {};

  const filteredCategories = useMemo(() => {
    let rows = [...categories];

    if (selectedLob && viewMode === "CATEGORY") {
      rows = rows.filter(
        (x) => String(x.lob || x.parentName || "").toLowerCase() === selectedLob.toLowerCase()
      );
    }

    return rows;
  }, [categories, selectedLob, viewMode]);

  const selectedTitle =
    selectedCategory || selectedLob || "All Sellable Store Categories";

  if (!user) return null;

  return (
    <AppShell
      allow={["manager", "admin"]}
      title="Manager Categories"
      subtitle={`${user.store || ""} · ${user.storeName || "Assigned Store"}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate("/my-capabilities")}
            className="text-xs px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 inline-flex items-center gap-1.5 font-bold"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            My Capabilities
          </button>

          <button
            onClick={loadCategories}
            className="text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted inline-flex items-center gap-1.5 font-bold"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-orange-700 to-amber-500 text-white p-6 shadow-lg">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold mb-3">
                <Layers3 className="h-4 w-4" />
                Real ATP Category Control
              </div>

              <h1 className="text-3xl font-black">Store Categories</h1>

              <p className="mt-2 text-sm text-white/80 max-w-4xl">
                Categories are generated from real ATP inventory. LOB is the
                main group, Merc. Category is the category, and sellability is
                based on store ATP quantity.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 border border-white/20 p-4 min-w-[260px]">
              <div className="text-xs text-white/70">Store</div>
              <div className="font-black">{user.storeName}</div>
              <div className="text-xs text-white/75">
                {user.store} · Manager View
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white border shadow-sm p-10 grid place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <div className="mt-3 text-sm text-gray-500">
              Loading real ATP categories...
            </div>
          </div>
        ) : (
          <>
            <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                label="Store SKUs"
                value={formatNumber(overall.totalSkus || overall.uniqueSkuCount)}
                icon={<Boxes />}
              />
              <KpiCard
                label="Total ATP"
                value={formatNumber(overall.totalAtpQty)}
                icon={<PackageSearch />}
                tone="green"
              />
              <KpiCard
                label="MAP Value"
                value={formatINR(overall.totalMapValue)}
                icon={<IndianRupee />}
                tone="orange"
              />
              <KpiCard
                label="Out of Stock"
                value={formatNumber(overall.outOfStock || overall.outOfStockSkus)}
                icon={<XCircle />}
                tone={
                  Number(overall.outOfStock || overall.outOfStockSkus || 0) > 0
                    ? "red"
                    : "green"
                }
              />
            </section>

            <section className="rounded-3xl bg-white border shadow-sm p-5">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Category Filters</h2>
                  <p className="text-sm text-gray-500">
                    Filter by LOB, Merc. Category, and stock status.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setViewMode("LOB");
                      setSelectedCategory("");
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-black border ${
                      viewMode === "LOB"
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white hover:bg-orange-50"
                    }`}
                  >
                    LOB View
                  </button>

                  <button
                    onClick={() => setViewMode("CATEGORY")}
                    className={`rounded-xl px-4 py-2 text-sm font-black border ${
                      viewMode === "CATEGORY"
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white hover:bg-orange-50"
                    }`}
                  >
                    Category View
                  </button>
                </div>
              </div>

              <div className="mt-5 grid md:grid-cols-4 gap-3">
                <label className="relative md:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search LOB, category, sofa, bed, dining..."
                    className="w-full rounded-2xl border px-10 py-3 outline-none focus:border-orange-400"
                  />
                </label>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="rounded-2xl border px-3 py-3 outline-none focus:border-orange-400"
                >
                  <option value="">All Stock Status</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LIMITED_STOCK">Limited Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>

                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedLob("");
                    setSelectedCategory("");
                    setStockFilter("");
                  }}
                  className="rounded-2xl border bg-gray-50 px-3 py-3 text-sm font-black hover:bg-gray-100 inline-flex items-center justify-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </section>

            <section className="grid xl:grid-cols-3 gap-5">
              <div className="xl:col-span-1 space-y-5">
                <Panel
                  title={viewMode === "LOB" ? "LOB Groups" : "Merc. Categories"}
                  icon={<Tags />}
                >
                  <div className="space-y-2 max-h-[660px] overflow-auto pr-1">
                    {filteredCategories.map((cat) => (
                      <CategoryCard
                        key={cat._id || cat.categoryId || cat.slug}
                        category={cat}
                        active={
                          viewMode === "LOB"
                            ? selectedLob === cat.name
                            : selectedCategory === cat.name
                        }
                        onClick={() => {
                          if (viewMode === "LOB") {
                            setSelectedLob(cat.name);
                            setSelectedCategory("");
                          } else {
                            setSelectedLob(cat.lob || cat.parentName || "");
                            setSelectedCategory(cat.name);
                          }
                        }}
                      />
                    ))}

                    {!filteredCategories.length && (
                      <Empty text="No categories found." />
                    )}
                  </div>
                </Panel>

                <Panel title="Replenishment Need" icon={<AlertTriangle />}>
                  <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                    {replenishment.slice(0, 20).map((item, index) => (
                      <div
                        key={`${item.sku}-${index}`}
                        className="rounded-2xl border p-3 text-sm"
                      >
                        <div className="font-black line-clamp-1">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500">{item.sku}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span>Store ATP: {formatNumber(item.storeAtpQty)}</span>
                          <PriorityBadge priority={item.priority} />
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Source: {item.sourceSiteName || item.sourceName}
                        </div>
                      </div>
                    ))}

                    {!replenishment.length && (
                      <Empty text="No replenishment suggestions." />
                    )}
                  </div>
                </Panel>
              </div>

              <div className="xl:col-span-2 space-y-5">
                <Panel title={selectedTitle} icon={<PackageSearch />}>
                  {productsLoading ? (
                    <div className="p-10 grid place-items-center">
                      <Loader2 className="h-7 w-7 animate-spin text-orange-600" />
                    </div>
                  ) : (
                    <InventoryProductsTable rows={catalogProducts} />
                  )}
                </Panel>

                <section className="grid md:grid-cols-2 gap-5">
                  <InsightBox
                    title="Category Logic"
                    icon={<Layers3 />}
                    items={[
                      "LOB is the main product group.",
                      "Merc. Category is the product category.",
                      "ATP decides whether product is sellable.",
                      "Manager sees only assigned store products.",
                    ]}
                  />

                  <InsightBox
                    title="Manager Actions"
                    icon={<Store />}
                    items={[
                      "Monitor low-stock categories.",
                      "Check out-of-stock categories.",
                      "Use replenishment suggestions.",
                      "View category-wise sellable catalog.",
                    ]}
                  />
                </section>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function CategoryCard({
  category,
  active,
  onClick,
}: {
  category: any;
  active: boolean;
  onClick: () => void;
}) {
  const low = Number(category.lowStockCount || 0);
  const out = Number(category.outOfStockCount || 0);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition ${
        active
          ? "bg-orange-50 border-orange-300 shadow-sm"
          : "bg-white hover:bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black text-gray-950">{category.name}</div>
          <div className="text-xs text-gray-500">
            {category.level} {category.parentName ? `· ${category.parentName}` : ""}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <MiniMetric label="Products" value={formatNumber(category.productCount)} />
        <MiniMetric label="Store ATP" value={formatNumber(category.storeAtpQty)} />
        <MiniMetric label="Value" value={formatINR(category.totalMapValue)} />
        <MiniMetric label="Rows" value={formatNumber(category.inventoryRows)} />
      </div>

      {(low > 0 || out > 0) && (
        <div className="mt-3 flex gap-2">
          {low > 0 && (
            <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 text-[11px] font-black">
              Low {low}
            </span>
          )}

          {out > 0 && (
            <span className="rounded-full bg-red-50 border border-red-200 text-red-700 px-2 py-1 text-[11px] font-black">
              Out {out}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function InventoryProductsTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 text-orange-900">
          <tr>
            <Th>Product</Th>
            <Th>LOB</Th>
            <Th>Category</Th>
            <Th>Brand</Th>
            <Th>ATP</Th>
            <Th>Stock</Th>
            <Th>MRP</Th>
            <Th>Selling</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.inventoryId || x.sku} className="border-t">
              <Td>
                <div className="font-black text-gray-950">{x.productName}</div>
                <div className="text-xs text-gray-500">{x.sku}</div>
              </Td>
              <Td>{x.lob}</Td>
              <Td>{x.category}</Td>
              <Td>{x.brand}</Td>
              <Td>{formatNumber(x.atpQty)}</Td>
              <Td>{formatNumber(x.stockQty)}</Td>
              <Td>{formatINR(x.mrp)}</Td>
              <Td>{formatINR(x.sellingPrice || x.map)}</Td>
              <Td>
                <StockBadge status={x.stockStatus} />
              </Td>
            </tr>
          ))}

          {!rows.length && (
            <tr>
              <td colSpan={9}>
                <Empty text="No products found for this category." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "orange" | "green" | "red";
}) {
  const toneClass =
    tone === "orange"
      ? "bg-orange-50 text-orange-700"
      : tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "red"
      ? "bg-red-50 text-red-700"
      : "bg-slate-50 text-slate-700";

  return (
    <div className="rounded-3xl bg-white border shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500 font-semibold">{label}</div>
          <div className="mt-2 text-2xl font-black text-gray-950">{value}</div>
        </div>

        <div className={`h-11 w-11 rounded-2xl grid place-items-center ${toneClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white border shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-2xl bg-orange-50 text-orange-600 grid place-items-center">
          {icon}
        </div>
        <h2 className="text-lg font-black">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border p-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="font-black text-gray-900">{value}</div>
    </div>
  );
}

function InsightBox({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div className="rounded-3xl bg-orange-50 border border-orange-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-2xl bg-white text-orange-600 grid place-items-center">
          {icon}
        </div>
        <h3 className="font-black text-orange-950">{title}</h3>
      </div>

      <ul className="space-y-2 text-sm text-orange-900">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StockBadge({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();

  const cls =
    s === "IN_STOCK"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "LIMITED_STOCK"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : s === "LOW_STOCK"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-black ${cls}`}>
      {s || "UNKNOWN"}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = String(priority || "").toUpperCase();

  const cls =
    p === "HIGH"
      ? "bg-red-50 text-red-700 border-red-200"
      : p === "MEDIUM"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-black ${cls}`}>
      {p || "LOW"}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left p-3 whitespace-nowrap">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="p-3 align-top whitespace-nowrap">{children}</td>;
}

function Empty({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-gray-500">{text}</div>;
}
