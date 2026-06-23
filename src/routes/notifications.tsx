import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Bell, FileText, CreditCard, CheckCircle2, XCircle, Undo2, Truck, RotateCcw,
  Package, AlertTriangle, Clock, RefreshCcw, WifiOff, Percent, TrendingDown,
  Store, Mail, MessageSquare, Smartphone, Save,
} from "lucide-react";


type Channel = "Email" | "SMS" | "WhatsApp" | "Push";
type Audience = "Customer" | "Store" | "Admin";
type Severity = "info" | "success" | "warning" | "critical";

type NotifTemplate = {
  key: string; title: string; audience: Audience; trigger: string;
  channels: Channel[]; sample: string; icon: React.ComponentType<{ className?: string }>;
};

const customerTpls: NotifTemplate[] = [
  { key: "inv", title: "Invoice generated", audience: "Customer", trigger: "On invoice issue", channels: ["WhatsApp", "Email"], sample: "Hi Sneha, your invoice HT-25612 of ₹64,498 is ready. View: hometown.in/inv/HT-25612", icon: FileText },
  { key: "pay", title: "Payment received", audience: "Customer", trigger: "On payment captured", channels: ["WhatsApp", "SMS"], sample: "₹36,498 received against ORD-25610. Balance ₹12,000 due on delivery.", icon: CreditCard },
  { key: "ordc", title: "Order confirmed", audience: "Customer", trigger: "On order Confirmed", channels: ["WhatsApp"], sample: "Your HomeTown order ORD-25610 is confirmed. Delivery on 22 Jun.", icon: CheckCircle2 },
  { key: "ordx", title: "Order cancelled", audience: "Customer", trigger: "On order Cancelled", channels: ["SMS", "Email"], sample: "Order ORD-25588 has been cancelled. Refund (if any) will be processed within 24h.", icon: XCircle },
  { key: "ref", title: "Refund processed", audience: "Customer", trigger: "On refund captured", channels: ["WhatsApp", "SMS"], sample: "₹3,299 refunded to your UPI/HDFC. Reference PAY-77007.", icon: Undo2 },
  { key: "dlv", title: "Delivery update", audience: "Customer", trigger: "On dispatch / out-for-delivery", channels: ["WhatsApp", "SMS"], sample: "Your Westwood Sofa is out for delivery today between 2–5 PM. Track: hometown.in/t/ORD-25612", icon: Truck },
  { key: "rtn", title: "Return approved", audience: "Customer", trigger: "On return approval", channels: ["WhatsApp", "Email"], sample: "Return for HT-25607 approved. Pickup scheduled 18 Jun.", icon: RotateCcw },
];

const storeTpls: NotifTemplate[] = [
  { key: "low", title: "Low stock", audience: "Store", trigger: "Stock below reorder", channels: ["Push", "Email"], sample: "Mensa 6-Seater Dining Set: 1 unit left (reorder at 4).", icon: Package },
  { key: "payf", title: "Payment failed", audience: "Store", trigger: "On capture failure", channels: ["Push"], sample: "Card declined for HT-25588 (Decline 51). Cashier action required.", icon: AlertTriangle },
  { key: "opnd", title: "Order pending", audience: "Store", trigger: "Order > 30 min in Created", channels: ["Push"], sample: "ORD-25610 unconfirmed for 45 min. Please action.", icon: Clock },
  { key: "rpnd", title: "Return pending", audience: "Store", trigger: "Return awaiting approval", channels: ["Push", "Email"], sample: "2 returns awaiting your approval (Indiranagar).", icon: Undo2 },
  { key: "sapf", title: "SAP sync failed", audience: "Store", trigger: "On sync failure", channels: ["Push", "Email"], sample: "Invoice HT-25608 failed SAP sync (GL 411001 blocked).", icon: RefreshCcw },
  { key: "offf", title: "Offline bill sync failed", audience: "Store", trigger: "On offline reconcile error", channels: ["Push"], sample: "3 offline bills could not sync — duplicate IDs detected.", icon: WifiOff },
];

