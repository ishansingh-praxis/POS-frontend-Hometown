import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import {
  Receipt, Percent, Undo2, CreditCard, Clock, WifiOff, RefreshCcw, Hash, Package,
  ShieldCheck, FileText, Save, Loader2,
} from "lucide-react";
import { getAllSettingsApi, saveSettingsApi } from "@/services/settingsService";
import { toast } from "sonner";


// Derives a stable settingKey from the group + field label so saved values can be
// re-merged onto the defaults below on load (e.g. "gst" + "Default GSTIN (HQ)" → "gst.default-gstin-hq").
const slugify = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const settingKeyFor = (groupKey: string, label: string) => `${groupKey}.${slugify(label)}`;

type Group = {
  key: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }>;
  fields: Array<
    | { type: "text" | "number"; label: string; value: string | number; suffix?: string }
    | { type: "toggle"; label: string; value: boolean }
    | { type: "select"; label: string; value: string; options: string[] }
  >;
};

const initial: Group[] = [
  {
    key: "gst", title: "GST Settings", desc: "Default tax behaviour for invoices",
    icon: Receipt,
    fields: [
      { type: "text", label: "Default GSTIN (HQ)", value: "29AAACH1234F1Z5" },
      { type: "toggle", label: "Price entered is GST-inclusive", value: true },
      { type: "toggle", label: "Generate e-invoice IRN above ₹50,000", value: true },
      { type: "select", label: "Place of supply default", value: "Buyer state", options: ["Buyer state", "Seller state"] },
    ],
  },
  {
    key: "invoice", title: "Invoice Format & Numbering", desc: "Header, footer & series",
    icon: FileText,
    fields: [
      { type: "text", label: "Numbering pattern", value: "HT-{STORE}-{YY}{####}" },
      { type: "text", label: "Footer line", value: "Goods once sold cannot be returned without invoice." },
      { type: "toggle", label: "Print HSN column on customer copy", value: true },
      { type: "toggle", label: "Print QR for UPI re-pay", value: true },
    ],
  },
  {
    key: "discount", title: "Discount Limits", desc: "Approval thresholds by role",
    icon: Percent,
    fields: [
      { type: "number", label: "Cashier auto-approve up to", value: 5, suffix: "%" },
      { type: "number", label: "Manager auto-approve up to", value: 15, suffix: "%" },
      { type: "number", label: "Admin auto-approve up to", value: 30, suffix: "%" },
      { type: "toggle", label: "Allow stacking coupon + festival offer", value: false },
    ],
  },
  {
    key: "return", title: "Return Policy", desc: "Eligibility window & rules",
    icon: Undo2,
    fields: [
      { type: "number", label: "Return window (furniture)", value: 7, suffix: "days" },
      { type: "number", label: "Return window (décor / furnishing)", value: 14, suffix: "days" },
      { type: "toggle", label: "Require original invoice", value: true },
      { type: "toggle", label: "Allow return without tags (décor)", value: false },
    ],
  },
  {
    key: "refund", title: "Refund Rules", desc: "Mode-wise refund SLA",
    icon: RefreshCcw,
    fields: [
      { type: "select", label: "Default refund mode", value: "Original payment", options: ["Original payment", "Store credit", "Bank transfer"] },
      { type: "number", label: "UPI refund SLA", value: 24, suffix: "hours" },
      { type: "number", label: "Card refund SLA", value: 7, suffix: "days" },
      { type: "toggle", label: "Auto-issue store credit if refund > ₹50,000", value: true },
    ],
  },
  {
    key: "payment", title: "Payment Modes", desc: "Modes enabled at counter",
    icon: CreditCard,
    fields: [
      { type: "toggle", label: "Cash", value: true },
      { type: "toggle", label: "UPI", value: true },
      { type: "toggle", label: "Credit / Debit card", value: true },
      { type: "toggle", label: "EMI (Bajaj / HDFC)", value: true },
      { type: "toggle", label: "Gift card & store credit", value: true },
      { type: "toggle", label: "Bank transfer (corporate)", value: true },
    ],
  },
  {
    key: "store", title: "Store Timings", desc: "Default opening hours",
    icon: Clock,
    fields: [
      { type: "text", label: "Open", value: "10:00" },
      { type: "text", label: "Close", value: "21:30" },
      { type: "toggle", label: "Allow late billing past close (with PIN)", value: true },
    ],
  },
  {
    key: "offline", title: "Offline Billing", desc: "Behaviour when internet is down",
    icon: WifiOff,
    fields: [
      { type: "toggle", label: "Permit offline billing", value: true },
      { type: "number", label: "Max offline bills per terminal", value: 50 },
      { type: "toggle", label: "Block discounts > 5% when offline", value: true },
    ],
  },
  {
    key: "sap", title: "SAP Sync Rules", desc: "Retry & escalation",
    icon: RefreshCcw,
    fields: [
      { type: "number", label: "Auto-retry attempts", value: 5 },
      { type: "number", label: "Retry interval", value: 10, suffix: "min" },
      { type: "toggle", label: "Page SAP admin on 3 consecutive failures", value: true },
      { type: "select", label: "Posting mode", value: "Real-time", options: ["Real-time", "Hourly batch", "End of day"] },
    ],
  },
  {
    key: "numbering", title: "Document Numbering", desc: "Invoice, credit-note & order series",
    icon: Hash,
    fields: [
      { type: "text", label: "Invoice prefix", value: "HT-" },
      { type: "text", label: "Credit note prefix", value: "CN-" },
      { type: "text", label: "Delivery challan prefix", value: "DC-" },
      { type: "toggle", label: "Reset series financial year", value: true },
    ],
  },
  {
    key: "stock", title: "Low-Stock Threshold", desc: "Global defaults",
    icon: Package,
    fields: [
      { type: "number", label: "Reorder when on-hand below", value: 4, suffix: "units" },
      { type: "number", label: "Critical alert when below", value: 1, suffix: "unit" },
      { type: "toggle", label: "Auto-raise indent to warehouse", value: false },
    ],
  },
  {
    key: "approval", title: "Approval Levels", desc: "Who can sign off what",
    icon: ShieldCheck,
    fields: [
      { type: "select", label: "Cancel paid invoice", value: "Admin only", options: ["Manager", "Admin only"] },
      { type: "select", label: "Refund above ₹25,000", value: "Manager + Admin", options: ["Manager", "Manager + Admin"] },
      { type: "select", label: "Price override at counter", value: "Manager", options: ["Disabled", "Manager", "Admin only"] },
    ],
  },
];

