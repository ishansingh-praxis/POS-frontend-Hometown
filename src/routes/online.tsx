import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/pos-data";
import {
  getDsrOnlineOrdersApi,
  type DsrOnlineOrder,
} from "@/services/dsrService";
import {
  getDsrChannelSummaryApi,
  type DsrChannelSummary,
} from "@/services/dsrStorewiseService";
import { COLORS } from "@/theme/posTheme";
import {
  Globe, ShoppingBag, IndianRupee, Users, Search, MapPin, RefreshCcw, Loader2, Info,
} from "lucide-react";
import { toast } from "sonner";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));

const DOC_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  SO_BOOKING: { label: "Booked", color: COLORS.blue },
  SO_CANCEL: { label: "Cancelled", color: COLORS.coral },
  OTC: { label: "Completed", color: COLORS.teal },
};

const docTypeBadge = (docType: string) => {
  const known = DOC_TYPE_LABEL[docType];
  return known || { label: docType || "Other", color: COLORS.muted };
};

function Online() {
  const [orders, setOrders] = useState<DsrOnlineOrder[]>([]);
  const [channelSummary, setChannelSummary] = useState<DsrChannelSummary | null>(null);
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<"All" | "ONLINE" | "MARKETPLACE">("All");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, summaryRes] = await Promise.all([
        getDsrOnlineOrdersApi({
          channel: channel === "All" ? undefined : channel,
          limit: 200,
        }),
        getDsrChannelSummaryApi(),
      ]);
      setOrders(ordersRes || []);
      setChannelSummary(summaryRes);
    } catch (err: any) {
      toast.error(err.message || "Failed to load online sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          q.trim() === "" ||
          `${o.orderId} ${o.customerName} ${o.customerPhone}`.toLowerCase().includes(q.toLowerCase())
      ),
    [orders, q]
  );

  return (
    <AppShell
      allow={["admin"]}
      title="Online Sales"
      subtitle="Real Hometown.in and marketplace orders, from June DSR"
      actions={
        <button
          onClick={load}
          className="text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted inline-flex items-center gap-1.5 font-bold"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      <div className="rounded-2xl border border-[#E6EAFE] bg-[#F3F0FF] p-4 mb-5 flex items-start gap-2 text-xs text-slate-600">
        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: COLORS.purple }} />
        June DSR sales store 6069 (Hometown.in) and 6524 (Marketplace) order status reflects the SAP document.
      </div>

      {channelSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Kpi label="Online Sales" value={formatINR(channelSummary.onlineSales)} icon={<Globe className="h-4 w-4" />} tone="cyan" />
          <Kpi label="Marketplace Sales" value={formatINR(channelSummary.marketplaceSales)} icon={<ShoppingBag className="h-4 w-4" />} tone="gold" />
          <Kpi label="Total Digital Sales" value={formatINR(channelSummary.digitalSales)} icon={<IndianRupee className="h-4 w-4" />} tone="purple" />
          <Kpi
            label="Digital Customers"
            value={formatNumber(
              (channelSummary.channels.find((c) => c.salesChannel === "ONLINE")?.customers || 0) +
                (channelSummary.channels.find((c) => c.salesChannel === "MARKETPLACE")?.customers || 0)
            )}
            icon={<Users className="h-4 w-4" />}
            tone="deepPurple"
          />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order, customer, phone…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as "All" | "ONLINE" | "MARKETPLACE")}
            className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input"
          >
            <option value="All">All channels</option>
            <option value="ONLINE">Online (Hometown.in)</option>
            <option value="MARKETPLACE">Marketplace</option>
          </select>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {filtered.length} order{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Order</th>
                <th className="text-left font-medium px-3 py-2.5">Channel</th>
                <th className="text-left font-medium px-3 py-2.5">Customer</th>
                <th className="text-left font-medium px-3 py-2.5">Item</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="text-right font-medium px-5 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No online orders match.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((o) => {
                  const badge = docTypeBadge(o.docType);
                  return (
                    <tr key={`${o.storeCode}-${o.orderId}`} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <div className="font-mono text-xs">{o.orderId}</div>
                        <div className="text-[10px] text-muted-foreground">{o.businessDateStr}</div>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white font-bold"
                          style={{ background: o.channel === "ONLINE" ? COLORS.cyan : COLORS.gold }}
                        >
                          {o.channel === "ONLINE" ? <Globe className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                          {o.channel === "ONLINE" ? "Hometown.in" : o.marketplace || "Marketplace"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <div>{o.customerName || "—"}</div>
                        <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {o.customerPhone || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <div className="font-medium line-clamp-1 max-w-[220px]">{o.firstItem || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {o.itemCount} item{o.itemCount > 1 ? "s" : ""} · qty {formatNumber(o.qty)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full text-white font-bold"
                          style={{ background: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium">{formatINR(o.grossSales)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "cyan" | "gold" | "purple" | "deepPurple";
}) {
  const hex =
    tone === "cyan" ? COLORS.cyan :
    tone === "gold" ? COLORS.gold :
    tone === "purple" ? COLORS.purple :
    COLORS.deepPurple;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="h-8 w-8 rounded-full grid place-items-center text-white" style={{ background: hex }}>
          {icon}
        </div>
      </div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}

export default Online;