const adminTpls: NotifTemplate[] = [
  { key: "asap", title: "Failed SAP sync (rollup)", audience: "Admin", trigger: "≥ 5 failed in 1 hour", channels: ["Email", "Push"], sample: "7 SAP syncs failed in the last hour across 2 stores.", icon: RefreshCcw },
  { key: "ref-h", title: "High refund value", audience: "Admin", trigger: "Single refund > ₹50,000", channels: ["Email"], sample: "Refund of ₹84,000 raised at MUM-LBS (corporate cancellation).", icon: Undo2 },
  { key: "disc", title: "Large discount", audience: "Admin", trigger: "Discount > 25%", channels: ["Email"], sample: "28% discount approved on Aspen King Bed at BLR-IND.", icon: Percent },
  { key: "inv-m", title: "Inventory mismatch", audience: "Admin", trigger: "POS vs SAP variance", channels: ["Email"], sample: "12 SKUs variance between POS and SAP at DEL-SKT.", icon: TrendingDown },
  { key: "off", title: "Store offline", audience: "Admin", trigger: "Terminal heartbeat lost > 5 min", channels: ["Email", "SMS"], sample: "GWL-MAIN POS-2 has been offline for 12 minutes.", icon: Store },
];

const recent: { id: string; tpl: string; audience: Audience; severity: Severity; to: string; channel: Channel; at: string; status: "Delivered" | "Sent" | "Failed" | "Read" }[] = [
  { id: "N-9412", tpl: "Invoice generated", audience: "Customer", severity: "info", to: "+91 91234 56789", channel: "WhatsApp", at: "14:22", status: "Read" },
  { id: "N-9411", tpl: "Payment received", audience: "Customer", severity: "success", to: "+91 98200 11223", channel: "SMS", at: "12:11", status: "Delivered" },
  { id: "N-9410", tpl: "SAP sync failed", audience: "Store", severity: "warning", to: "manager@blr-ind", channel: "Push", at: "11:05", status: "Read" },
  { id: "N-9409", tpl: "Large discount", audience: "Admin", severity: "warning", to: "ops@hometown.in", channel: "Email", at: "14:21", status: "Delivered" },
  { id: "N-9408", tpl: "Delivery update", audience: "Customer", severity: "info", to: "+91 99887 76655", channel: "WhatsApp", at: "10:54", status: "Sent" },
  { id: "N-9407", tpl: "Store offline", audience: "Admin", severity: "critical", to: "ops@hometown.in", channel: "Email", at: "09:48", status: "Delivered" },
  { id: "N-9406", tpl: "Refund processed", audience: "Customer", severity: "success", to: "+91 90876 54321 (UPI)", channel: "SMS", at: "09:42", status: "Delivered" },
  { id: "N-9405", tpl: "Order cancelled", audience: "Customer", severity: "warning", to: "walk-in (no contact)", channel: "Email", at: "Yesterday 12:14", status: "Failed" },
];

const CHANNEL_ICON: Record<Channel, React.ComponentType<{ className?: string }>> = {
  Email: Mail, SMS: Smartphone, WhatsApp: MessageSquare, Push: Bell,
};

const SEVERITY_TONE: Record<Severity, string> = {
  info: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  critical: "bg-destructive/15 text-destructive",
};

