import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/pos-data";
import {
  offers as SEED, discountAudit, OFFER_TYPE_LABEL,
  type Offer, type OfferType,
} from "@/lib/offers-data";
import {
  Percent, Tag, Search, Plus, X, ShieldCheck, Calendar, Store as StoreIcon,
} from "lucide-react";


type Drawer = { mode: "create" } | { mode: "edit"; offer: Offer } | null;

const BLANK: Offer = {
  id: "", code: "", name: "", type: "festival",
  discountPct: 10, appliesTo: "All", storeScope: "ALL",
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  approval: "auto", usageCount: 0, status: "active",
};

function Offers() {
  const [list, setList] = useState<Offer[]>(SEED);
  const [q, setQ] = useState("");
  const [type, setType] = useState<OfferType | "All">("All");
  const [status, setStatus] = useState<Offer["status"] | "All">("All");
  const [drawer, setDrawer] = useState<Drawer>(null);

  const filtered = useMemo(() => list.filter((o) =>
    (type === "All" || o.type === type) &&
    (status === "All" || o.status === status) &&
    (q.trim() === "" || `${o.name} ${o.code ?? ""} ${o.appliesTo}`.toLowerCase().includes(q.toLowerCase()))
  ), [list, q, type, status]);

  const kpis = useMemo(() => {
    const active = list.filter((o) => o.status === "active");
    const totalDiscount = discountAudit.reduce((s, d) => s + d.discount, 0);
    return {
      active: active.length,
      coupons: active.filter((o) => o.code && o.type === "coupon").length || active.filter((o) => o.code).length,
      manager: list.filter((o) => o.approval === "manager").length,
      todayDiscount: totalDiscount,
    };
  }, [list]);

  const save = (o: Offer) => {
    setList((prev) => {
      if (!o.id) o = { ...o, id: "of" + (prev.length + 1) };
      const i = prev.findIndex((x) => x.id === o.id);
      if (i === -1) return [o, ...prev];
      const next = [...prev]; next[i] = o; return next;
    });
    setDrawer(null);
  };

  return (
    <AppShell
      allow={["admin", "manager"]}
      title="Discounts & Offers"
      subtitle="Festival, category, coupon, bank & bundle offers with approval workflow"
      actions={
        <button onClick={() => setDrawer({ mode: "create" })} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New offer
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Kpi label="Active offers" value={String(kpis.active)} icon={<Percent className="h-4 w-4" />} />
        <Kpi label="Live coupons" value={String(kpis.coupons)} icon={<Tag className="h-4 w-4" />} />
        <Kpi label="Need approval" value={String(kpis.manager)} icon={<ShieldCheck className="h-4 w-4" />} />
        <Kpi label="Today discounted" value={formatINR(kpis.todayDiscount)} icon={<Percent className="h-4 w-4" />} />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search offer, coupon code, category…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value as OfferType | "All")} className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input">
            <option value="All">All types</option>
            {(Object.keys(OFFER_TYPE_LABEL) as OfferType[]).map((t) => <option key={t} value={t}>{OFFER_TYPE_LABEL[t]}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as Offer["status"] | "All")} className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input">
            <option value="All">All statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Offer</th>
                <th className="text-left font-medium px-3 py-2.5">Type</th>
                <th className="text-left font-medium px-3 py-2.5">Applies to</th>
                <th className="text-left font-medium px-3 py-2.5">Discount</th>
                <th className="text-left font-medium px-3 py-2.5">Stores</th>
                <th className="text-left font-medium px-3 py-2.5">Validity</th>
                <th className="text-left font-medium px-3 py-2.5">Approval</th>
                <th className="text-right font-medium px-3 py-2.5">Usage</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="text-right font-medium px-5 py-2.5">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-sm text-muted-foreground">No offers match these filters.</td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="font-medium leading-tight">{o.name}</div>
                    {o.code && <div className="text-[11px] text-muted-foreground font-mono mt-0.5">CODE · {o.code}</div>}
                  </td>
                  <td className="px-3 py-3 text-xs">{OFFER_TYPE_LABEL[o.type]}</td>
                  <td className="px-3 py-3 text-xs">{o.appliesTo}</td>
                  <td className="px-3 py-3 text-xs">
                    {o.discountPct ? `${o.discountPct}%` : ""}
                    {o.discountFlat ? formatINR(o.discountFlat) : ""}
                    {o.maxDiscount ? <div className="text-muted-foreground">Cap {formatINR(o.maxDiscount)}</div> : null}
                    {o.minBill ? <div className="text-muted-foreground">Min {formatINR(o.minBill)}</div> : null}
                  </td>
                  <td className="px-3 py-3 text-xs">{o.storeScope === "ALL" ? "All stores" : `${o.storeScope.length} stores`}</td>
                  <td className="px-3 py-3 text-xs">
                    <div>{o.validFrom}</div>
                    <div className="text-muted-foreground">→ {o.validTo}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      o.approval === "auto" ? "bg-success/15 text-success" :
                      o.approval === "manager" ? "bg-warning/20 text-warning-foreground" :
                      "bg-destructive/15 text-destructive"
                    }`}>{o.approval}</span>
                  </td>
                  <td className="px-3 py-3 text-right text-xs">
                    {o.usageCount}{o.usageLimit ? ` / ${o.usageLimit}` : ""}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      o.status === "active" ? "bg-success/15 text-success" :
                      o.status === "scheduled" ? "bg-primary/15 text-primary" :
                      o.status === "paused" ? "bg-warning/20 text-warning-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setDrawer({ mode: "edit", offer: o })} className="text-xs text-primary hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg">Discount audit log</h2>
            <p className="text-xs text-muted-foreground">Every applied discount is logged with cashier, store and approver.</p>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Last 24 hours</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Audit ID</th>
              <th className="text-left font-medium px-3 py-2.5">Invoice</th>
              <th className="text-left font-medium px-3 py-2.5">Store</th>
              <th className="text-left font-medium px-3 py-2.5">Offer</th>
              <th className="text-left font-medium px-3 py-2.5">Cashier</th>
              <th className="text-left font-medium px-3 py-2.5">Approver</th>
              <th className="text-right font-medium px-5 py-2.5">Discount</th>
            </tr>
          </thead>
          <tbody>
            {discountAudit.map((d) => (
              <tr key={d.id} className="border-t border-border/60 hover:bg-muted/30">
                <td className="px-5 py-3 font-mono text-xs">{d.id}</td>
                <td className="px-3 py-3 font-mono text-xs">{d.invoice}</td>
                <td className="px-3 py-3 text-xs">{d.store}</td>
                <td className="px-3 py-3 text-xs">{d.offer} <span className="text-muted-foreground">· {OFFER_TYPE_LABEL[d.type]}</span></td>
                <td className="px-3 py-3 text-xs">{d.cashier}</td>
                <td className="px-3 py-3 text-xs">{d.approvedBy ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-5 py-3 text-right font-medium">{formatINR(d.discount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && (
        <OfferDrawer
          initial={drawer.mode === "create" ? BLANK : drawer.offer}
          mode={drawer.mode}
          onClose={() => setDrawer(null)}
          onSave={save}
        />
      )}
    </AppShell>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}

function OfferDrawer({ initial, mode, onClose, onSave }: {
  initial: Offer; mode: "create" | "edit"; onClose: () => void; onSave: (o: Offer) => void;
}) {
  const [form, setForm] = useState<Offer>(initial);
  const set = <K extends keyof Offer>(k: K, v: Offer[K]) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">{mode === "create" ? "Create offer" : `Edit ${initial.name}`}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Discount rules apply at billing across selected stores.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 grid sm:grid-cols-2 gap-4">
          <F label="Offer name *" value={form.name} onChange={(v) => set("name", v)} />
          <F label="Coupon code" value={form.code ?? ""} onChange={(v) => set("code", v.toUpperCase())} mono />
          <S label="Offer type" value={form.type} onChange={(v) => set("type", v as OfferType)} options={Object.keys(OFFER_TYPE_LABEL)} />
          <S label="Approval" value={form.approval} onChange={(v) => set("approval", v as Offer["approval"])} options={["auto", "manager", "admin"]} />
          <F label="Applies to (All / Group / Category / SKU)" value={form.appliesTo} onChange={(v) => set("appliesTo", v)} />
          <F label="Store scope" value={form.storeScope === "ALL" ? "ALL" : form.storeScope.join(",")} onChange={(v) => set("storeScope", v.trim().toUpperCase() === "ALL" ? "ALL" : v.split(",").map((s) => s.trim()))} />
          <F label="Discount %" type="number" value={String(form.discountPct ?? "")} onChange={(v) => set("discountPct", v ? Number(v) : undefined)} />
          <F label="Discount flat (₹)" type="number" value={String(form.discountFlat ?? "")} onChange={(v) => set("discountFlat", v ? Number(v) : undefined)} />
          <F label="Min bill (₹)" type="number" value={String(form.minBill ?? "")} onChange={(v) => set("minBill", v ? Number(v) : undefined)} />
          <F label="Max discount (₹)" type="number" value={String(form.maxDiscount ?? "")} onChange={(v) => set("maxDiscount", v ? Number(v) : undefined)} />
          <F label="Valid from" type="date" value={form.validFrom} onChange={(v) => set("validFrom", v)} />
          <F label="Valid to" type="date" value={form.validTo} onChange={(v) => set("validTo", v)} />
          <F label="Usage limit" type="number" value={String(form.usageLimit ?? "")} onChange={(v) => set("usageLimit", v ? Number(v) : undefined)} />
          <S label="Status" value={form.status} onChange={(v) => set("status", v as Offer["status"])} options={["active", "scheduled", "paused", "expired"]} />
          <label className="sm:col-span-2 block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</span>
            <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </label>
          <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Auto-archives after end date</span>
              <span className="inline-flex items-center gap-1"><StoreIcon className="h-3.5 w-3.5" /> Store-specific allowed</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted">Cancel</button>
              <button type="submit" className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                {mode === "create" ? "Create offer" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = "text", mono }: { label: string; value: string; onChange: (v: string) => void; type?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${mono ? "font-mono" : ""}`} />
    </label>
  );
}
function S({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export default Offers;
