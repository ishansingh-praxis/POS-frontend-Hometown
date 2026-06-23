import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/pos-data";
import {
  Globe, Smartphone, ShoppingBag, MessageCircle, Phone, Share2,
  ArrowRightCircle, CheckCircle2, AlertCircle, Search, Package, MapPin, RefreshCcw,
} from "lucide-react";


type Source = "Website" | "Mobile app" | "Marketplace" | "WhatsApp" | "Call center" | "Social";
type SyncStatus = "New" | "Reserved" | "Payment verified" | "Invoiced" | "Allocated" | "Dispatched" | "Cancelled";

type OnlineOrder = {
  id: string;
  source: Source;
  marketplace?: string;
  customer: string;
  phone: string;
  city: string;
  items: number;
  itemSummary: string;
  total: number;
  paid: boolean;
  fulfillStore: string;
  storeCode: string;
  status: SyncStatus;
  receivedAt: string;
  sapSynced: boolean;
  notes?: string;
};

const SEED: OnlineOrder[] = [
  { id: "ONL-90121", source: "Website", customer: "Aarav Mehta", phone: "+91 98200 11223", city: "Pune",
    items: 2, itemSummary: "Aspen King Bed + CloudRest Mattress",
    total: 48498, paid: true, fulfillStore: "Indiranagar", storeCode: "BLR-IND",
    status: "Payment verified", receivedAt: "Today 12:10", sapSynced: false },
  { id: "ONL-90120", source: "Mobile app", customer: "Riya Kapoor", phone: "+91 88102 11400", city: "Mumbai",
    items: 3, itemSummary: "Vases Set ×2 + Lumen Pendant",
    total: 9197, paid: true, fulfillStore: "LBS Marg", storeCode: "MUM-LBS",
    status: "Invoiced", receivedAt: "Today 11:42", sapSynced: true },
  { id: "ONL-MP-44219", source: "Marketplace", marketplace: "Amazon", customer: "Suresh G", phone: "+91 99000 11200", city: "Hyderabad",
    items: 1, itemSummary: "Linen Blackout Curtains (Pair)",
    total: 2499, paid: true, fulfillStore: "Banjara Hills", storeCode: "HYD-BJR",
    status: "New", receivedAt: "Today 10:25", sapSynced: false,
    notes: "Awaiting payment verification from Amazon settlement." },
  { id: "ONL-WA-7821", source: "WhatsApp", customer: "Designer Studio Co", phone: "+91 90876 54321", city: "Bengaluru",
    items: 4, itemSummary: "Jute Rug + Decor bundle",
    total: 14897, paid: false, fulfillStore: "Indiranagar", storeCode: "BLR-IND",
    status: "Reserved", receivedAt: "Today 09:50", sapSynced: false,
    notes: "Customer to pay on store visit. Stock reserved 24h." },
  { id: "ONL-CC-3309", source: "Call center", customer: "Saraswati Furnishings", phone: "+91 80012 33445", city: "Mumbai",
    items: 18, itemSummary: "Modular Kitchen + Wardrobes bulk",
    total: 624000, paid: true, fulfillStore: "LBS Marg", storeCode: "MUM-LBS",
    status: "Allocated", receivedAt: "Yesterday 18:11", sapSynced: true,
    notes: "B2B order — delivery scheduled 25-Jun via Bhiwandi WH." },
  { id: "ONL-MP-44188", source: "Marketplace", marketplace: "Flipkart", customer: "Vivek J", phone: "+91 96000 22288", city: "Chennai",
    items: 1, itemSummary: "Bistro Round Coffee Table",
    total: 8499, paid: true, fulfillStore: "LBS Marg", storeCode: "MUM-LBS",
    status: "Dispatched", receivedAt: "Yesterday 14:00", sapSynced: true },
  { id: "ONL-SC-2240", source: "Social", marketplace: "Instagram", customer: "Tanvi N", phone: "+91 99320 11122", city: "Delhi",
    items: 2, itemSummary: "Candle holders bundle",
    total: 3299, paid: false, fulfillStore: "Saket", storeCode: "DEL-SKT",
    status: "Cancelled", receivedAt: "Yesterday 11:30", sapSynced: false,
    notes: "Customer cancelled within 1h." },
];

const SOURCE_ICON: Record<Source, React.ReactNode> = {
  Website: <Globe className="h-3.5 w-3.5" />,
  "Mobile app": <Smartphone className="h-3.5 w-3.5" />,
  Marketplace: <ShoppingBag className="h-3.5 w-3.5" />,
  WhatsApp: <MessageCircle className="h-3.5 w-3.5" />,
  "Call center": <Phone className="h-3.5 w-3.5" />,
  Social: <Share2 className="h-3.5 w-3.5" />,
};

