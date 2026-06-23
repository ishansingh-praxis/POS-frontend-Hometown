import { AppShell } from "@/components/AppShell";
import { recentOrders, formatINR } from "@/lib/pos-data";
import { TrendingUp, IndianRupee, ShoppingBag, AlertTriangle, CheckCircle2, Clock } from "lucide-react";


const stats = [
  { label: "Today's Sales", value: "₹4,82,300", change: "+12.4%", icon: IndianRupee, tone: "bg-primary/15 text-primary" },
  { label: "Bills", value: "36", change: "+5", icon: ShoppingBag, tone: "bg-secondary/15 text-secondary" },
  { label: "Avg Bill", value: "₹13,397", change: "+3.1%", icon: TrendingUp, tone: "bg-success/15 text-success" },
  { label: "Pending Approvals", value: "4", change: "2 returns, 2 discounts", icon: AlertTriangle, tone: "bg-warning/20 text-warning-foreground" },
];

const approvals = [
  { type: "Discount", who: "Cashier Ravi", detail: "15% on Aspen King Bed — Sneha Iyer", amount: 7349 },
  { type: "Return", who: "Cashier Anita", detail: "Lumen Pendant Light × 2 — Aarav Mehta", amount: 6598 },
  { type: "Discount", who: "Cashier Vivek", detail: "10% on Westwood Sofa — Walk-in", amount: 4299 },
  { type: "Return", who: "Cashier Ravi", detail: "Terracotta Vase Set — Priya Nair", amount: 1899 },
];

const lowStock = [
  { name: "Mensa 6-Seater Dining Set", stock: 1, reorder: 4 },
  { name: "Cedar 4-Door Wardrobe", stock: 2, reorder: 5 },
  { name: "Aspen King Storage Bed", stock: 2, reorder: 4 },
  { name: "Lyra Fabric Recliner", stock: 3, reorder: 6 },
];

function Manager() {
  return (
    <AppShell
      allow={["manager", "admin"]}
      title="Indiranagar Store"
      subtitle="Monday, 16 June 2026 · Open since 10:00 AM"
      actions={
        <>
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-success/10 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> All systems online
          </span>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div className={`h-9 w-9 rounded-lg grid place-items-center ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">{s.change}</span>
            </div>
            <div className="mt-4 font-display text-2xl">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg">Recent Bills</h2>
              <p className="text-xs text-muted-foreground">Live feed across counters</p>
            </div>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Invoice</th>
                <th className="text-left font-medium px-3 py-2.5">Customer</th>
                <th className="text-left font-medium px-3 py-2.5">Channel</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="text-right font-medium px-5 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-border/60">
                  <td className="px-5 py-3 font-mono text-xs">{o.id}</td>
                  <td className="px-3 py-3">{o.customer}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.channel === "Online" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}>
                      {o.channel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      o.status === "Paid" ? "bg-success/15 text-success" :
                      o.status === "Pending" ? "bg-warning/20 text-warning-foreground" :
                      o.status === "Refunded" ? "bg-destructive/15 text-destructive" :
                      "bg-primary/15 text-primary"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{formatINR(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="p-5 border-b border-border">
            <h2 className="font-display text-lg">Pending Approvals</h2>
            <p className="text-xs text-muted-foreground">Need manager sign-off</p>
          </div>
          <div className="divide-y divide-border">
            {approvals.map((a, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <div className={`h-8 w-8 rounded-lg grid place-items-center ${a.type === "Return" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.type} · {formatINR(a.amount)}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{a.detail}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">by {a.who}</div>
                </div>
                <button className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg">Low Stock Alerts</h2>
            <p className="text-xs text-muted-foreground">Items below reorder level</p>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted">Raise indent</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5">
          {lowStock.map((s) => (
            <div key={s.name} className="rounded-xl border border-warning/30 bg-warning/5 p-4">
              <div className="text-sm font-medium line-clamp-2">{s.name}</div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-display text-warning-foreground">{s.stock}</div>
                  <div className="text-[11px] text-muted-foreground">in stock</div>
                </div>
                <div className="text-xs text-muted-foreground">Reorder at {s.reorder}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default Manager;
