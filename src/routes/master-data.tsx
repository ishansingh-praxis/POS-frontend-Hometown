import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import {
  Package, FolderTree, Building2, Receipt, Hash, CreditCard, Undo2, Percent,
  Users, ListChecks, RefreshCcw, Database, Search,
} from "lucide-react";


type Row = { code: string; name: string; meta?: string; status?: "Active" | "Inactive" };
type Entity = {
  key: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }>;
  columns: string[]; rows: Row[];
};

const ENTITIES: Entity[] = [
  {
    key: "products", title: "Products", desc: "SKU master — name, brand, HSN, GST",
    icon: Package, columns: ["SKU", "Name", "Brand · HSN", "Status"],
    rows: [
      { code: "HT-SF-001", name: "Westwood 3-Seater Sofa", meta: "HomeTown · 9401", status: "Active" },
      { code: "HT-BD-033", name: "Aspen King Storage Bed", meta: "HomeTown · 9403", status: "Active" },
      { code: "HT-LT-011", name: "Lumen Pendant Light", meta: "Lucent · 9405", status: "Active" },
      { code: "HT-MK-001", name: "Modular Kitchen — Unit A", meta: "HomeTown · 9403", status: "Active" },
    ],
  },
  {
    key: "categories", title: "Categories", desc: "Main category structure",
    icon: FolderTree, columns: ["Code", "Name", "Parent", "Status"],
    rows: [
      { code: "CAT-FURN", name: "Furniture", meta: "—", status: "Active" },
      { code: "CAT-DECO", name: "Home Decor", meta: "—", status: "Active" },
      { code: "CAT-KITC", name: "Kitchen & Appliances", meta: "—", status: "Active" },
      { code: "CAT-FURN-LIV", name: "Living Room Furniture", meta: "Furniture", status: "Active" },
      { code: "CAT-FURN-BED", name: "Bedroom Furniture", meta: "Furniture", status: "Active" },
    ],
  },
  {
    key: "subcategories", title: "Subcategories", desc: "Leaf-level browsing",
    icon: FolderTree, columns: ["Code", "Name", "Parent", "Status"],
    rows: [
      { code: "SC-SOFA", name: "Sofas", meta: "Living Room", status: "Active" },
      { code: "SC-REC", name: "Recliners", meta: "Living Room", status: "Active" },
      { code: "SC-DIN", name: "Dining Tables", meta: "Dining & Kitchen", status: "Active" },
      { code: "SC-WRD", name: "Wardrobes", meta: "Bedroom", status: "Active" },
    ],
  },
  {
    key: "stores", title: "Stores", desc: "All HomeTown locations",
    icon: Building2, columns: ["Code", "Name", "GSTIN", "Status"],
    rows: [
      { code: "BLR-IND", name: "Indiranagar Flagship", meta: "29AAACH1234F1Z5", status: "Active" },
      { code: "DEL-SKT", name: "Saket Select", meta: "07AAACH1234F1Z3", status: "Active" },
      { code: "MUM-LBS", name: "LBS Marg Megastore", meta: "27AAACH1234F1Z7", status: "Active" },
      { code: "GWL-MAIN", name: "Gwalior Main Road", meta: "23AAACH1234F1Z1", status: "Active" },
    ],
  },
  {
    key: "taxes", title: "Tax Rates", desc: "GST slabs used on invoices",
    icon: Receipt, columns: ["Code", "Label", "Rate", "Status"],
    rows: [
      { code: "GST-0", name: "Exempt", meta: "0%", status: "Active" },
      { code: "GST-5", name: "GST 5%", meta: "5%", status: "Active" },
      { code: "GST-12", name: "GST 12%", meta: "12%", status: "Active" },
      { code: "GST-18", name: "GST 18%", meta: "18%", status: "Active" },
      { code: "GST-28", name: "GST 28%", meta: "28%", status: "Active" },
    ],
  },
  {
    key: "hsn", title: "HSN Codes", desc: "Harmonised codes for furniture & décor",
    icon: Hash, columns: ["HSN", "Description", "Default GST", "Status"],
    rows: [
      { code: "9401", name: "Seats & sofas", meta: "18%", status: "Active" },
      { code: "9403", name: "Furniture (other)", meta: "18%", status: "Active" },
      { code: "9405", name: "Lamps & lighting", meta: "18%", status: "Active" },
      { code: "5702", name: "Carpets — woven", meta: "12%", status: "Active" },
      { code: "6303", name: "Curtains & interior blinds", meta: "12%", status: "Active" },
    ],
  },
  {
    key: "payments", title: "Payment Modes", desc: "Modes enabled at counter",
    icon: CreditCard, columns: ["Code", "Mode", "Gateway", "Status"],
    rows: [
      { code: "PM-CASH", name: "Cash", meta: "—", status: "Active" },
      { code: "PM-UPI", name: "UPI", meta: "Razorpay", status: "Active" },
      { code: "PM-CARD", name: "Credit / Debit card", meta: "PineLabs", status: "Active" },
      { code: "PM-EMI", name: "EMI", meta: "Bajaj Finserv", status: "Active" },
      { code: "PM-FIN", name: "Finance", meta: "HDFC", status: "Active" },
      { code: "PM-GC", name: "Gift card", meta: "Internal", status: "Active" },
    ],
  },
  {
    key: "returns", title: "Return Reasons", desc: "Standard reason codes",
    icon: Undo2, columns: ["Code", "Reason", "Refund eligible", "Status"],
    rows: [
      { code: "RR-DMG", name: "Damaged on arrival", meta: "Yes", status: "Active" },
      { code: "RR-SIZ", name: "Size mismatch", meta: "Yes (exchange)", status: "Active" },
      { code: "RR-COL", name: "Colour mismatch", meta: "Yes (exchange)", status: "Active" },
      { code: "RR-LAT", name: "Late delivery", meta: "Yes", status: "Active" },
      { code: "RR-CHG", name: "Customer changed mind", meta: "Store credit", status: "Active" },
    ],
  },
  {
    key: "discounts", title: "Discount Types", desc: "Scheme master",
    icon: Percent, columns: ["Code", "Type", "Approval", "Status"],
    rows: [
      { code: "DT-PROD", name: "Product offer", meta: "Auto", status: "Active" },
      { code: "DT-COUP", name: "Coupon", meta: "Auto", status: "Active" },
      { code: "DT-FEST", name: "Festival offer", meta: "Auto", status: "Active" },
      { code: "DT-BANK", name: "Bank / EMI offer", meta: "Auto", status: "Active" },
      { code: "DT-MGR", name: "Manager discretion", meta: "Manager PIN", status: "Active" },
    ],
  },
  {
    key: "customers", title: "Customer Types", desc: "Segmentation for pricing & GST",
    icon: Users, columns: ["Code", "Type", "Notes", "Status"],
    rows: [
      { code: "CT-WLK", name: "Walk-in", meta: "B2C — phone optional", status: "Active" },
      { code: "CT-REG", name: "Registered", meta: "B2C — loyalty enrolled", status: "Active" },
      { code: "CT-CORP", name: "Corporate", meta: "B2B — GSTIN required", status: "Active" },
      { code: "CT-INTR", name: "Interior designer", meta: "Trade pricing", status: "Active" },
    ],
  },
  {
    key: "orderstatus", title: "Order Statuses", desc: "State machine for orders",
    icon: ListChecks, columns: ["Code", "Status", "Next", "Status"],
    rows: [
      { code: "OS-CRT", name: "Created", meta: "→ Partially paid / Paid", status: "Active" },
      { code: "OS-PAR", name: "Partially paid", meta: "→ Paid", status: "Active" },
      { code: "OS-PAID", name: "Paid", meta: "→ Confirmed", status: "Active" },
      { code: "OS-CNF", name: "Confirmed", meta: "→ Packed", status: "Active" },
      { code: "OS-PKD", name: "Packed", meta: "→ Ready for delivery", status: "Active" },
      { code: "OS-RFD", name: "Ready for delivery", meta: "→ Delivered", status: "Active" },
      { code: "OS-DLV", name: "Delivered", meta: "Terminal", status: "Active" },
    ],
  },
  {
    key: "sapmap", title: "SAP Mapping Codes", desc: "POS → SAP S/4 HANA crosswalk",
    icon: RefreshCcw, columns: ["POS Code", "Maps to", "SAP Field", "Status"],
    rows: [
      { code: "BLR-IND", name: "Plant 1001 / Storage Loc 0001", meta: "WERKS / LGORT", status: "Active" },
      { code: "DEL-SKT", name: "Plant 1002 / Storage Loc 0001", meta: "WERKS / LGORT", status: "Active" },
      { code: "PM-UPI", name: "GL 411002 — UPI Receivable", meta: "HKONT", status: "Active" },
      { code: "PM-CARD", name: "GL 411003 — Card Receivable", meta: "HKONT", status: "Active" },
      { code: "GST-18", name: "Tax code A8 — Output 18%", meta: "MWSKZ", status: "Active" },
    ],
  },
];