function TemplateCard({ t, on, toggle }: { t: NotifTemplate; on: Record<Channel, boolean>; toggle: (c: Channel) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
          <t.icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{t.title}</div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{t.trigger}</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 italic line-clamp-2">"{t.sample}"</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(CHANNEL_ICON) as Channel[]).map((c) => {
          const Icon = CHANNEL_ICON[c];
          const enabled = on[c];
          const supported = t.channels.includes(c);
          return (
            <button
              key={c}
              disabled={!supported}
              onClick={() => supported && toggle(c)}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition ${
                !supported ? "opacity-40 cursor-not-allowed border-border" :
                enabled ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              <Icon className="h-3 w-3" /> {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Notifications() {
  const { user } = useAuth();
  const role = user?.role;
  const showCustomer = role === "admin" || role === "manager";
  const showStore = role === "admin" || role === "manager";
  const showAdmin = role === "admin";

  const allTpls = [...customerTpls, ...storeTpls, ...adminTpls];
  const [prefs, setPrefs] = useState<Record<string, Record<Channel, boolean>>>(() => {
    const out: any = {};
    for (const t of allTpls) {
      out[t.key] = { Email: t.channels.includes("Email"), SMS: t.channels.includes("SMS"),
        WhatsApp: t.channels.includes("WhatsApp"), Push: t.channels.includes("Push") };
    }
    return out;
  });
  const [dirty, setDirty] = useState(false);
  const toggle = (key: string, c: Channel) => {
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [c]: !p[key][c] } }));
    setDirty(true);
  };

  const Section = ({ title, sub, list }: { title: string; sub: string; list: NotifTemplate[] }) => (
    <section className="mt-6">
      <div className="mb-3">
        <h2 className="font-display text-lg">{title}</h2>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.map((t) => <TemplateCard key={t.key} t={t} on={prefs[t.key]} toggle={(c) => toggle(t.key, c)} />)}
      </div>
    </section>
  );

  return (
    <AppShell allow={["admin", "manager"]}
      title="Notifications" subtitle="Reduce manual follow-up across customer, store and admin events"
      actions={
        <button disabled={!dirty} onClick={() => setDirty(false)}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md ${dirty ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
          <Save className="h-3.5 w-3.5" /> {dirty ? "Save preferences" : "Saved"}
        </button>
      }
    >
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { label: "Sent today", value: "1,284", icon: Bell, tone: "bg-primary/15 text-primary" },
          { label: "Delivered", value: "1,247", icon: CheckCircle2, tone: "bg-success/15 text-success" },
          { label: "Failed", value: "11", icon: XCircle, tone: "bg-destructive/15 text-destructive" },
          { label: "Channels live", value: "4 / 4", icon: MessageSquare, tone: "bg-secondary/15 text-secondary" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className={`h-9 w-9 rounded-lg grid place-items-center ${k.tone}`}><k.icon className="h-4 w-4" /></div>
            <div className="mt-4 font-display text-2xl">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {showCustomer && <Section title="Customer notifications" sub="Sent to buyer's phone / email after their action" list={customerTpls} />}
      {showStore && <Section title="Store notifications" sub="Counter & manager alerts on the store device" list={storeTpls} />}
      {showAdmin && <Section title="Admin notifications" sub="HQ alerts for risk, exceptions & outages" list={adminTpls} />}

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg">Recent activity</h2>
          <p className="text-xs text-muted-foreground">Latest dispatched notifications</p>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">ID</th>
              <th className="text-left font-medium px-3 py-2.5">Template</th>
              <th className="text-left font-medium px-3 py-2.5">Audience</th>
              <th className="text-left font-medium px-3 py-2.5">To</th>
              <th className="text-left font-medium px-3 py-2.5">Channel</th>
              <th className="text-left font-medium px-3 py-2.5">Severity</th>
              <th className="text-left font-medium px-3 py-2.5">Status</th>
              <th className="text-right font-medium px-5 py-2.5">At</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => {
              const Icon = CHANNEL_ICON[r.channel];
              return (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-5 py-3 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-3">{r.tpl}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.audience}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.to}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-xs"><Icon className="h-3 w-3" /> {r.channel}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_TONE[r.severity]}`}>{r.severity}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === "Failed" ? "bg-destructive/15 text-destructive" :
                      r.status === "Read" ? "bg-success/15 text-success" :
                      r.status === "Delivered" ? "bg-primary/15 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{r.at}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}

export default Notifications;
