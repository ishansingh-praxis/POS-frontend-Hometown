import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/pos-data";
import {
  getProductsApi,
  createProductApi,
  updateProductApi,
  setProductStatusApi,
  type ApiProductDoc,
} from "@/services/productService";
import {
  Search, Plus, Pencil, X, Barcode as BarcodeIcon, Package,
  Truck, Wrench, Power, Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Status = "ACTIVE" | "INACTIVE" | "DISCONTINUED";

type Drawer = { mode: "create" } | { mode: "edit"; product: ApiProductDoc } | null;

const BLANK: ApiProductDoc = {
  _id: "", sku: "", articleNo: "", barcode: "", productName: "",
  brand: "", lob: "", mercCategory: "", category: "",
  mrp: 0, sellingPrice: 0, gstPercent: 18, hsnCode: "",
  warranty: "", returnWindowDays: 7, installationRequired: false, deliveryRequired: true,
  status: "ACTIVE",
};

function Catalogue() {
  const [list, setList] = useState<ApiProductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [lob, setLob] = useState("All");
  const [status, setStatus] = useState<Status | "All">("All");
  const [drawer, setDrawer] = useState<Drawer>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProductsApi({ limit: 500 });
      setList(res.items);
    } catch (err: any) {
      toast.error(err.message || "Failed to load catalogue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const lobOptions = useMemo(
    () => ["All", ...Array.from(new Set(list.map((p) => p.lob).filter(Boolean) as string[])).sort()],
    [list],
  );

  const filtered = useMemo(() => list.filter((p) =>
    (lob === "All" || p.lob === lob) &&
    (status === "All" || p.status === status) &&
    (q.trim() === "" || `${p.productName} ${p.sku} ${p.barcode || ""} ${p.brand || ""}`.toLowerCase().includes(q.toLowerCase()))
  ), [list, q, lob, status]);

  const counts = useMemo(() => ({
    total: list.length,
    active: list.filter((p) => p.status === "ACTIVE").length,
  }), [list]);

  const save = async (p: ApiProductDoc, mode: "create" | "edit") => {
    try {
      if (mode === "create") {
        await createProductApi(p);
        toast.success("Product created");
      } else {
        await updateProductApi(p._id || p.sku, p);
        toast.success("Product updated");
      }
      setDrawer(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    }
  };

  const toggleStatus = async (p: ApiProductDoc) => {
    try {
      const next = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await setProductStatusApi(p._id || p.sku, next);
      toast.success(`Product ${next === "ACTIVE" ? "enabled" : "disabled"}`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Status update failed");
    }
  };

  return (
    <AppShell
      allow={["admin", "manager"]}
      title="Product Catalogue"
      subtitle={`${counts.total} SKUs · ${counts.active} active — SAP ATP product master`}
      actions={
        <button onClick={() => setDrawer({ mode: "create" })} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add product
        </button>
      }
    >
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU, barcode, brand…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <select value={lob} onChange={(e) => setLob(e.target.value)} className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input">
            {lobOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status | "All")} className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input">
            <option value="All">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Product</th>
                <th className="text-left font-medium px-3 py-2.5">Category</th>
                <th className="text-left font-medium px-3 py-2.5">HSN · GST</th>
                <th className="text-right font-medium px-3 py-2.5">MRP</th>
                <th className="text-right font-medium px-3 py-2.5">Selling</th>
                <th className="text-left font-medium px-3 py-2.5">Flags</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="text-right font-medium px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">No products match these filters.</td></tr>
              )}
              {!loading && filtered.map((p) => (
                <tr key={p._id || p.sku} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="font-medium leading-tight">{p.productName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
                      <span>{p.sku}</span><BarcodeIcon className="h-3 w-3" /><span>{p.barcode || p.articleNo}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div>{p.mercCategory || p.category}</div>
                    <div className="text-muted-foreground">{p.lob} · {p.brand}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div className="font-mono">{p.hsnCode}</div>
                    <div className="text-muted-foreground">{p.gstPercent}% GST</div>
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-muted-foreground line-through">{formatINR(p.mrp || 0)}</td>
                  <td className="px-3 py-3 text-right font-medium">{formatINR(p.sellingPrice || 0)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {p.deliveryRequired && <Truck className="h-3.5 w-3.5" />}
                      {p.installationRequired && <Wrench className="h-3.5 w-3.5" />}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      p.status === "ACTIVE" ? "bg-success/15 text-success" :
                      p.status === "INACTIVE" ? "bg-muted text-muted-foreground" :
                      "bg-destructive/15 text-destructive"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setDrawer({ mode: "edit", product: p })} className="text-xs text-primary hover:underline mr-3 inline-flex items-center gap-1">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button onClick={() => toggleStatus(p)} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
                      <Power className="h-3 w-3" /> {p.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawer && (
        <ProductDrawer
          initial={drawer.mode === "create" ? BLANK : drawer.product}
          mode={drawer.mode}
          onClose={() => setDrawer(null)}
          onSave={(p) => save(p, drawer.mode)}
        />
      )}
    </AppShell>
  );
}

function ProductDrawer({ initial, mode, onClose, onSave }: {
  initial: ApiProductDoc; mode: "create" | "edit"; onClose: () => void; onSave: (p: ApiProductDoc) => void;
}) {
  const [form, setForm] = useState<ApiProductDoc>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ApiProductDoc>(k: K, v: ApiProductDoc[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.productName.trim()) {
      setError("SKU and product name are required."); return;
    }
    if (Number(form.sellingPrice) <= 0 || Number(form.mrp) <= 0) { setError("MRP and selling price must be > 0"); return; }
    setSaving(true);
    setError(null);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">{mode === "create" ? "Add product" : `Edit ${initial.productName}`}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pricing and tax here drive every bill across stores.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="p-6 grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2"><Field label="Product name *" value={form.productName} onChange={(v) => set("productName", v)} /></div>
          <Field label="Brand" value={form.brand ?? ""} onChange={(v) => set("brand", v)} />
          <Field label="SKU *" value={form.sku} onChange={(v) => set("sku", v.toUpperCase())} mono disabled={mode === "edit"} />
          <Field label="Article No." value={form.articleNo ?? ""} onChange={(v) => set("articleNo", v)} mono />
          <Field label="Barcode" value={form.barcode ?? ""} onChange={(v) => set("barcode", v)} mono />

          <Field label="LOB" value={form.lob ?? ""} onChange={(v) => set("lob", v)} placeholder="e.g. LIVING" />
          <Field label="Merc. Category" value={form.mercCategory ?? ""} onChange={(v) => set("mercCategory", v)} placeholder="e.g. Three Seater Sofa" />
          <Select label="Status" value={form.status} onChange={(v) => set("status", v as Status)} options={["ACTIVE", "INACTIVE", "DISCONTINUED"]} />

          <Field label="Material" value={form.material ?? ""} onChange={(v) => set("material", v)} />
          <Field label="Color" value={form.color ?? ""} onChange={(v) => set("color", v)} />
          <Field label="Size" value={form.size ?? ""} onChange={(v) => set("size", v)} />

          <Field label="MRP (₹) *" value={String(form.mrp ?? 0)} onChange={(v) => set("mrp", Number(v) || 0)} type="number" />
          <Field label="Selling price (₹) *" value={String(form.sellingPrice ?? 0)} onChange={(v) => set("sellingPrice", Number(v) || 0)} type="number" />
          <Field label="GST %" value={String(form.gstPercent ?? 18)} onChange={(v) => set("gstPercent", Number(v) || 0)} type="number" />
          <Field label="HSN code" value={form.hsnCode ?? ""} onChange={(v) => set("hsnCode", v)} mono />
          <Field label="Warranty" value={form.warranty ?? ""} onChange={(v) => set("warranty", v)} placeholder="e.g. 12 months" />
          <Field label="Return window (days)" value={String(form.returnWindowDays ?? 7)} onChange={(v) => set("returnWindowDays", Number(v) || 0)} type="number" />

          <div className="flex items-end gap-4 pb-1">
            <Check label="Delivery required" value={!!form.deliveryRequired} onChange={(v) => set("deliveryRequired", v)} />
            <Check label="Installation required" value={!!form.installationRequired} onChange={(v) => set("installationRequired", v)} />
          </div>

          {error && (
            <div className="sm:col-span-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="sm:col-span-3 flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> Changes apply network-wide as soon as you save.
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted">Cancel</button>
              <button type="submit" disabled={saving} className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, mono, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; mono?: boolean; disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={`mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-60 ${mono ? "font-mono" : ""}`} />
    </label>
  );
}
function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="text-xs flex items-center gap-1.5 cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default Catalogue;
