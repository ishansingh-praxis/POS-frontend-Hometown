import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/routerCompat";
import {
  AlertTriangle,
  BadgeIndianRupee,
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileText,
  IndianRupee,
  Loader2,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  Store,
  UserRound,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  closeStoreDayApi,
  getManagerDashboardApi,
  resolveSessionExceptionApi,
} from "@/services/managerDashboardService";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);

type TabKey =
  | "overview"
  | "cashiers"
  | "exceptions"
  | "inventory"
  | "catalog"
  | "customers"
  | "closing";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [businessDate, setBusinessDate] = useState(today());
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response: any = await getManagerDashboardApi({ businessDate });

      setDashboard(response?.data || response);
    } catch (err: any) {
      setError(err.message || "Unable to load manager dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, businessDate]);

  const overview = dashboard?.overview || {};
  const cashierSessions = dashboard?.cashierSessions || [];
  const cashierPerformance = dashboard?.cashierPerformance || [];
  const salesAndInvoices = dashboard?.salesAndInvoices || {};
  const paymentAndCash = dashboard?.paymentAndCash || {};
  const customerSummary = dashboard?.customerSummary || {};
  const inventorySummary = dashboard?.inventorySummary || {};
  const catalogSummary = dashboard?.catalogSummary || {};
  const replenishmentSuggestions = dashboard?.replenishmentSuggestions || [];
  const inventoryMovementSummary = dashboard?.inventoryMovementSummary || {};
  const approvalRequests = dashboard?.approvalRequests || {};
  const auditSummary = dashboard?.auditSummary || {};
  const alerts = dashboard?.alerts || [];

  const openSessions = cashierSessions.filter((x: any) => x.status === "OPEN");
  const autoVerifiedSessions = cashierSessions.filter(
    (x: any) => x.status === "AUTO_VERIFIED"
  );
  const exceptionSessions = cashierSessions.filter(
    (x: any) => x.status === "EXCEPTION_FLAGGED"
  );
  const resolvedSessions = cashierSessions.filter(
    (x: any) => x.status === "RESOLVED"
  );

  const canCloseStoreDay = useMemo(() => {
    return openSessions.length === 0 && exceptionSessions.length === 0;
  }, [openSessions.length, exceptionSessions.length]);

  const blockers = useMemo(() => {
    const list: string[] = [];

    if (openSessions.length > 0) {
      list.push(`${openSessions.length} cashier session(s) still OPEN`);
    }

    if (exceptionSessions.length > 0) {
      list.push(
        `${exceptionSessions.length} exception session(s) need resolution`
      );
    }

    return list;
  }, [openSessions.length, exceptionSessions.length]);

  const resolveException = async (session: any, exceptionType?: string) => {
    const note =
      window.prompt("Add resolution note", "Checked and resolved by manager") ||
      "Resolved by manager";

    try {
      setActionLoading(true);

      await resolveSessionExceptionApi(session.sessionId, {
        exceptionType,
        resolutionNote: note,
      });

      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Unable to resolve exception");
    } finally {
      setActionLoading(false);
    }
  };

  const closeStoreDay = async () => {
    if (!canCloseStoreDay) {
      alert(`Cannot close store day:\n${blockers.join("\n")}`);
      return;
    }

    const confirmed = window.confirm(
      `Close store day for ${businessDate}? This will create final store closing report.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await closeStoreDayApi({
        businessDate,
        remarks: "Store day verified and closed by manager",
      });

      alert("Store day closed successfully");
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Unable to close store day");
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell
      allow={["manager", "admin"]}
      title="Manager Dashboard"
      subtitle={`${user.store || ""} · ${user.storeName || "Assigned Store"}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate("/my-capabilities")}
            className="text-xs px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 inline-flex items-center gap-1.5 font-bold"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            My Capabilities
          </button>

          <button
            onClick={loadDashboard}
            className="text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted inline-flex items-center gap-1.5 font-bold"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-orange-700 to-amber-500 text-white p-6 shadow-lg">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold mb-3">
                <Store className="h-4 w-4" />
                Store Control Center
              </div>

              <h1 className="text-3xl font-black">
                {user.storeName || overview?.storeName || "Manager Store"}
              </h1>

              <p className="mt-2 text-sm text-white/80 max-w-4xl">
                Monitor cashier sessions, live sales, payments, customers, real
                ATP inventory, catalog, replenishment, and store-day closing.
                Normal cashier work is auto-verified. You only resolve
                exceptions.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/15 border border-white/20 p-4">
                <div className="text-xs text-white/70">Manager</div>
                <div className="font-black">{user.name || "Manager"}</div>
                <div className="text-xs text-white/75">{user.email}</div>
              </div>

              <label className="rounded-2xl bg-white/15 border border-white/20 p-4 block">
                <div className="text-xs text-white/70 mb-1">Business Date</div>
                <input
                  type="date"
                  value={businessDate}
                  onChange={(e) => setBusinessDate(e.target.value)}
                  className="w-full rounded-xl bg-white/90 text-slate-950 px-3 py-2 text-sm font-bold outline-none"
                />
              </label>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white border shadow-sm p-10 grid place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <div className="mt-3 text-sm text-gray-500">
              Loading manager dashboard...
            </div>
          </div>
        ) : (
          <>
            <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "overview" && (
              <OverviewTab
                overview={overview}
                alerts={alerts}
                salesAndInvoices={salesAndInvoices}
                paymentAndCash={paymentAndCash}
                cashierSessions={cashierSessions}
                canCloseStoreDay={canCloseStoreDay}
                blockers={blockers}
                closeStoreDay={closeStoreDay}
                actionLoading={actionLoading}
              />
            )}

            {activeTab === "cashiers" && (
              <CashiersTab
                sessions={cashierSessions}
                performance={cashierPerformance}
              />
            )}

            {activeTab === "exceptions" && (
              <ExceptionsTab
                sessions={exceptionSessions}
                alerts={alerts}
                approvalRequests={approvalRequests}
                auditSummary={auditSummary}
                resolveException={resolveException}
                actionLoading={actionLoading}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryTab
                inventorySummary={inventorySummary}
                replenishmentSuggestions={replenishmentSuggestions}
                inventoryMovementSummary={inventoryMovementSummary}
              />
            )}

            {activeTab === "catalog" && (
              <CatalogTab catalogSummary={catalogSummary} />
            )}

            {activeTab === "customers" && (
              <CustomersTab customerSummary={customerSummary} />
            )}

            {activeTab === "closing" && (
              <ClosingTab
                businessDate={businessDate}
                sessions={cashierSessions}
                openSessions={openSessions}
                autoVerifiedSessions={autoVerifiedSessions}
                exceptionSessions={exceptionSessions}
                resolvedSessions={resolvedSessions}
                canCloseStoreDay={canCloseStoreDay}
                blockers={blockers}
                closeStoreDay={closeStoreDay}
                actionLoading={actionLoading}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function DashboardTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "cashiers", label: "Cashiers", icon: UserRound },
    { key: "exceptions", label: "Exceptions", icon: AlertTriangle },
    { key: "inventory", label: "Inventory", icon: Boxes },
    { key: "catalog", label: "Catalog", icon: PackageSearch },
    { key: "customers", label: "Customers", icon: Users },
    { key: "closing", label: "Store Closing", icon: ClipboardCheck },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black border ${
                active
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-orange-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OverviewTab({
  overview,
  alerts,
  cashierSessions,
  canCloseStoreDay,
  blockers,
  closeStoreDay,
  actionLoading,
}: any) {
  const sales = overview?.sales || {};
  const invoices = overview?.invoices || {};
  const payments = overview?.payments || {};
  const sessions = overview?.sessions || {};
  const inventory = overview?.inventory || {};

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Today Sales"
          value={formatINR(sales.totalSales)}
          icon={<IndianRupee />}
          tone="orange"
        />
        <KpiCard
          label="Orders"
          value={formatNumber(sales.totalOrders)}
          icon={<ShoppingCart />}
        />
        <KpiCard
          label="Invoices"
          value={formatNumber(invoices.totalInvoices)}
          icon={<FileText />}
        />
        <KpiCard
          label="Due Amount"
          value={formatINR(sales.dueAmount)}
          icon={<AlertTriangle />}
          tone={sales.dueAmount > 0 ? "red" : "green"}
        />
        <KpiCard label="Cash" value={formatINR(payments.CASH)} icon={<Wallet />} />
        <KpiCard
          label="UPI"
          value={formatINR(payments.UPI)}
          icon={<BadgeIndianRupee />}
        />
        <KpiCard label="Card" value={formatINR(payments.CARD)} icon={<CreditCard />} />
        <KpiCard
          label="Cash Difference"
          value={formatINR(sessions.cashDifference)}
          icon={<AlertTriangle />}
          tone={sessions.cashDifference !== 0 ? "red" : "green"}
        />
        <KpiCard
          label="Open Sessions"
          value={formatNumber(sessions.open)}
          icon={<UserRound />}
          tone={sessions.open > 0 ? "amber" : "green"}
        />
        <KpiCard
          label="Auto Verified"
          value={formatNumber(sessions.autoVerified)}
          icon={<CheckCircle2 />}
          tone="green"
        />
        <KpiCard
          label="Low Stock SKUs"
          value={formatNumber(inventory.lowStockSkus)}
          icon={<Boxes />}
          tone={inventory.lowStockSkus > 0 ? "amber" : "green"}
        />
        <KpiCard
          label="Out of Stock"
          value={formatNumber(inventory.outOfStockSkus)}
          icon={<XCircle />}
          tone={inventory.outOfStockSkus > 0 ? "red" : "green"}
        />
      </section>

      <section className="grid xl:grid-cols-3 gap-5">
        <Panel title="Store Status" icon={<Store />}>
          <div className="space-y-3">
            <StatusLine
              label="Store day closing"
              value={canCloseStoreDay ? "Ready to close" : "Blocked"}
              tone={canCloseStoreDay ? "green" : "red"}
            />
            <StatusLine
              label="Total cashier sessions"
              value={String(cashierSessions.length)}
            />
            <StatusLine
              label="Inventory ATP"
              value={formatNumber(inventory.totalAtpQty)}
            />
            <StatusLine
              label="Inventory value"
              value={formatINR(inventory.totalMapValue)}
            />

            {!canCloseStoreDay && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-3">
                <div className="font-black text-red-700 text-sm mb-2">
                  Blockers
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {blockers.map((b: string) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={closeStoreDay}
              disabled={!canCloseStoreDay || actionLoading}
              className="w-full rounded-2xl bg-orange-600 text-white py-3 font-black disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Close Store Day"}
            </button>
          </div>
        </Panel>

        <Panel title="Alerts" icon={<AlertTriangle />}>
          <div className="space-y-2 max-h-[310px] overflow-auto pr-1">
            {alerts?.length ? (
              alerts.map((alert: any, index: number) => (
                <AlertCard key={index} alert={alert} />
              ))
            ) : (
              <Empty text="No critical alerts. Store is running clean." />
            )}
          </div>
        </Panel>

        <Panel title="Payment Split" icon={<CreditCard />}>
          <div className="space-y-3">
            <ProgressLine label="Cash" value={payments.CASH || 0} />
            <ProgressLine label="UPI" value={payments.UPI || 0} />
            <ProgressLine label="Card" value={payments.CARD || 0} />
            <ProgressLine
              label="Mixed/Split"
              value={(payments.MIXED || 0) + (payments.SPLIT || 0)}
            />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function CashiersTab({ sessions, performance }: any) {
  return (
    <div className="space-y-6">
      <Panel title="Cashier Live Sessions" icon={<UserRound />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-orange-900">
              <tr>
                <Th>Cashier</Th>
                <Th>Status</Th>
                <Th>Sales</Th>
                <Th>Cash</Th>
                <Th>UPI</Th>
                <Th>Card</Th>
                <Th>Expected Cash</Th>
                <Th>Actual Cash</Th>
                <Th>Difference</Th>
                <Th>Invoices</Th>
                <Th>Session</Th>
              </tr>
            </thead>
            <tbody>
              {sessions?.map((s: any) => (
                <tr key={s.sessionId} className="border-t">
                  <Td>
                    <div className="font-bold">{s.cashierName}</div>
                    <div className="text-xs text-gray-500">{s.cashierId}</div>
                  </Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td>{formatINR(s.totalSales)}</Td>
                  <Td>{formatINR(s.cashSales)}</Td>
                  <Td>{formatINR(s.upiSales)}</Td>
                  <Td>{formatINR(s.cardSales)}</Td>
                  <Td>{formatINR(s.expectedCash)}</Td>
                  <Td>{formatINR(s.closingCash ?? s.actualCash)}</Td>
                  <Td>
                    <span
                      className={
                        Number(s.cashDifference || 0) !== 0
                          ? "text-red-600 font-black"
                          : "text-emerald-600 font-black"
                      }
                    >
                      {formatINR(s.cashDifference)}
                    </span>
                  </Td>
                  <Td>{formatNumber(s.invoiceCount)}</Td>
                  <Td>
                    <div className="text-xs text-gray-500 max-w-[220px] truncate">
                      {s.sessionId}
                    </div>
                  </Td>
                </tr>
              ))}
              {!sessions?.length && (
                <tr>
                  <td colSpan={11}>
                    <Empty text="No cashier sessions found." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Cashier Performance" icon={<BarChart3 />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-orange-900">
              <tr>
                <Th>Cashier</Th>
                <Th>Invoices</Th>
                <Th>Payments</Th>
                <Th>Total Collected</Th>
                <Th>Cash</Th>
                <Th>UPI</Th>
                <Th>Card</Th>
                <Th>Qty Sold</Th>
                <Th>Cash Difference</Th>
              </tr>
            </thead>
            <tbody>
              {performance?.map((p: any) => (
                <tr key={p.sessionId || p.cashierId} className="border-t">
                  <Td>
                    <div className="font-bold">{p.cashierName}</div>
                    <div className="text-xs text-gray-500">{p.cashierId}</div>
                  </Td>
                  <Td>{formatNumber(p.invoiceCount)}</Td>
                  <Td>{formatNumber(p.paymentCount)}</Td>
                  <Td>{formatINR(p.totalCollected)}</Td>
                  <Td>{formatINR(p.cashCollected)}</Td>
                  <Td>{formatINR(p.upiCollected)}</Td>
                  <Td>{formatINR(p.cardCollected)}</Td>
                  <Td>{formatNumber(p.quantitySold)}</Td>
                  <Td>{formatINR(p.cashDifference)}</Td>
                </tr>
              ))}
              {!performance?.length && (
                <tr>
                  <td colSpan={9}>
                    <Empty text="No cashier performance found." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ExceptionsTab({
  sessions,
  alerts,
  auditSummary,
  resolveException,
  actionLoading,
}: any) {
  return (
    <div className="space-y-6">
      <Panel title="Exception Sessions" icon={<AlertTriangle />}>
        <div className="space-y-3">
          {sessions?.map((s: any) => (
            <div
              key={s.sessionId}
              className="rounded-3xl border border-red-200 bg-red-50 p-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <div className="font-black text-red-900">{s.cashierName}</div>
                  <div className="text-xs text-red-700">{s.sessionId}</div>
                  <div className="mt-2 grid sm:grid-cols-4 gap-2 text-sm">
                    <MiniStat label="Sales" value={formatINR(s.totalSales)} />
                    <MiniStat
                      label="Expected Cash"
                      value={formatINR(s.expectedCash)}
                    />
                    <MiniStat
                      label="Actual Cash"
                      value={formatINR(s.closingCash ?? s.actualCash)}
                    />
                    <MiniStat
                      label="Difference"
                      value={formatINR(s.cashDifference)}
                    />
                  </div>
                </div>

                <button
                  onClick={() => resolveException(s)}
                  disabled={actionLoading}
                  className="rounded-2xl bg-red-600 text-white px-4 py-2 font-black text-sm disabled:opacity-50"
                >
                  Resolve All
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {(s.exceptions || []).map((ex: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-white border border-red-100 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-red-900">{ex.type}</div>
                      <div className="text-sm text-red-700">{ex.message}</div>
                      <div className="text-xs text-gray-500">
                        Severity: {ex.severity} · Status: {ex.status}
                      </div>
                    </div>

                    {ex.status === "OPEN" && (
                      <button
                        onClick={() => resolveException(s, ex.type)}
                        disabled={actionLoading}
                        className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-xs font-black"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!sessions?.length && (
            <Empty text="No exception sessions. Clean sessions are auto-verified." />
          )}
        </div>
      </Panel>

      <section className="grid xl:grid-cols-2 gap-5">
        <Panel title="Alerts" icon={<AlertTriangle />}>
          <div className="space-y-2">
            {alerts?.map((alert: any, index: number) => (
              <AlertCard key={index} alert={alert} />
            ))}
            {!alerts?.length && <Empty text="No alerts found." />}
          </div>
        </Panel>

        <Panel title="Latest Audit Logs" icon={<FileText />}>
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {(auditSummary?.latestLogs || []).map((log: any) => (
              <div key={log._id} className="rounded-2xl border p-3 text-sm">
                <div className="font-black">{log.action}</div>
                <div className="text-gray-500 text-xs">
                  {log.cashierName || log.userName} · {log.module}
                </div>
                <div className="mt-1 text-gray-700">{log.message}</div>
              </div>
            ))}
            {!auditSummary?.latestLogs?.length && (
              <Empty text="No audit logs found." />
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function InventoryTab({
  inventorySummary,
  replenishmentSuggestions,
}: any) {
  const summary = inventorySummary?.summary || {};

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total SKUs"
          value={formatNumber(summary.totalSkus)}
          icon={<Boxes />}
        />
        <KpiCard
          label="ATP Qty"
          value={formatNumber(summary.totalAtpQty)}
          icon={<PackageSearch />}
          tone="green"
        />
        <KpiCard
          label="MAP Value"
          value={formatINR(summary.totalMapValue)}
          icon={<IndianRupee />}
          tone="orange"
        />
        <KpiCard
          label="Out of Stock"
          value={formatNumber(summary.outOfStockSkus)}
          icon={<XCircle />}
          tone={summary.outOfStockSkus > 0 ? "red" : "green"}
        />
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
        <Panel title="LOB-wise ATP / Value" icon={<BarChart3 />}>
          <SimpleAggTable
            rows={inventorySummary?.byLob || []}
            columns={[
              ["_id", "LOB"],
              ["skus", "SKUs"],
              ["atpQty", "ATP"],
              ["mapValue", "MAP Value"],
            ]}
          />
        </Panel>

        <Panel title="Category-wise ATP / Value" icon={<Boxes />}>
          <SimpleAggTable
            rows={inventorySummary?.byCategory || []}
            columns={[
              ["_id", "Category"],
              ["skus", "SKUs"],
              ["atpQty", "ATP"],
              ["mapValue", "MAP Value"],
            ]}
          />
        </Panel>
      </section>

      <Panel title="Low / Limited Stock Products" icon={<AlertTriangle />}>
        <InventoryProductTable rows={inventorySummary?.lowStock || []} />
      </Panel>

      <Panel title="Replenishment Suggestions from RDC / MDC" icon={<RefreshCcw />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-orange-900">
              <tr>
                <Th>Product</Th>
                <Th>Store ATP</Th>
                <Th>Source</Th>
                <Th>Source ATP</Th>
                <Th>Suggested Qty</Th>
                <Th>Priority</Th>
              </tr>
            </thead>
            <tbody>
              {replenishmentSuggestions?.map((x: any, i: number) => (
                <tr key={`${x.sku}-${i}`} className="border-t">
                  <Td>
                    <div className="font-bold">{x.productName}</div>
                    <div className="text-xs text-gray-500">{x.sku}</div>
                  </Td>
                  <Td>{formatNumber(x.storeAtpQty)}</Td>
                  <Td>
                    <div className="font-bold">{x.sourceSiteName}</div>
                    <div className="text-xs text-gray-500">
                      {x.sourceLocationType} · {x.sourceSiteCode}
                    </div>
                  </Td>
                  <Td>{formatNumber(x.sourceAtpQty)}</Td>
                  <Td>{formatNumber(x.suggestedTransferQty)}</Td>
                  <Td>
                    <PriorityBadge priority={x.priority} />
                  </Td>
                </tr>
              ))}
              {!replenishmentSuggestions?.length && (
                <tr>
                  <td colSpan={6}>
                    <Empty text="No replenishment suggestions found." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function CatalogTab({ catalogSummary }: any) {
  const summary = catalogSummary?.summary || {};
  const categories = catalogSummary?.categories || [];
  const products = catalogSummary?.topSellableProducts || [];

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Catalog Rows"
          value={formatNumber(summary.catalogRows)}
          icon={<PackageSearch />}
        />
        <KpiCard
          label="Sellable Products"
          value={formatNumber(summary.sellableProducts)}
          icon={<CheckCircle2 />}
          tone="green"
        />
        <KpiCard
          label="Blocked Products"
          value={formatNumber(summary.blockedProducts)}
          icon={<XCircle />}
          tone={summary.blockedProducts > 0 ? "red" : "green"}
        />
        <KpiCard
          label="Catalog Value"
          value={formatINR(summary.catalogValue)}
          icon={<IndianRupee />}
          tone="orange"
        />
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
        <Panel title="Top Categories" icon={<Boxes />}>
          <SimpleAggTable
            rows={categories}
            columns={[
              ["name", "Category"],
              ["productCount", "Products"],
              ["storeAtpQty", "Store ATP"],
              ["totalMapValue", "Value"],
            ]}
          />
        </Panel>

        <Panel title="Top Sellable Products" icon={<PackageSearch />}>
          <InventoryProductTable rows={products} />
        </Panel>
      </section>
    </div>
  );
}

function CustomersTab({ customerSummary }: any) {
  const summary = customerSummary?.summary || {};

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Customers"
          value={formatNumber(summary.customers)}
          icon={<Users />}
        />
        <KpiCard
          label="Customer Spend"
          value={formatINR(summary.totalSpend)}
          icon={<IndianRupee />}
          tone="orange"
        />
        <KpiCard
          label="Customer Paid"
          value={formatINR(summary.totalPaid)}
          icon={<CheckCircle2 />}
          tone="green"
        />
        <KpiCard
          label="Customer Due"
          value={formatINR(summary.totalDue)}
          icon={<AlertTriangle />}
          tone={summary.totalDue > 0 ? "red" : "green"}
        />
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
        <Panel title="Top Customers" icon={<Users />}>
          <CustomerTable rows={customerSummary?.topCustomers || []} />
        </Panel>

        <Panel title="New Customers Today" icon={<Users />}>
          <CustomerTable rows={customerSummary?.newCustomers || []} />
        </Panel>
      </section>
    </div>
  );
}

function ClosingTab({
  businessDate,
  sessions,
  openSessions,
  autoVerifiedSessions,
  exceptionSessions,
  canCloseStoreDay,
  blockers,
  closeStoreDay,
  actionLoading,
}: any) {
  return (
    <div className="space-y-6">
      <section
        className={`rounded-3xl border p-6 ${
          canCloseStoreDay
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black mb-2">
              <CalendarDays className="h-4 w-4" />
              {businessDate}
            </div>
            <h2
              className={`text-2xl font-black ${
                canCloseStoreDay ? "text-emerald-900" : "text-red-900"
              }`}
            >
              {canCloseStoreDay
                ? "Store is ready to close"
                : "Store day closing is blocked"}
            </h2>
            <p className="text-sm mt-1 text-gray-700">
              Normal sessions are auto-verified. Manager resolves only
              exception sessions before closing the store day.
            </p>
          </div>

          <button
            onClick={closeStoreDay}
            disabled={!canCloseStoreDay || actionLoading}
            className="rounded-2xl bg-orange-600 text-white px-6 py-3 font-black disabled:opacity-50"
          >
            {actionLoading ? "Processing..." : "Close Store Day"}
          </button>
        </div>

        {!canCloseStoreDay && (
          <div className="mt-5 rounded-2xl bg-white border p-4">
            <div className="font-black text-red-700 mb-2">Blockers</div>
            <ul className="text-sm text-red-700 space-y-1">
              {blockers.map((b: string) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Sessions"
          value={formatNumber(sessions.length)}
          icon={<UserRound />}
        />
        <KpiCard
          label="Open"
          value={formatNumber(openSessions.length)}
          icon={<AlertTriangle />}
          tone={openSessions.length ? "red" : "green"}
        />
        <KpiCard
          label="Auto Verified"
          value={formatNumber(autoVerifiedSessions.length)}
          icon={<CheckCircle2 />}
          tone="green"
        />
        <KpiCard
          label="Exceptions"
          value={formatNumber(exceptionSessions.length)}
          icon={<XCircle />}
          tone={exceptionSessions.length ? "red" : "green"}
        />
      </section>

      <Panel title="Closing Session Status" icon={<ClipboardCheck />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-orange-900">
              <tr>
                <Th>Cashier</Th>
                <Th>Status</Th>
                <Th>Total Sales</Th>
                <Th>Expected Cash</Th>
                <Th>Actual Cash</Th>
                <Th>Difference</Th>
                <Th>Exceptions</Th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s: any) => (
                <tr key={s.sessionId} className="border-t">
                  <Td>{s.cashierName}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td>{formatINR(s.totalSales)}</Td>
                  <Td>{formatINR(s.expectedCash)}</Td>
                  <Td>{formatINR(s.closingCash ?? s.actualCash)}</Td>
                  <Td>{formatINR(s.cashDifference)}</Td>
                  <Td>{formatNumber(s.exceptionCount)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "orange" | "green" | "red" | "amber";
}) {
  const toneClass =
    tone === "orange"
      ? "bg-orange-50 text-orange-700"
      : tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-50 text-slate-700";

  return (
    <div className="rounded-3xl bg-white border shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500 font-semibold">{label}</div>
          <div className="mt-2 text-2xl font-black text-gray-950">{value}</div>
        </div>
        <div className={`h-11 w-11 rounded-2xl grid place-items-center ${toneClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white border shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-2xl bg-orange-50 text-orange-600 grid place-items-center">
          {icon}
        </div>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();

  const cls =
    s === "AUTO_VERIFIED" || s === "RESOLVED" || s === "STORE_DAY_CLOSED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "OPEN"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : s === "EXCEPTION_FLAGGED" || s === "REJECTED"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-black ${cls}`}>
      {s || "UNKNOWN"}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = String(priority || "").toUpperCase();

  const cls =
    p === "HIGH"
      ? "bg-red-50 text-red-700 border-red-200"
      : p === "MEDIUM"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-black ${cls}`}>
      {p || "LOW"}
    </span>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const severity = String(alert?.severity || "").toUpperCase();

  const cls =
    severity === "HIGH"
      ? "bg-red-50 border-red-200 text-red-800"
      : severity === "MEDIUM"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-blue-50 border-blue-200 text-blue-800";

  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <div className="text-xs font-black">{alert.type}</div>
      <div className="text-sm mt-1">{alert.message}</div>
    </div>
  );
}

function StatusLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "red";
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border p-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={`font-black ${
          tone === "green"
            ? "text-emerald-600"
            : tone === "red"
            ? "text-red-600"
            : "text-gray-950"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold">{label}</span>
        <span>{formatINR(value)}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-orange-500"
          style={{ width: `${Math.min(Math.max(value / 10000, 5), 100)}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border p-2">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="font-black">{value}</div>
    </div>
  );
}

function SimpleAggTable({
  rows,
  columns,
}: {
  rows: any[];
  columns: [string, string][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 text-orange-900">
          <tr>
            {columns.map((c) => (
              <Th key={c[0]}>{c[1]}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((row, index) => (
            <tr key={row._id || row.name || index} className="border-t">
              {columns.map((c) => (
                <Td key={c[0]}>
                  {typeof row[c[0]] === "number"
                    ? c[0].toLowerCase().includes("value")
                      ? formatINR(row[c[0]])
                      : formatNumber(row[c[0]])
                    : row[c[0]] || "—"}
                </Td>
              ))}
            </tr>
          ))}
          {!rows?.length && (
            <tr>
              <td colSpan={columns.length}>
                <Empty text="No records found." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function InventoryProductTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 text-orange-900">
          <tr>
            <Th>Product</Th>
            <Th>LOB</Th>
            <Th>Category</Th>
            <Th>ATP</Th>
            <Th>Stock</Th>
            <Th>Value</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((x: any) => (
            <tr key={x._id || x.inventoryId || x.sku} className="border-t">
              <Td>
                <div className="font-bold">{x.productName}</div>
                <div className="text-xs text-gray-500">{x.sku}</div>
              </Td>
              <Td>{x.lob}</Td>
              <Td>{x.category}</Td>
              <Td>{formatNumber(x.atpQty)}</Td>
              <Td>{formatNumber(x.stockQty)}</Td>
              <Td>{formatINR(x.mapValue)}</Td>
              <Td>
                <StatusBadge status={x.stockStatus} />
              </Td>
            </tr>
          ))}
          {!rows?.length && (
            <tr>
              <td colSpan={7}>
                <Empty text="No products found." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CustomerTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 text-orange-900">
          <tr>
            <Th>Customer</Th>
            <Th>Phone</Th>
            <Th>Spend</Th>
            <Th>Paid</Th>
            <Th>Due</Th>
            <Th>Invoices</Th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((x: any) => (
            <tr key={x._id || x.customerId} className="border-t">
              <Td>
                <div className="font-bold">{x.customerName || x.name}</div>
                <div className="text-xs text-gray-500">{x.customerId}</div>
              </Td>
              <Td>{x.customerPhone || x.phone || x.mobile}</Td>
              <Td>{formatINR(x.totalSpend || x.totalSpent)}</Td>
              <Td>{formatINR(x.totalPaid)}</Td>
              <Td>{formatINR(x.totalDue)}</Td>
              <Td>{formatNumber(x.invoiceCount)}</Td>
            </tr>
          ))}
          {!rows?.length && (
            <tr>
              <td colSpan={6}>
                <Empty text="No customers found." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left p-3 whitespace-nowrap">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="p-3 align-top whitespace-nowrap">{children}</td>;
}

function Empty({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-gray-500">{text}</div>;
}
