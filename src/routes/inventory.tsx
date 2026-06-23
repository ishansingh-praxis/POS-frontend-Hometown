import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { getInventoriesApi, adjustInventoryApi, type ApiInventoryRow } from "@/services/inventoryService";
import { formatINR } from "@/lib/pos-data";
import { Search, AlertTriangle, Package, Wrench, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

function Inventory() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [rows, setRows] = useState<ApiInventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeCode, setStoreCode] = useState(!isAdmin ? user?.store || "" : "");

  const [q, setQ] = useState("");
  const [lob, setLob] = useState("All");
  const [lowOnly, setLowOnly] = useState(false);
  const [action, setAction] = useState<ApiInventoryRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getInventoriesApi({ storeCode: storeCode || undefined, limit: 500 });
      setRows(res.items);
    } catch (err: any) {
      toast.error(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, storeCode]);

  const lobOptions = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((r) => r.lob).filter(Boolean) as string[])).sort()],
    [rows],
  );

  const filtered = useMemo(() => rows.filter((r) =>
    (lob === "All" || r.lob === lob) &&
    (!lowOnly || Number(r.atpQty || 0) <= 2) &&
    (q.trim() === "" || `${r.productName} ${r.sku} ${r.articleNo || ""}`.toLowerCase().includes(q.toLowerCase()))
  ), [rows, q, lob, lowOnly]);

  const totals = useMemo(() => filtered.reduce((a, r) => {
    a.atpQty += Number(r.atpQty || 0);
    a.stockQty += Number(r.stockQty || 0);
    a.lowSkus += Number(r.atpQty || 0) <= 2 ? 1 : 0;
    a.outOfStock += r.stockStatus === "OUT_OF_STOCK" ? 1 : 0;
    return a;
  }, { atpQty: 0, stockQty: 0, lowSkus: 0, outOfStock: 0 }), [filtered]);

  return (
    <AppShell
      allow={["manager", "admin"]}
      title="Inventory"
      subtitle="Live SAP ATP stock per store"
      actions={
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          <Package className="h-3.5 w-3.5" /> {filtered.length} SKUs · {totals.atpQty} ATP units
        </span>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total ATP units", value: String(totals.atpQty), tone: "bg-success/15 text-success" },
          { label: "Total stock units", value: String(totals.stockQty), tone: "bg-secondary/15 text-secondary" },
          { label: "Low stock SKUs", value: String(totals.lowSkus), tone: "bg-warning/20 text-warning-foreground" },
          { label: "Out of stock SKUs", value: String(totals.outOfStock), tone: "bg-destructive/15 text-destructive" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className={`h-9 w-9 rounded-lg grid place-items-center ${k.tone}`}><Package className="h-4 w-4" /></div>
            <div className="mt-4 font-display text-2xl">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU, article no…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <select value={lob} onChange={(e) => setLob(e.target.value)} className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input">
            {lobOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          {isAdmin && (
            <input value={storeCode} onChange={(e) => setStoreCode(e.target.value)} placeholder="Store code (blank = all)"
              className="w-44 text-xs px-2.5 py-2 rounded-lg bg-background border border-input" />
          )}
          <label className="text-xs inline-flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
            Low stock only
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Product</th>
                {isAdmin && <th className="text-left font-medium px-3 py-2.5">Store</th>}
                <th className="text-right font-medium px-3 py-2.5">Stock</th>
                <th className="text-right font-medium px-3 py-2.5">ATP</th>
                <th className="text-right font-medium px-3 py-2.5">MAP Value</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="text-right font-medium px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...
                </td></tr>
              )}
              {!loading && filtered.map((r) => (
                <tr key={r._id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="font-medium leading-tight">{r.productName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{r.sku} · {r.mercCategory || r.category} · {r.lob}</div>
                    {Number(r.atpQty || 0) <= 2 && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-warning-foreground bg-warning/15 rounded px-1.5 py-0.5">
                        <AlertTriangle className="h-3 w-3" /> Reorder soon
                      </span>
                    )}
                  </td>
                  {isAdmin && <td className="px-3 py-3 text-xs">{r.storeCode} · {r.storeName}</td>}
                  <td className="px-3 py-3 text-right">{r.stockQty}</td>
                  <td className="px-3 py-3 text-right font-medium">{r.atpQty}</td>
                  <td className="px-3 py-3 text-right">{formatINR(r.mapValue || 0)}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded ${
                      r.stockStatus === "OUT_OF_STOCK" ? "bg-destructive/15 text-destructive" :
                      r.stockStatus === "LOW_STOCK" ? "bg-warning/20 text-warning-foreground" :
                      r.stockStatus === "LIMITED_STOCK" ? "bg-amber-100 text-amber-700" :
                      "bg-success/15 text-success"
                    }`}>{r.stockStatus || "—"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button title="Adjust stock" onClick={() => setAction(r)} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Wrench className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No SKUs match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          Stock reduces automatically on checkout. Data shown is live SAP ATP inventory for this store.
        </div>
      </div>

      {action && <AdjustDrawer row={action} onClose={() => setAction(null)} onAdjusted={() => { setAction(null); load(); }} />}
    </AppShell>
  );
}

function AdjustDrawer({ row, onClose, onAdjusted }: { row: ApiInventoryRow; onClose: () => void; onAdjusted: () => void }) {
  const [atpQty, setAtpQty] = useState(row.atpQty);
  const [isPosEnabled, setIsPosEnabled] = useState(row.isPosEnabled !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await adjustInventoryApi(row._id, { atpQty, isPosEnabled });
      toast.success("Inventory adjusted");
      onAdjusted();
    } catch (err: any) {
      setError(err.message || "Adjust failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg">Adjust stock</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{row.productName} · {row.sku}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">ATP quantity</span>
            <input type="number" min={0} value={atpQty} onChange={(e) => setAtpQty(Number(e.target.value) || 0)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </label>
          <label className="text-xs flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={isPosEnabled} onChange={(e) => setIsPosEnabled(e.target.checked)} />
            Sellable at POS
          </label>
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">{error}</div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="text-sm px-3 py-2 rounded-md border border-border hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="text-sm px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Inventory;