function Settings() {
  const [groups, setGroups] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [active, setActive] = useState(initial[0].key);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllSettingsApi()
      .then((saved) => {
        const savedByKey = new Map(saved.map((s) => [s.settingKey, s.settingValue]));
        setGroups((gs) =>
          gs.map((g) => ({
            ...g,
            fields: g.fields.map((f) => {
              const key = settingKeyFor(g.key, f.label);
              return savedByKey.has(key) ? { ...f, value: savedByKey.get(key) } : f;
            }),
          }))
        );
      })
      .catch((err) => toast.error(err.message || "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const update = (gKey: string, idx: number, value: any) => {
    setGroups((gs) => gs.map((g) => g.key !== gKey ? g : { ...g, fields: g.fields.map((f, i) => i === idx ? { ...f, value } : f) }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const records = groups.flatMap((g) =>
        g.fields.map((f) => ({ settingKey: settingKeyFor(g.key, f.label), settingValue: f.value, module: g.key }))
      );
      await saveSettingsApi(records);
      setDirty(false);
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell allow={["admin"]} title="Settings"
      subtitle="Business rules · No developer help needed"
      actions={
        <button disabled={!dirty || saving} onClick={save}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md ${dirty && !saving ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
      }
    >
      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 grid place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <div className="mt-3 text-sm text-muted-foreground">Loading settings...</div>
        </div>
      ) : (
      <div className="grid lg:grid-cols-[220px,1fr] gap-6">
        <aside className="space-y-1">
          {groups.map((g) => (
            <button key={g.key} onClick={() => setActive(g.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition ${active === g.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <g.icon className="h-4 w-4" /> {g.title}
            </button>
          ))}
        </aside>

        <div className="space-y-5">
          {groups.filter((g) => g.key === active).map((g) => (
            <section key={g.key} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-3 mb-5">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><g.icon className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-display text-xl">{g.title}</h2>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {g.fields.map((f, i) => (
                  <div key={i} className={`rounded-lg border border-border p-3 ${f.type === "toggle" ? "sm:col-span-2 flex items-center justify-between" : ""}`}>
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    {f.type === "toggle" ? (
                      <button onClick={() => update(g.key, i, !f.value)}
                        className={`h-5 w-9 rounded-full transition relative ${f.value ? "bg-primary" : "bg-muted"}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${f.value ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    ) : f.type === "select" ? (
                      <select value={f.value as string} onChange={(e) => update(g.key, i, e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm">
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <input type={f.type} value={f.value as any} onChange={(e) => update(g.key, i, f.type === "number" ? Number(e.target.value) : e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded-md border border-border bg-background text-sm" />
                        {"suffix" in f && f.suffix && <span className="text-xs text-muted-foreground">{f.suffix}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      )}
    </AppShell>
  );
}

export default Settings;
