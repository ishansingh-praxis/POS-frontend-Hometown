import { AppShell } from "@/components/AppShell";
import { stores, formatINR } from "@/lib/pos-data";
import { IndianRupee, ShoppingBag, Globe, Store, RefreshCcw, CheckCircle2 } from "lucide-react";


const kpis = [
  { label: "Today (All stores)", value: "₹19,53,600", sub: "↑ 8.4% vs yesterday", icon: IndianRupee },
  { label: "Orders", value: "138", sub: "92 offline · 46 online", icon: ShoppingBag },
  { label: "Online revenue", value: "₹6,82,400", sub: "35% of total", icon: Globe },
  { label: "Stores live", value: "5 / 5", sub: "All POS terminals online", icon: Store },
];

const topProducts = [
  { name: "Westwood 3-Seater Sofa", units: 14, rev: 601986 },
  { name: "Oakland Queen Bed", units: 9, rev: 323991 },
  { name: "Nordic Arc Floor Lamp", units: 22, rev: 142978 },
  { name: "Hand-Woven Jute Rug 6x4", units: 17, rev: 84983 },
  { name: "Mensa 6-Seater Dining Set", units: 3, rev: 170997 },
];

// Mini chart data
const trend = [42, 55, 48, 67, 73, 61, 82, 78, 91, 84, 95, 102];

function Admin() {
  const max = Math.max(...trend);
  return (
    <AppShell
      allow={["admin"]}
      title="Head Office Dashboard"
      subtitle="HomeTown — All India · Live data refreshed 30s ago"
      actions={
        <button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
          <RefreshCcw className="h-3.5 w-3.5" /> Push to SAP
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <k.icon className="h-4 w-4" />
            </div>
            <div className="mt-4 font-display text-2xl">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
            <div className="text-[11px] text-success mt-2">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg">Revenue — last 12 months</h2>
              <p className="text-xs text-muted-foreground">in ₹ Lakhs · all stores combined</p>
            </div>
            <div className="text-xs text-muted-foreground">FY 25-26</div>
          </div>
          <div className="flex items-end gap-2 h-44">
            {trend.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60"
                  style={{ height: `${(v / max) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg">Store Leaderboard</h2>
          <p className="text-xs text-muted-foreground">Today's sales</p>
          <div className="mt-4 space-y-3">
            {stores.sort((a, b) => b.sales - a.sales).map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="truncate">{s.name}</span>
                  </span>
                  <span className="font-medium">{formatINR(s.sales)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(s.sales / 612900) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="p-5 border-b border-border">
            <h2 className="font-display text-lg">Top Products</h2>
            <p className="text-xs text-muted-foreground">Today across all stores & channels</p>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Product</th>
                <th className="text-right font-medium px-3 py-2.5">Units</th>
                <th className="text-right font-medium px-5 py-2.5">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.name} className="border-t border-border/60">
                  <td className="px-5 py-3">{p.name}</td>
                  <td className="px-3 py-3 text-right">{p.units}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatINR(p.rev)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg">SAP / ERP Sync</h2>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Sales orders", "138 / 138", true],
              ["Invoices", "138 / 138", true],
              ["Inventory movements", "412 / 412", true],
              ["Customer ledger", "27 / 27", true],
              ["GL postings", "queued in 3 min", false],
            ].map(([label, val, ok]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs ${ok ? "text-success" : "text-warning-foreground"}`}>
                  {ok && <CheckCircle2 className="h-3.5 w-3.5" />} {val}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/90">
            View full sync log
          </button>
        </section>
      </div>
    </AppShell>
  );
}

export default Admin;
