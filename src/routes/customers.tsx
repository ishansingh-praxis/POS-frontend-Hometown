import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  getCustomersApi,
  getCustomerSummaryApi,
  getCustomerProfileApi,
  createCustomerApi,
  updateCustomerApi,
  type ApiCustomer,
} from "@/services/customerService";
import {
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Plus,
  Search,
  X,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Building2,
  IndianRupee,
  Loader2,
  RefreshCcw,
} from "lucide-react";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const TYPES = ["All", "B2C", "B2B", "Retail", "Business", "Corporate"];

const BLANK: Partial<ApiCustomer> = {
  name: "",
  customerName: "",
  phone: "",
  customerPhone: "",
  email: "",
  customerType: "B2C",
  deliveryAddresses: [],
  status: "ACTIVE",
};

const getCustomerName = (c: ApiCustomer) => c.customerName || c.name || "Unknown Customer";

const getCustomerPhone = (c: ApiCustomer) =>
  c.customerPhone || c.phone || c.mobile || c.sapCustomerCode || "—";

const getCustomerAmount = (c: ApiCustomer) =>
  c.totalHistoricalSalesValue || c.totalSpent || c.totalSpend || 0;

const getCustomerVisits = (c: ApiCustomer) =>
  c.invoiceCount || c.orderCount || c.transactionRows || 0;

const getCustomerCity = (c: ApiCustomer) =>
  c.primaryCity || c.city || c.primaryAddress?.city || "";

