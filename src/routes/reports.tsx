import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { Download, FileText, Store, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";


type Report = { name: string; desc: string; period: string };

const storeReports: Report[] = [
  { name: "Daily Sales", desc: "Bills, items, ticket size, payment split", period: "Daily" },
  { name: "Monthly Sales", desc: "Trend, target vs achieved, GST", period: "Monthly" },
  { name: "Product-wise Sales", desc: "SKU-level units & revenue", period: "Daily" },
  { name: "Category-wise Sales", desc: "Furniture, Décor, Kitchen, Furnishing…", period: "Daily" },
  { name: "Payment-wise Sales", desc: "Cash, UPI, Card, EMI, Finance split", period: "Daily" },
  { name: "Online vs Offline", desc: "Channel split with fulfilment SLA", period: "Weekly" },
  { name: "Returns Report", desc: "Reason-coded returns, net impact", period: "Weekly" },
  { name: "Refunds Report", desc: "Mode-wise refunds & SLA breaches", period: "Weekly" },
  { name: "Low-Stock Report", desc: "SKUs below reorder threshold", period: "Live" },
  { name: "Inventory Report", desc: "On-hand by bucket: Available / Reserved / Display / Damaged", period: "Live" },
];

const adminReports: Report[] = [
  { name: "All-Store Sales", desc: "Consolidated revenue across India", period: "Daily" },
  { name: "Region-wise Sales", desc: "South / North / West / East splits", period: "Weekly" },
  { name: "Store-wise Performance", desc: "Sales / sqft, ticket size, conversion", period: "Monthly" },
  { name: "Top-Selling Products", desc: "Top 50 SKUs across stores", period: "Weekly" },
  { name: "Slow-Moving Products", desc: "SKUs with > 60 days cover", period: "Monthly" },
  { name: "Discount Report", desc: "Approver, scheme, margin impact", period: "Weekly" },
  { name: "GST Report (GSTR-1/3B)", desc: "Filing-ready summaries", period: "Monthly" },
  { name: "Payment Reconciliation", desc: "POS vs gateway vs bank", period: "Daily" },
  { name: "SAP Failed Sync", desc: "Pending, failed, manual-review queue", period: "Daily" },
  { name: "Online Order Report", desc: "Website / App / Marketplace / WhatsApp", period: "Daily" },
];

function Card({ r }: { r: Report }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{r.name}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
        <div className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider">{r.period}</div>
      </div>
      <button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
        <Download className="h-3.5 w-3.5" /> CSV
      </button>
    </div>
  );
}

function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<"store" | "admin">(isAdmin ? "admin" : "store");

  return (
    <AppShell allow={["admin", "manager"]} title="Reports & Analytics" subtitle="Download or schedule to email">
      <div className="inline-flex p-1 rounded-lg bg-muted mb-5">
        <button onClick={() => setTab("store")}
          className={`px-4 py-1.5 rounded-md text-sm inline-flex items-center gap-1.5 ${tab === "store" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
          <Store className="h-3.5 w-3.5" /> Store reports
        </button>
        {isAdmin && (
          <button onClick={() => setTab("admin")}
            className={`px-4 py-1.5 rounded-md text-sm inline-flex items-center gap-1.5 ${tab === "admin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
            <Building2 className="h-3.5 w-3.5" /> Admin reports
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(tab === "store" ? storeReports : adminReports).map((r) => <Card key={r.name} r={r} />)}
      </div>
    </AppShell>
  );
}

export default Reports;
