import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/pos-data";
import {
  getCurrentSessionApi,
  getInvoicesApi,
  type PosSession,
} from "@/services/cashierService";
import { getPaymentsApi, type ApiPayment } from "@/services/paymentService";
import StartShiftModal from "@/components/cashier/StartShiftModal";
import CloseShiftModal from "@/components/cashier/CloseShiftModal";
import {
  Wallet,
  ReceiptText,
  CreditCard,
  IndianRupee,
  Smartphone,
  RefreshCcw,
  PlayCircle,
  StopCircle,
} from "lucide-react";

function CashierShift() {
  const { user } = useAuth();
  const cashierId = user?.employeeCode || user?.username || "";
  const storeCode = user?.store && user.store !== "ALL" ? user.store : "";

  const [session, setSession] = useState<PosSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<ApiPayment[]>([]);

  const [showStart, setShowStart] = useState(false);
  const [showClose, setShowClose] = useState(false);

  const load = async () => {
    setSessionLoading(true);

    try {
      const current = await getCurrentSessionApi({ cashierId });
      setSession(current);
    } catch {
      setSession(null);
    } finally {
      setSessionLoading(false);
    }

    try {
      const [invoiceData, paymentData] = await Promise.all([
        getInvoicesApi({ storeCode, cashierId, limit: 10 }),
        getPaymentsApi({ storeCode, cashierId, limit: 10 }),
      ]);

      setInvoices(invoiceData.data || []);
      setPayments(paymentData.items || []);
    } catch {
      // ignore — session card still renders
    }
  };

  useEffect(() => {
    if (user?.token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <AppShell
      allow={["cashier", "manager"]}
      title="My Shift"
      subtitle={`${user.name} · ${user.storeName || ""}`}
      actions={
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      <div className="rounded-2xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground p-5 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-sm text-primary-foreground/80">Current session</div>
          <div className="text-xl font-display">{session ? "OPEN" : sessionLoading ? "Checking…" : "NO OPEN SHIFT"}</div>
          <div className="text-xs text-primary-foreground/80 font-mono">
            {session?.sessionId || "Start a shift before billing"}
          </div>
        </div>

        <div className="flex gap-2">
          {!session && !sessionLoading && (
            <button
              onClick={() => setShowStart(true)}
              className="rounded-lg bg-white text-primary px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5"
            >
              <PlayCircle className="h-4 w-4" /> Start shift
            </button>
          )}

          {session && (
            <button
              onClick={() => setShowClose(true)}
              className="rounded-lg bg-white/20 border border-white/30 px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5"
            >
              <StopCircle className="h-4 w-4" /> Close shift
            </button>
          )}
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Stat icon={<IndianRupee className="h-4 w-4" />} label="Total sales" value={formatINR(session?.totalSales || 0)} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="Cash sales" value={formatINR(session?.cashSales || 0)} />
        <Stat icon={<Smartphone className="h-4 w-4" />} label="UPI sales" value={formatINR(session?.upiSales || 0)} />
        <Stat icon={<CreditCard className="h-4 w-4" />} label="Card sales" value={formatINR(session?.cardSales || 0)} />
        <Stat icon={<ReceiptText className="h-4 w-4" />} label="Invoices" value={String(session?.invoiceCount || 0)} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="Expected cash" value={formatINR(session?.expectedCash || 0)} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="Opening cash" value={formatINR(session?.openingCash || 0)} />
        <Stat icon={<ReceiptText className="h-4 w-4" />} label="Payments" value={String(session?.paymentCount || 0)} />
      </section>

      <section className="grid lg:grid-cols-2 gap-5">
        <Panel title="Recent invoices">
          <Table
            rows={invoices}
            columns={[
              ["invoiceId", "Invoice"],
              ["customerPhone", "Customer"],
              ["grandTotal", "Amount"],
              ["invoiceStatus", "Status"],
            ]}
            getCell={(row: any, key: string) => {
              if (key === "customerPhone") return row.customer?.customerPhone || "—";
              if (key === "grandTotal") return formatINR(row.billing?.grandTotal || 0);
              return row[key] ?? "—";
            }}
          />
        </Panel>

        <Panel title="Recent payments">
          <Table
            rows={payments}
            columns={[
              ["paymentId", "Payment"],
              ["invoiceId", "Invoice"],
              ["paymentMode", "Mode"],
              ["amount", "Amount"],
            ]}
            getCell={(row: any, key: string) => (key === "amount" ? formatINR(row.amount || 0) : row[key] ?? "—")}
          />
        </Panel>
      </section>

      {showStart && (
        <StartShiftModal
          user={user}
          locked={false}
          onClose={() => setShowStart(false)}
          onStarted={(created) => {
            setSession(created);
            setShowStart(false);
          }}
        />
      )}

      {showClose && session && (
        <CloseShiftModal
          session={session}
          onClose={() => setShowClose(false)}
          onClosed={() => {
            setSession(null);
            setShowClose(false);
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center">{icon}</div>
      </div>
      <div className="mt-2 text-xl font-display">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-base mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Table({
  rows,
  columns,
  getCell,
}: {
  rows: any[];
  columns: [string, string][];
  getCell: (row: any, key: string) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="text-left">
            {columns.map(([key, label]) => (
              <th key={key} className="py-1.5 pr-2">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id || i} className="border-t border-border">
              {columns.map(([key]) => (
                <td key={key} className="py-1.5 pr-2">{getCell(row, key)}</td>
              ))}
            </tr>
          ))}

          {!rows.length && (
            <tr>
              <td colSpan={columns.length} className="py-4 text-center text-muted-foreground">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CashierShift;
