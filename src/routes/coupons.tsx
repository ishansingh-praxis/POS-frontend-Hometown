import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/pos-data";
import { useAuth } from "@/lib/auth";
import { getAdvancedCouponAnalyticsApi } from "@/services/couponService";
import {
  Percent,
  Search,
  Tag,
  TicketPercent,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCcw,
  Undo2,
  ShieldAlert,
  Flame,
  Users,
  TrendingUp,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api/pos";

type CouponCode = {
  _id: string;
  offerCode: string;
  campaignCode: string;
  campaignName?: string;
  campaignType?: string;
  storeCode: string;
  storeName?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minimumBillAmount?: number;
  maximumDiscountAmount?: number;
  availed: boolean;
  status: string;
  validFrom?: string;
  validTo?: string;
  availedAt?: string;
  availedByCustomerName?: string;
  availedByCustomerPhone?: string;
  availedStoreCode?: string;
  availedOrderId?: string;
  availedInvoiceId?: string;
  appliedDiscountAmount?: number;
};

type Campaign = {
  campaignCode: string;
  campaignName: string;
  campaignType?: string;
  bankName?: string;
  storeCode: string;
  storeName?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minimumBillAmount?: number;
  maximumDiscountAmount?: number;
  validFrom?: string;
  validTo?: string;
  status: string;
  totalCodes: number;
  usedCodes: number;
  unusedCodes: number;
  utilizationPercent: number;
};

type Summary = {
  totalCoupons: number;
  usedCoupons: number;
  unusedCoupons: number;
  activeCoupons: number;
  utilizationPercent: number;
  failedAttempts: number;
  successfulRedemptions: number;
  totalBillAmount: number;
  totalDiscountAmount: number;
  totalFinalPayableAmount: number;
  avgDiscountAmount: number;
  campaignBreakup: {
    _id: string;
    campaignName: string;
    total: number;
    used: number;
    unused: number;
  }[];
  storeBreakup: {
    _id: string;
    storeName?: string;
    redemptions: number;
    sales: number;
    discount: number;
    payable: number;
  }[];
};

type CampaignPerformance = {
  campaignCode: string;
  campaignName: string;
  campaignType?: string;
  utilizationPercent: number;
  totalCodes: number;
  usedCodes: number;
  redemptions: number;
  totalFinalPayableAmount: number;
  totalDiscountAmount: number;
  discountToSalesPercent: number;
  uniqueCustomerCount: number;
  storesUsedCount: number;
};

type FailedAttemptAnalytics = {
  reasonBreakup: { _id: string; attempts: number }[];
  suspiciousCustomers: { _id: string; attempts: number; lastReason?: string; lastOfferCode?: string }[];
  suspiciousCashiers: { _id: string; cashierName?: string; storeCode?: string; attempts: number }[];
};

type BurnRateCampaign = {
  campaignCode: string;
  days: number;
  avgDailyUse: number;
  totalRedemptionsInPeriod: number;
  remainingCoupons: number;
  estimatedDaysToFinish: number | null;
};

type InsightAlert = {
  alertType: string;
  severity: "HIGH" | "MEDIUM";
  title: string;
  description: string;
  recommendation: string;
};

type AdvancedAnalytics = {
  campaignPerformance: CampaignPerformance[];
  failedAttemptAnalytics: FailedAttemptAnalytics;
  burnRate: { days: number; burnRateByCampaign: BurnRateCampaign[] };
  alerts: { totalAlerts: number; highSeverity: number; mediumSeverity: number; alerts: InsightAlert[] };
};

const AVAILED_FILTERS = [
  { label: "All", value: "" },
  { label: "Unused", value: "false" },
  { label: "Used", value: "true" },
] as const;

function Coupons() {
  const { user } = useAuth();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [meta, setMeta] = useState<{ total?: number; pages?: number }>({});
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);

  const isAdmin = user?.role === "admin";
  const lockedStoreCode = !isAdmin ? user?.store || "" : "";

  const [q, setQ] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
  const [storeCode, setStoreCode] = useState(lockedStoreCode);
  const [availed, setAvailed] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
  });

  const fetchSummary = async () => {
    try {
      const params = lockedStoreCode ? `?storeCode=${encodeURIComponent(lockedStoreCode)}` : "";
      const res = await fetch(`${API_BASE}/coupon-codes/summary${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch {
      // ignore
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_BASE}/coupon-codes/campaigns`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setCampaigns(data.data);
    } catch {
      // ignore
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await getAdvancedCouponAnalyticsApi({
        storeCode: storeCode.trim(),
        campaignCode,
      });
      setAnalytics(data);
    } catch {
      // ignore
    }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (q.trim()) params.set("q", q.trim());
      if (campaignCode) params.set("campaignCode", campaignCode);
      if (storeCode.trim()) params.set("storeCode", storeCode.trim());
      if (availed) params.set("availed", availed);

      const res = await fetch(`${API_BASE}/coupon-codes?${params.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to fetch coupons");

      setCoupons(data.data);
      setMeta(data.meta || {});
    } catch (error: any) {
      flash(error.message || "Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchSummary();
    fetchCampaigns();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCoupons();
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, campaignCode, storeCode, availed]);

  const releaseCoupon = async (offerCode: string) => {
    try {
      const res = await fetch(`${API_BASE}/coupon-codes/${offerCode}/release`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ reason: "Released from admin dashboard", releasedBy: user?.name || "ADMIN" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to release coupon");

      flash(`Coupon ${offerCode} released`);
      fetchCoupons();
      fetchSummary();
      fetchCampaigns();
      fetchAnalytics();
    } catch (error: any) {
      flash(error.message || "Release failed");
    }
  };

  const campaignOptions = useMemo(
    () => Array.from(new Set(campaigns.map((c) => c.campaignCode))),
    [campaigns]
  );

  if (!user) return null;

  return (
    <AppShell
      allow={["admin", "manager"]}
      title="Coupons & Offers"
      subtitle={
        isAdmin
          ? "Bank offers, store-specific coupon codes, and redemption tracking"
          : `Coupon activity for ${lockedStoreCode}${user?.storeName ? ` · ${user.storeName}` : ""}`
      }
      actions={
        <button
          onClick={() => {
            fetchSummary();
            fetchCampaigns();
            fetchCoupons();
            fetchAnalytics();
          }}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-foreground text-background text-xs px-3 py-2 shadow-lg">
          {toast}
        </div>
      )}

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Kpi icon={<TicketPercent className="h-4.5 w-4.5" />} label="Total Coupons" value={summary.totalCoupons.toLocaleString()} />
          <Kpi icon={<CheckCircle2 className="h-4.5 w-4.5" />} label="Used" value={summary.usedCoupons.toLocaleString()} sub={`${summary.utilizationPercent}% utilized`} />
          <Kpi icon={<Tag className="h-4.5 w-4.5" />} label="Unused" value={summary.unusedCoupons.toLocaleString()} />
          <Kpi icon={<XCircle className="h-4.5 w-4.5" />} label="Failed Attempts" value={summary.failedAttempts.toLocaleString()} />
          <Kpi icon={<Percent className="h-4.5 w-4.5" />} label="Total Discount Given" value={formatINR(summary.totalDiscountAmount)} />
          <Kpi icon={<Percent className="h-4.5 w-4.5" />} label="Total Bill Value" value={formatINR(summary.totalBillAmount)} />
          <Kpi icon={<Percent className="h-4.5 w-4.5" />} label="Net Payable Collected" value={formatINR(summary.totalFinalPayableAmount)} />
          <Kpi icon={<CheckCircle2 className="h-4.5 w-4.5" />} label="Successful Redemptions" value={summary.successfulRedemptions.toLocaleString()} />
        </div>
      )}

      {analytics && analytics.alerts.alerts.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4.5 w-4.5 text-red-600" />
            <h2 className="font-display text-base">
              Fraud & Misuse Alerts ({analytics.alerts.highSeverity} high, {analytics.alerts.mediumSeverity} medium)
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {analytics.alerts.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 text-xs ${
                  alert.severity === "HIGH" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{alert.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      alert.severity === "HIGH" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div className="text-muted-foreground mt-1">{alert.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics && analytics.campaignPerformance.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-display text-base">Campaign Performance</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.campaignPerformance.map((c) => (
              <div key={c.campaignCode} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-xs">{c.campaignName}</div>
                  <div className="text-xs font-display">{c.utilizationPercent}%</div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(c.utilizationPercent, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-muted-foreground">
                  <div>Used {c.usedCodes}/{c.totalCodes}</div>
                  <div>Customers {c.uniqueCustomerCount}</div>
                  <div>Sales {formatINR(c.totalFinalPayableAmount)}</div>
                  <div>Discount {c.discountToSalesPercent}% of sales</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-base mb-3">Campaigns</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="py-1.5 pr-2">Campaign</th>
                  <th className="py-1.5 pr-2">Type</th>
                  <th className="py-1.5 pr-2 text-right">Discount</th>
                  <th className="py-1.5 pr-2 text-right">Codes</th>
                  <th className="py-1.5 text-right">Used %</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.campaignCode} className="border-t border-border">
                    <td className="py-1.5 pr-2">
                      <div className="font-medium">{c.campaignName}</div>
                      <div className="text-muted-foreground font-mono text-[10px]">{c.campaignCode}</div>
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{c.campaignType}</td>
                    <td className="py-1.5 pr-2 text-right">
                      {c.discountType === "FLAT" ? formatINR(c.discountValue) : `${c.discountValue}%`}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{c.usedCodes} / {c.totalCodes}</td>
                    <td className="py-1.5 text-right font-medium">{c.utilizationPercent}%</td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan={5} className="py-3 text-center text-muted-foreground">No campaigns found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-base mb-3">Store-wise Redemptions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="py-1.5 pr-2">Store</th>
                  <th className="py-1.5 pr-2 text-right">Redemptions</th>
                  <th className="py-1.5 pr-2 text-right">Discount</th>
                  <th className="py-1.5 pr-2 text-right">Payable</th>
                  <th className="py-1.5 text-right">Impact %</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.storeBreakup || []).map((s) => (
                  <tr key={s._id} className="border-t border-border">
                    <td className="py-1.5 pr-2">{s._id} · {s.storeName}</td>
                    <td className="py-1.5 pr-2 text-right">{s.redemptions}</td>
                    <td className="py-1.5 pr-2 text-right">{formatINR(s.discount)}</td>
                    <td className="py-1.5 pr-2 text-right">{formatINR(s.payable)}</td>
                    <td className="py-1.5 text-right">
                      {s.sales > 0 ? `${((s.discount / s.sales) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
                {(!summary || summary.storeBreakup.length === 0) && (
                  <tr><td colSpan={5} className="py-3 text-center text-muted-foreground">No redemptions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {analytics && (
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4.5 w-4.5 text-primary" />
              <h2 className="font-display text-base">Failed Attempt Analytics</h2>
            </div>

            <div className="mb-3">
              <div className="text-[11px] text-muted-foreground mb-1.5">By reason</div>
              <div className="space-y-1.5">
                {analytics.failedAttemptAnalytics.reasonBreakup.map((r) => (
                  <div key={r._id} className="flex items-center justify-between text-xs rounded-md bg-muted px-2 py-1.5">
                    <span>{r._id}</span>
                    <span className="font-medium">{r.attempts}</span>
                  </div>
                ))}
                {analytics.failedAttemptAnalytics.reasonBreakup.length === 0 && (
                  <div className="text-xs text-muted-foreground">No failed attempts.</div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-[11px] text-muted-foreground mb-1.5">Suspicious customers (top retries on invalid coupons)</div>
              <div className="space-y-1.5">
                {analytics.failedAttemptAnalytics.suspiciousCustomers.map((c) => (
                  <div key={c._id} className="flex items-center justify-between text-xs rounded-md bg-red-50 px-2 py-1.5">
                    <span className="font-mono">{c._id}</span>
                    <span className="font-medium">{c.attempts} attempts</span>
                  </div>
                ))}
                {analytics.failedAttemptAnalytics.suspiciousCustomers.length === 0 && (
                  <div className="text-xs text-muted-foreground">No suspicious customer pattern.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-muted-foreground mb-1.5">Cashier-wise invalid attempts</div>
              <div className="space-y-1.5">
                {analytics.failedAttemptAnalytics.suspiciousCashiers.map((c) => (
                  <div key={c._id} className="flex items-center justify-between text-xs rounded-md bg-red-50 px-2 py-1.5">
                    <span>{c.cashierName || c._id} · {c.storeCode}</span>
                    <span className="font-medium">{c.attempts} attempts</span>
                  </div>
                ))}
                {analytics.failedAttemptAnalytics.suspiciousCashiers.length === 0 && (
                  <div className="text-xs text-muted-foreground">No suspicious cashier pattern.</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              <h2 className="font-display text-base">
                Campaign Burn Rate (last {analytics.burnRate.days} days)
              </h2>
            </div>
            <div className="space-y-2">
              {analytics.burnRate.burnRateByCampaign.map((b) => (
                <div key={b.campaignCode} className="rounded-lg border border-border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{b.campaignCode}</span>
                    <span>{b.avgDailyUse}/day</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                    <div>Used {b.totalRedemptionsInPeriod}</div>
                    <div>Remaining {b.remainingCoupons}</div>
                    <div>Days left {b.estimatedDaysToFinish ?? "—"}</div>
                  </div>
                </div>
              ))}
              {analytics.burnRate.burnRateByCampaign.length === 0 && (
                <div className="text-xs text-muted-foreground">No burn-rate data yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchCoupons()}
              placeholder="Search offer code, customer phone, order/invoice..."
              className="w-full pl-8 pr-3 py-2 rounded-md bg-background border border-input text-xs"
            />
          </div>

          <select
            value={campaignCode}
            onChange={(e) => setCampaignCode(e.target.value)}
            className="px-2 py-2 rounded-md bg-background border border-input text-xs"
          >
            <option value="">All campaigns</option>
            {campaignOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            value={storeCode}
            onChange={(e) => isAdmin && setStoreCode(e.target.value)}
            disabled={!isAdmin}
            placeholder="Store code"
            className="w-28 px-2 py-2 rounded-md bg-background border border-input text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          />

          <div className="flex rounded-md border border-input overflow-hidden">
            {AVAILED_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setAvailed(f.value)}
                className={`px-2.5 py-2 text-xs ${availed === f.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchCoupons}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Search className="h-3.5 w-3.5" /> Apply
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground">
              <tr className="text-left">
                <th className="p-3">Offer Code</th>
                <th className="p-3">Campaign</th>
                <th className="p-3">Store</th>
                <th className="p-3 text-right">Discount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Redeemed By</th>
                <th className="p-3">Order / Invoice</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...
                </td></tr>
              )}

              {!loading && coupons.map((c) => (
                <tr key={c._id} className="border-t border-border">
                  <td className="p-3 font-mono font-medium">{c.offerCode}</td>
                  <td className="p-3">
                    <div>{c.campaignName}</div>
                    <div className="text-muted-foreground font-mono text-[10px]">{c.campaignCode}</div>
                  </td>
                  <td className="p-3">{c.storeCode}</td>
                  <td className="p-3 text-right">
                    {c.discountType === "FLAT" ? formatINR(c.discountValue) : `${c.discountValue}%`}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      c.availed ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {c.availed ? (
                      <div>
                        <div>{c.availedByCustomerName}</div>
                        <div className="text-muted-foreground text-[10px]">{c.availedByCustomerPhone}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[10px]">
                    {c.availedOrderId || "—"}
                    {c.availedInvoiceId ? <div>{c.availedInvoiceId}</div> : null}
                  </td>
                  <td className="p-3 text-right">
                    {c.availed && (
                      <button
                        onClick={() => releaseCoupon(c.offerCode)}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-border hover:bg-muted"
                      >
                        <Undo2 className="h-3 w-3" /> Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && coupons.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No coupons found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {meta.total !== undefined && (
          <div className="p-3 border-t border-border text-[11px] text-muted-foreground">
            Showing {coupons.length} of {meta.total.toLocaleString()} coupons
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">{icon}</div>
      </div>
      <div className="mt-2 text-xl font-display">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export default Coupons;
