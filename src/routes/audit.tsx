import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import {
  LogIn, FileText, XCircle, Percent, Undo2, Package, Tag, RefreshCcw, UserCog,
  Search, ShieldAlert,
} from "lucide-react";


type Action =
  | "Login" | "Invoice created" | "Order cancelled" | "Discount approved"
  | "Refund processed" | "Inventory adjusted" | "Price changed" | "SAP re-sync" | "Customer edited";

const ICON: Record<Action, React.ComponentType<{ className?: string }>> = {
  Login: LogIn, "Invoice created": FileText, "Order cancelled": XCircle,
  "Discount approved": Percent, "Refund processed": Undo2, "Inventory adjusted": Package,
  "Price changed": Tag, "SAP re-sync": RefreshCcw, "Customer edited": UserCog,
};

const TONE: Record<Action, string> = {
  Login: "bg-muted text-muted-foreground",
  "Invoice created": "bg-primary/15 text-primary",
  "Order cancelled": "bg-destructive/15 text-destructive",
  "Discount approved": "bg-secondary/15 text-secondary",
  "Refund processed": "bg-destructive/15 text-destructive",
  "Inventory adjusted": "bg-warning/20 text-warning-foreground",
  "Price changed": "bg-warning/20 text-warning-foreground",
  "SAP re-sync": "bg-primary/15 text-primary",
  "Customer edited": "bg-muted text-muted-foreground",
};

type Entry = {
  id: string; action: Action; actor: string; role: string;
  store: string; ref?: string; detail: string; ip: string; device: string; at: string;
};

const log: Entry[] = [
  { id: "LOG-44102", action: "Discount approved", actor: "Priya Sharma", role: "Store Manager", store: "BLR-IND", ref: "HT-25612", detail: "Approved 18% on Westwood Sofa for Sneha Iyer (above 15% policy)", ip: "10.42.1.18", device: "POS-BLR-IND-04", at: "Today 14:21" },
  { id: "LOG-44101", action: "Invoice created", actor: "Manish Rao", role: "Cashier", store: "BLR-IND", ref: "HT-25612", detail: "₹64,498 · Split Cash/UPI/Card", ip: "10.42.1.18", device: "POS-BLR-IND-04", at: "Today 14:22" },
  { id: "LOG-44100", action: "Refund processed", actor: "Manish Rao", role: "Cashier", store: "BLR-IND", ref: "PAY-77007", detail: "₹3,299 UPI refund — Lumen Pendant Light damaged", ip: "10.42.1.18", device: "POS-BLR-IND-04", at: "Today 09:42" },
  { id: "LOG-44099", action: "Order cancelled", actor: "Geeta Bansal", role: "Cashier", store: "DEL-SKT", ref: "ORD-25588", detail: "Cancelled HT-25588 — card declined, customer left", ip: "10.51.2.04", device: "POS-DEL-SKT-02", at: "Yesterday 12:14" },
  { id: "LOG-44098", action: "Inventory adjusted", actor: "Vikas Patil", role: "Store Manager", store: "MUM-LBS", detail: "Damaged stock +2 on HT-LT-011 (warehouse drop)", ip: "10.61.3.11", device: "WMS-MUM-LBS", at: "Yesterday 18:30" },
  { id: "LOG-44097", action: "Price changed", actor: "Anuj Kapoor", role: "Admin", store: "ALL", ref: "HT-SF-001", detail: "MRP ₹52,999 → ₹49,999 (Monsoon Sale)", ip: "10.10.0.5", device: "HQ-Admin-Web", at: "Yesterday 11:08" },
  { id: "LOG-44096", action: "SAP re-sync", actor: "Ravi Krishnan", role: "SAP/ERP Admin", store: "ALL", ref: "SYN-90136", detail: "Manual re-sync of failed invoice HT-25608", ip: "10.10.0.9", device: "HQ-SAP-Console", at: "Today 11:05" },
  { id: "LOG-44095", action: "Customer edited", actor: "Neha Joshi", role: "Support Team", store: "ALL", ref: "CUST-1188", detail: "Updated phone +91 80012 33445 → +91 80012 99887", ip: "10.10.0.22", device: "Support-Desk", at: "Today 10:14" },
  { id: "LOG-44094", action: "Login", actor: "Manish Rao", role: "Cashier", store: "BLR-IND", detail: "POS sign-in via PIN", ip: "10.42.1.18", device: "POS-BLR-IND-04", at: "Today 09:01" },
  { id: "LOG-44093", action: "Login", actor: "Anuj Kapoor", role: "Admin", store: "ALL", detail: "HQ sign-in · MFA passed", ip: "10.10.0.5", device: "HQ-Admin-Web", at: "Today 08:42" },
];

function Audit() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<Action | "All">("All");

  const view = log.filter((e) =>
    (type === "All" || e.action === type) &&
    (q === "" || [e.actor, e.ref, e.detail, e.store].join(" ").toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell allow={["admin"]} title="Audit Log"
      subtitle="Tamper-evident record of every privileged action across HomeTown POS">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] mb-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-secondary/15 text-secondary grid place-items-center"><ShieldAlert className="h-4 w-4" /></div>
          <div className="flex-1">
            <div className="font-medium text-sm">Why audit matters</div>
            <p className="text-xs text-muted-foreground mt-0.5">Every login, invoice, cancellation, discount approval, refund, inventory adjustment, price change, SAP re-sync, and customer edit is recorded with actor, device, IP and timestamp. Logs are append-only and exported nightly to cold storage for compliance.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actor, ref, store, detail…"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as Action | "All")}
          className="px-3 py-2 rounded-md border border-border bg-background text-sm">
          <option value="All">All actions</option>
          {(Object.keys(ICON) as Action[]).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] divide-y divide-border">
        {view.map((e) => {
          const Icon = ICON[e.action];
          return (
            <div key={e.id} className="p-4 flex items-start gap-4">
              <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${TONE[e.action]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-medium">{e.action}</span>
                  {e.ref && <span className="font-mono text-xs text-muted-foreground">· {e.ref}</span>}
                  <span className="text-xs text-muted-foreground">· {e.store}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{e.detail}</div>
                <div className="text-[11px] text-muted-foreground mt-1.5 flex flex-wrap gap-x-3">
                  <span>{e.actor} <span className="opacity-60">({e.role})</span></span>
                  <span className="font-mono">{e.device}</span>
                  <span className="font-mono">{e.ip}</span>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">{e.at}</div>
            </div>
          );
        })}
        {view.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No matching entries.</div>
        )}
      </div>
    </AppShell>
  );
}

export default Audit;