function Online() {
  const [list, setList] = useState<OnlineOrder[]>(SEED);
  const [q, setQ] = useState("");
  const [source, setSource] = useState<Source | "All">("All");
  const [status, setStatus] = useState<SyncStatus | "All">("All");

  const filtered = useMemo(() => list.filter((o) =>
    (source === "All" || o.source === source) &&
    (status === "All" || o.status === status) &&
    (q.trim() === "" || `${o.id} ${o.customer} ${o.phone} ${o.city}`.toLowerCase().includes(q.toLowerCase()))
  ), [list, q, source, status]);

  const counts = useMemo(() => {
    const c = { total: list.length, paid: 0, unpaid: 0, sapPending: 0, revenue: 0 };
    list.forEach((o) => { if (o.paid) c.paid += 1; else c.unpaid += 1; if (!o.sapSynced) c.sapPending += 1; if (o.status !== "Cancelled") c.revenue += o.total; });
    return c;
  }, [list]);

  const advance = (o: OnlineOrder) => {
    const flow: SyncStatus[] = ["New", "Reserved", "Payment verified", "Invoiced", "Allocated", "Dispatched"];
    const i = flow.indexOf(o.status);
    const next = i === -1 || i === flow.length - 1 ? o.status : flow[i + 1];
    setList((prev) => prev.map((x) => x.id === o.id ? { ...x, status: next } : x));
  };

  const syncSAP = (o: OnlineOrder) => {
    setList((prev) => prev.map((x) => x.id === o.id ? { ...x, sapSynced: true } : x));
  };

  return (
    <AppShell
      allow={["manager", "admin"]}
      title="Online Sales"
      subtitle="Website, app, marketplace, WhatsApp and call-center orders — unified with store stock & invoicing"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Kpi label="Online orders today" value={String(counts.total)} icon={<Globe className="h-4 w-4" />} />
        <Kpi label="Payment verified" value={String(counts.paid)} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <Kpi label="Awaiting payment" value={String(counts.unpaid)} icon={<AlertCircle className="h-4 w-4" />} tone="warning" />
        <Kpi label="Pending SAP sync" value={String(counts.sapPending)} icon={<RefreshCcw className="h-4 w-4" />} tone="destructive" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, customer, phone, city…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          <select value={source} onChange={(e) => setSource(e.target.value as Source | "All")} className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input">
            <option value="All">All sources</option>
            {(Object.keys(SOURCE_ICON) as Source[]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as SyncStatus | "All")} className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input">
            <option value="All">All statuses</option>
            {["New", "Reserved", "Payment verified", "Invoiced", "Allocated", "Dispatched", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ml-auto text-[11px] text-muted-foreground">Revenue (live): <span className="font-medium text-foreground">{formatINR(counts.revenue)}</span></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Order</th>
                <th className="text-left font-medium px-3 py-2.5">Source</th>
                <th className="text-left font-medium px-3 py-2.5">Customer</th>
                <th className="text-left font-medium px-3 py-2.5">Items</th>
                <th className="text-left font-medium px-3 py-2.5">Fulfil store</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="text-left font-medium px-3 py-2.5">SAP</th>
                <th className="text-right font-medium px-3 py-2.5">Amount</th>
                <th className="text-right font-medium px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">No online orders match.</td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs">{o.id}</div>
                    <div className="text-[10px] text-muted-foreground">{o.receivedAt}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted">
                      {SOURCE_ICON[o.source]} {o.source}
                    </span>
                    {o.marketplace && <div className="text-[10px] text-muted-foreground mt-0.5">{o.marketplace}</div>}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div>{o.customer}</div>
                    <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{o.city}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div className="font-medium">{o.items} item{o.items > 1 ? "s" : ""}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{o.itemSummary}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">{o.fulfillStore}<div className="text-[10px] text-muted-foreground font-mono">{o.storeCode}</div></td>
                  <td className="px-3 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      o.status === "Cancelled" ? "bg-destructive/15 text-destructive" :
                      o.status === "Dispatched" || o.status === "Invoiced" ? "bg-success/15 text-success" :
                      o.status === "New" || o.status === "Reserved" ? "bg-warning/20 text-warning-foreground" :
                      "bg-primary/15 text-primary"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {o.sapSynced ? (
                      <span className="text-success inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />synced</span>
                    ) : (
                      <button onClick={() => syncSAP(o)} className="text-primary hover:underline inline-flex items-center gap-1"><RefreshCcw className="h-3 w-3" />sync</button>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{formatINR(o.total)}<div className="text-[10px] text-muted-foreground">{o.paid ? "Paid" : "Unpaid"}</div></td>
                  <td className="px-5 py-3 text-right">
                    {o.status !== "Cancelled" && o.status !== "Dispatched" && (
                      <button onClick={() => advance(o)} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                        <ArrowRightCircle className="h-3 w-3" /> Advance
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <Tile icon={<Package className="h-4 w-4" />} title="Stock reservation"
          body="Online orders auto-reserve stock at the assigned store. Reservation auto-releases after 24h if payment fails." />
        <Tile icon={<RefreshCcw className="h-4 w-4" />} title="SAP / accounting sync"
          body="Verified online sales push to SAP daily 22:30. Marketplace settlements reconcile in Accounts → Settlements." />
        <Tile icon={<ShoppingBag className="h-4 w-4" />} title="Online returns"
          body="Online returns inherit the original invoice and flow through the same Returns module — pickup scheduled from the customer city." />
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: "success" | "warning" | "destructive" }) {
  const cls = tone === "success" ? "border-success/20" : tone === "warning" ? "border-warning/30" : tone === "destructive" ? "border-destructive/20" : "border-border";
  return (
    <div className={`rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)] ${cls}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
function Tile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="inline-flex items-center gap-1.5 text-sm font-medium">{icon}{title}</div>
      <p className="text-xs text-muted-foreground mt-1.5">{body}</p>
    </div>
  );
}

export default Online;
