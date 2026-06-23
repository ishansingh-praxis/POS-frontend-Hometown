import { AppShell } from "@/components/AppShell";
import { LifeBuoy, AlertCircle, CheckCircle2, Clock, MonitorSmartphone } from "lucide-react";


const kpis = [
  { label: "Open Tickets", value: "14", icon: AlertCircle, tone: "bg-destructive/15 text-destructive" },
  { label: "In Progress", value: "9", icon: Clock, tone: "bg-warning/20 text-warning-foreground" },
  { label: "Resolved Today", value: "31", icon: CheckCircle2, tone: "bg-success/15 text-success" },
  { label: "Avg Response", value: "11 min", icon: LifeBuoy, tone: "bg-primary/15 text-primary" },
];

const tickets = [
  { id: "T-2403", store: "Indiranagar", title: "Receipt printer not detected on Counter 2", priority: "High", age: "23 min", agent: "Neha V." },
  { id: "T-2402", store: "Gwalior",     title: "UPI payment stuck in pending for 5 mins", priority: "High", age: "41 min", agent: "Unassigned" },
  { id: "T-2401", store: "Saket",       title: "Barcode scanner reading wrong SKU prefix", priority: "Medium", age: "1 h",  agent: "Neha V." },
  { id: "T-2400", store: "LBS Marg",    title: "Cashier locked out after 3 failed logins", priority: "Medium", age: "2 h",  agent: "Auto-resolve" },
  { id: "T-2399", store: "Indiranagar", title: "GST printing as 0% on tax invoice", priority: "Critical", age: "3 h", agent: "Escalated" },
];

function Support() {
  return (
    <AppShell
      allow={["admin"]}
      title="Support Desk"
      subtitle="POS terminal & device issues across all stores"
      actions={
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          <MonitorSmartphone className="h-3.5 w-3.5" /> 118 devices online
        </span>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className={`h-9 w-9 rounded-lg grid place-items-center ${k.tone}`}><k.icon className="h-4 w-4" /></div>
            <div className="mt-4 font-display text-2xl">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg">Active Tickets</h2>
          <p className="text-xs text-muted-foreground">Sorted by priority and age</p>
        </div>
        <div className="divide-y divide-border">
          {tickets.map((t) => (
            <div key={t.id} className="p-4 flex items-start gap-4">
              <div className={`h-9 w-9 rounded-lg grid place-items-center ${
                t.priority === "Critical" ? "bg-destructive/15 text-destructive" :
                t.priority === "High" ? "bg-warning/20 text-warning-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.store}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    t.priority === "Critical" ? "bg-destructive/15 text-destructive" :
                    t.priority === "High" ? "bg-warning/20 text-warning-foreground" :
                    "bg-secondary/15 text-secondary"
                  }`}>{t.priority}</span>
                </div>
                <div className="text-sm mt-1">{t.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Assigned: {t.agent} · {t.age} ago</div>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted">Open</button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default Support;