function Customers() {
  const [list, setList] = useState<ApiCustomer[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [selected, setSelected] = useState<ApiCustomer | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [drawer, setDrawer] =
    useState<{ mode: "create" } | { mode: "edit"; customer: ApiCustomer } | null>(
      null
    );

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, any> = {
        page,
        limit,
        search: q,
        sortBy: "sales",
      };

      if (type !== "All") {
        params.customerType = type;
      }

      const [listData, summaryData] = await Promise.all([
        getCustomersApi(params),
        getCustomerSummaryApi(type !== "All" ? { customerType: type } : {}),
      ]);

      setList(listData.items || []);
      setTotal(listData.total || 0);
      setSummary(summaryData);

      if (!selected && listData.items?.length) {
        setSelected(listData.items[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (customer: ApiCustomer) => {
    try {
      setProfileLoading(true);
      setSelected(customer);

      const id =
        customer.customerId ||
        customer.sapCustomerCode ||
        customer.customerPhone ||
        customer.phone ||
        customer._id;

      const data = await getCustomerProfileApi(id);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadCustomers();
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selectedCustomer = profile?.customer || selected;
  const profilePayments = profile?.payments || [];
  const paymentSummary = profile?.paymentSummary || [];

  const save = async (c: Partial<ApiCustomer>) => {
    if (!c.customerName && !c.name) {
      alert("Name is required");
      return;
    }

    if (!c.customerPhone && !c.phone && !c.mobile) {
      alert("Phone is required");
      return;
    }

    if (drawer?.mode === "edit" && drawer.customer._id) {
      const updated = await updateCustomerApi(drawer.customer._id, c);
      setSelected(updated);
    } else {
      const created = await createCustomerApi(c);
      setSelected(created);
    }

    setDrawer(null);
    loadCustomers();
  };

  return (
    <AppShell
      allow={["cashier", "manager", "admin"]}
      title="Customers"
      subtitle="Real SAP + POS customer ledger — purchases, payments, returns"
      actions={
        <div className="flex gap-2">
          <button
            onClick={loadCustomers}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>

          <button
            onClick={() => setDrawer({ mode: "create" })}
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New customer
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat
          icon={ShoppingBag}
          label="Customers"
          value={String(summary?.totalCustomers || total || 0)}
        />
        <Stat
          icon={Building2}
          label="B2B"
          value={String(summary?.b2bCustomers || 0)}
        />
        <Stat
          icon={Phone}
          label="B2C"
          value={String(summary?.b2cCustomers || 0)}
        />
        <Stat
          icon={IndianRupee}
          label="Historical sales"
          value={formatINR(summary?.totalSales || 0)}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="p-4 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, phone, SAP code, city…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-2.5 py-1 rounded-full text-[11px] ${
                    type === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
            {loading && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Loading customers...
              </div>
            )}

            {!loading &&
              list.map((c) => {
                const active = selected?._id === c._id;

                return (
                  <button
                    key={c._id || c.customerId}
                    onClick={() => loadProfile(c)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                      active ? "bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full grid place-items-center font-display ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {getCustomerName(c).charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {getCustomerName(c)}
                        </span>

                        {c.customerType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/15 text-secondary">
                            {c.customerType}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mt-0.5">
                        {getCustomerPhone(c)}
                      </div>

                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {getCustomerCity(c) || "No city"} ·{" "}
                        {getCustomerVisits(c)} visits ·{" "}
                        {formatINR(getCustomerAmount(c))}
                      </div>
                    </div>

                    {Number(c.returnOrCancelRows || 0) > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning-foreground">
                        {c.returnOrCancelRows} returns
                      </span>
                    )}
                  </button>
                );
              })}

            {!loading && list.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No customers match.
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
            <span>
              Page {page} · {total} customers
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {selectedCustomer && (
          <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <div className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-2xl truncate">
                  {getCustomerName(selectedCustomer)}
                </div>

                <div className="text-sm text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {getCustomerPhone(selectedCustomer)}
                  </span>

                  {selectedCustomer.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedCustomer.email}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedCustomer.customerType || "Customer"}
                  </span>

                  {selectedCustomer.sapCustomerCode && (
                    <span className="font-mono text-xs">
                      SAP {selectedCustomer.sapCustomerCode}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() =>
                  setDrawer({ mode: "edit", customer: selectedCustomer })
                }
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted"
              >
                Edit profile
              </button>
            </div>

            <div className="p-5 grid sm:grid-cols-3 gap-3 border-b border-border">
              <Stat
                icon={IndianRupee}
                label="Total spent"
                value={formatINR(getCustomerAmount(selectedCustomer))}
              />
              <Stat
                icon={ShoppingBag}
                label="Invoices"
                value={String(selectedCustomer.invoiceCount || 0)}
              />
              <Stat
                icon={AlertCircle}
                label="Returns"
                value={String(selectedCustomer.returnOrCancelRows || 0)}
                tone={selectedCustomer.returnOrCancelRows ? "warning" : undefined}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-5 p-5">
              <Card title="Saved address">
                <AddressRow
                  tag="Primary"
                  a={{
                    line:
                      selectedCustomer.primaryAddress?.addressLine1 ||
                      selectedCustomer.primaryAddress?.addressLine2 ||
                      "No address",
                    city: getCustomerCity(selectedCustomer),
                    pin: selectedCustomer.primaryAddress?.postalCode || "",
                  }}
                />
              </Card>

              <Card title="SAP payment summary">
                {paymentSummary.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    No payment summary found.
                  </div>
                )}

                {paymentSummary.map((p: any) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0 border-border/60"
                  >
                    <div>
                      <div className="text-sm font-medium">{p._id || "OTHER"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.count} transactions
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatINR(p.amount)}
                    </div>
                  </div>
                ))}
              </Card>

              <Card title="Payment / invoice history" className="lg:col-span-2">
                {profileLoading && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Loading profile...
                  </div>
                )}

                {!profileLoading && (
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium py-1.5">Invoice</th>
                        <th className="text-left font-medium">Store</th>
                        <th className="text-left font-medium">Date</th>
                        <th className="text-left font-medium">Type</th>
                        <th className="text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profilePayments.map((p: any) => (
                        <tr key={p._id} className="border-t border-border/60">
                          <td className="py-2 font-mono text-xs">
                            {p.sapBillingDocument || p.invoiceId || p.paymentId}
                          </td>
                          <td className="py-2">
                            {p.storeOrPlant || p.storeName || p.storeCode}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">
                            {p.paymentDate || p.paidAt || "—"}
                          </td>
                          <td className="py-2 text-xs">
                            {p.transactionType || p.paymentStatus}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {formatINR(p.amount)}
                          </td>
                        </tr>
                      ))}

                      {profilePayments.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-4 text-center text-xs text-muted-foreground"
                          >
                            No payment history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </Card>

              <Card title="Return / cancel profile" className="lg:col-span-2">
                <div className="flex items-center gap-3 py-2">
                  <RotateCcw className="h-4 w-4 text-destructive" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {selectedCustomer.returnOrCancelRows || 0} return/cancel rows
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Return rate:{" "}
                      {selectedCustomer.returnOrCancelRatePercent || 0}%
                    </div>
                  </div>
                  <div className="text-sm font-medium text-destructive">
                    SAP historical
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}
      </div>

      {drawer && (
        <CustomerDrawer
          initial={drawer.mode === "create" ? BLANK : drawer.customer}
          mode={drawer.mode}
          onClose={() => setDrawer(null)}
          onSave={save}
        />
      )}
    </AppShell>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-background p-4 ${className}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "warning";
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === "warning"
          ? "border-warning/30 bg-warning/5"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="font-display text-xl mt-1">{value}</div>
    </div>
  );
}

function AddressRow({
  tag,
  a,
}: {
  tag: string;
  a: { line: string; city: string; pin: string };
}) {
  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-b-0 border-border/60">
      <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
      <div className="flex-1 text-xs">
        <div className="font-medium">{tag}</div>
        <div className="text-muted-foreground">
          {a.line}, {a.city} {a.pin ? `— ${a.pin}` : ""}
        </div>
      </div>
      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
    </div>
  );
}

function CustomerDrawer({
  initial,
  mode,
  onClose,
  onSave,
}: {
  initial: Partial<ApiCustomer>;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (c: Partial<ApiCustomer>) => void;
}) {
  const [form, setForm] = useState<Partial<ApiCustomer>>(initial);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof ApiCustomer>(k: K, v: ApiCustomer[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!(form.customerName || form.name)?.trim()) {
      setErr("Name is required.");
      return;
    }

    if (!(form.customerPhone || form.phone || form.mobile)?.trim()) {
      setErr("Mobile number is required.");
      return;
    }

    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-end sm:place-items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-xl">
            {mode === "create"
              ? "New customer"
              : `Edit ${getCustomerName(initial as ApiCustomer)}`}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 grid sm:grid-cols-2 gap-4">
          <Input
            label="Full name *"
            value={form.customerName || form.name || ""}
            onChange={(v) => {
              set("customerName", v);
              set("name", v);
            }}
          />

          <Input
            label="Mobile number *"
            value={form.customerPhone || form.phone || form.mobile || ""}
            onChange={(v) => {
              set("customerPhone", v);
              set("phone", v);
              set("mobile", v);
            }}
            placeholder="+91 ..."
          />

          <Input
            label="Email"
            value={form.email || ""}
            onChange={(v) => set("email", v)}
          />

          <SelectIn
            label="Customer type"
            value={form.customerType || "B2C"}
            onChange={(v) => set("customerType", v)}
            options={["B2C", "B2B", "Retail", "Business", "Corporate"]}
          />

          <Input
            label="GSTIN"
            value={form.gstin || form.gstNumber || ""}
            onChange={(v) => {
              set("gstin", v.toUpperCase());
              set("gstNumber", v.toUpperCase());
            }}
            mono
          />

          <Input
            label="Preferred category"
            value={form.preferredCategory || ""}
            onChange={(v) => set("preferredCategory", v)}
          />

          <div className="sm:col-span-2">
            <Input
              label="City"
              value={form.primaryCity || form.city || ""}
              onChange={(v) => {
                set("primaryCity", v);
                set("city", v);
              }}
            />
          </div>

          {err && (
            <div className="sm:col-span-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {err}
            </div>
          )}

          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {mode === "create" ? "Create customer" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${
          mono ? "font-mono" : ""
        }`}
      />
    </label>
  );
}

function SelectIn({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export default Customers;