function MasterData() {
  const [active, setActive] = useState(ENTITIES[0].key);
  const [q, setQ] = useState("");
  const entity = ENTITIES.find((e) => e.key === active)!;
  const rows = entity.rows.filter((r) =>
    q === "" || [r.code, r.name, r.meta].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell allow={["admin"]}
      title="Master Data" subtitle="Single source of truth — products, categories, taxes, HSN, payment modes, SAP mappings"
    >
      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] mb-5 flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-secondary/15 text-secondary grid place-items-center"><Database className="h-4 w-4" /></div>
        <div>
          <div className="text-sm font-medium">Why master data matters</div>
          <p className="text-xs text-muted-foreground">Clean master data keeps the entire POS accurate. If product, GST, store, or payment data is wrong, every invoice, report, and SAP posting downstream becomes wrong.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px,1fr] gap-6">
        <aside className="space-y-1">
          {ENTITIES.map((e) => (
            <button key={e.key} onClick={() => { setActive(e.key); setQ(""); }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-left transition ${active === e.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <span className="flex items-center gap-2"><e.icon className="h-4 w-4" /> {e.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active === e.key ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"}`}>{e.rows.length}</span>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-lg flex items-center gap-2"><entity.icon className="h-4 w-4 text-primary" /> {entity.title}</h2>
              <p className="text-xs text-muted-foreground">{entity.desc}</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${entity.title.toLowerCase()}…`}
                className="pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm w-64" />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr>
                {entity.columns.map((c) => (
                  <th key={c} className="text-left font-medium px-5 py-2.5">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-t border-border/60">
                  <td className="px-5 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-5 py-3">{r.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.meta}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "Active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No matches.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}

export default MasterData;
