import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@/lib/routerCompat";
import {
  getCurrentSessionApi,
  type PosSession,
} from "@/services/cashierService";
import StartShiftModal from "@/components/cashier/StartShiftModal";
import CloseShiftModal from "@/components/cashier/CloseShiftModal";
import { toast } from "sonner";
import {
  Maximize2,
  ShoppingCart,
  ReceiptText,
  IndianRupee,
  Package,
  AlertTriangle,
  StopCircle,
  PlayCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api/pos";

export default function CashierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const [session, setSession] = useState<PosSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showStartShift, setShowStartShift] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);

  const loadDashboard = () => {
    if (!user) return;

    fetch(`${API_BASE}/dashboard/me`, {
      headers: {
        "Content-Type": "application/json",
        ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.message || "Failed to load dashboard");
        setData(json.data);
      })
      .catch((err) => setError(err.message));
  };

  const loadSession = async () => {
    if (!user) return;
    setSessionLoading(true);
    try {
      const cashierId = user.employeeCode || user.username;
      const current = await getCurrentSessionApi({ cashierId });
      setSession(current);
    } catch {
      setSession(null);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  const cards = data?.cards || {};

  return (
    <AppShell title="Cashier Dashboard" subtitle={`${user.store} · ${user.storeName}`}>
      <div className="space-y-6">
        {/* Workspace hero — billing always opens deliberately, not automatically */}
        <div className="rounded-3xl bg-emerald-700 text-white p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-100 font-bold">Cashier Workspace</div>
              <h2 className="text-xl font-black">Ready for Billing</h2>
              <p className="text-sm text-emerald-50 mt-1">
                {session?.status === "OPEN"
                  ? "Your shift is open — open the full billing screen when you're ready to work at the counter."
                  : "Start your shift before opening the billing screen."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!sessionLoading && (!session || session.status !== "OPEN") && (
                <button
                  onClick={() => setShowStartShift(true)}
                  className="rounded-2xl bg-white text-emerald-700 px-5 py-3 text-sm font-black hover:bg-emerald-50 inline-flex items-center justify-center gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Start Shift
                </button>
              )}

              {session?.status === "OPEN" && (
                <button
                  onClick={() => setShowCloseShift(true)}
                  className="rounded-2xl bg-emerald-800 text-white px-5 py-3 text-sm font-black hover:bg-emerald-900 inline-flex items-center justify-center gap-2"
                >
                  <StopCircle className="h-4 w-4" />
                  Close Shift
                </button>
              )}

              <button
                onClick={() => navigate("/cashier/billing")}
                disabled={!session || session.status !== "OPEN"}
                className="rounded-2xl bg-white text-emerald-700 px-5 py-3 text-sm font-black hover:bg-emerald-50 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Maximize2 className="h-4 w-4" />
                Open Full Billing Screen
              </button>
            </div>
          </div>
        </div>

        {error && <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>}
        {!error && !data && <div className="p-4 text-sm text-muted-foreground">Loading dashboard...</div>}

        {data && (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <Card tone="green" icon={<ShoppingCart className="h-4.5 w-4.5" />} label="My Store Orders" value={cards.totalOrders} />
              <Card tone="green" icon={<ReceiptText className="h-4.5 w-4.5" />} label="Invoices" value={cards.totalInvoices} />
              <Card tone="emerald" icon={<IndianRupee className="h-4.5 w-4.5" />} label="Sales" value={`₹${cards.totalSales || 0}`} />
              <Card tone="default" icon={<Package className="h-4.5 w-4.5" />} label="Products Available" value={cards.inventoryRows} />
              <Card tone="amber" icon={<AlertTriangle className="h-4.5 w-4.5" />} label="Low Stock" value={cards.lowStock} />
              <Card tone="emerald" icon={<IndianRupee className="h-4.5 w-4.5" />} label="Paid" value={`₹${cards.totalPaid || 0}`} />
              <Card tone="amber" icon={<IndianRupee className="h-4.5 w-4.5" />} label="Due" value={`₹${cards.totalDue || 0}`} />
            </div>

            <Section title="Recent Invoices">
              <DataList rows={data.recentInvoices || []} />
            </Section>
          </>
        )}
      </div>

      {showStartShift && (
        <StartShiftModal
          user={user}
          onClose={() => setShowStartShift(false)}
          onStarted={(created) => {
            setSession(created);
            setShowStartShift(false);
            toast.success("Shift started");
          }}
          locked={false}
        />
      )}

      {showCloseShift && session && (
        <CloseShiftModal
          session={session}
          onClose={() => setShowCloseShift(false)}
          onClosed={() => {
            setShowCloseShift(false);
            setSession(null);
            loadSession();
          }}
        />
      )}
    </AppShell>
  );
}

function Card({ icon, label, value, tone = "default" }: any) {
  const toneClass =
    tone === "emerald" ? "bg-emerald-500/10 text-emerald-600" :
    tone === "green" ? "bg-green-500/10 text-green-600" :
    tone === "amber" ? "bg-amber-500/10 text-amber-600" :
    "bg-primary/10 text-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">{label}</div>
        <div className={`h-9 w-9 rounded-xl grid place-items-center ${toneClass}`}>{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-display">{value ?? 0}</div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-base mb-3">{title}</h2>
      {children}
    </section>
  );
}

function DataList({ rows }: { rows: any[] }) {
  if (!rows.length) {
    return <div className="text-sm text-muted-foreground">No data found.</div>;
  }

  return (
    <div className="space-y-2">
      {rows.slice(0, 10).map((row: any, index: number) => (
        <div key={row._id || row.invoiceId || index} className="rounded-xl border border-border p-3 text-sm flex justify-between">
          <div>
            <div className="font-medium">{row.invoiceId}</div>
            <div className="text-muted-foreground">
              {row.customerName || row.customer?.customerName || row.orderStatus || ""}
            </div>
          </div>
          <div className="font-semibold">₹{Math.round(row.grandTotal || row.billing?.grandTotal || 0)}</div>
        </div>
      ))}
    </div>
  );
}
