// src/pages/Login.tsx

import { useNavigate, useSearch } from "@/lib/routerCompat";
import { useEffect, useMemo, useState } from "react";
import { useAuth, roleHome, ROLE_LABELS, ROLE_BLURB, type Role } from "@/lib/auth";
import { POS_LOGINS, type PosRole } from "@/data/posLogins";
import logo from "@/assets/hometown_logo.png";
import {
  ScanBarcode, Store, LayoutDashboard, Lock, User, AlertCircle, ArrowRight, Search,
} from "lucide-react";

const ROLE_ICONS: Record<Role, typeof Store> = {
  cashier: ScanBarcode,
  manager: Store,
  admin: LayoutDashboard,
};

const ROLE_ORDER: Role[] = ["cashier", "manager", "admin"];

const ROLE_TO_POS_ROLE: Record<Role, PosRole> = {
  cashier: "CASHIER",
  manager: "MANAGER",
  admin: "ADMIN",
};

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });

  const [role, setRole] = useState<Role>("cashier");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [search2, setSearch2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const target = search.redirect && search.redirect !== "/login" ? search.redirect : roleHome[user.role];
      navigate({ to: target, replace: true });
    }
  }, [user, navigate, search.redirect]);

  const roleUsers = useMemo(() => {
    const posRole = ROLE_TO_POS_ROLE[role];
    const needle = search2.toLowerCase();
    return POS_LOGINS.filter((u) => {
      if (u.role !== posRole) return false;
      if (!needle) return true;
      return `${u.name} ${u.email} ${u.storeCode} ${u.storeName}`.toLowerCase().includes(needle);
    });
  }, [role, search2]);

  const selectedUser = useMemo(
    () => POS_LOGINS.find((u) => u.email === selectedEmail) || null,
    [selectedEmail]
  );

  const selectRole = (r: Role) => {
    setRole(r);
    setSearch2("");
    setError(null);
    const first = POS_LOGINS.find((u) => u.role === ROLE_TO_POS_ROLE[r]);
    if (first) {
      setSelectedEmail(first.email);
      setUsername(first.email);
      setPassword(first.password);
    }
  };

  const selectUser = (email: string) => {
    const u = POS_LOGINS.find((item) => item.email === email);
    if (!u) return;
    setSelectedEmail(u.email);
    setUsername(u.email);
    setPassword(u.password);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(username.trim(), password, role);
    setLoading(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* Brand side – unchanged */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center gap-3">
          <img src={logo} alt="HomeTown" className="h-12 w-12 rounded-full ring-2 ring-gold/70" />
          <div>
            <div className="font-display text-2xl leading-none">HomeTown - POS</div>
            <div className="text-xs text-primary-foreground/70 mt-1">Point of Sale System</div>
          </div>
        </div>
        <div className="relative">
          <h1 className="font-display text-5xl leading-tight">
            Point of Sale System.<br />
            <span className="text-gold">Store-bound bills & Inventory Management.</span>
          </h1>
          <p className="mt-5 max-w-md text-primary-foreground/80">
            Every login is tied to a store and a permission set. Cashiers bill,
            managers approve, accounts reconciles, SAP syncs — all auditable.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              ["3", "Role types"],
              ["13+", "Stores"],
              ["AES-256", "Session"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-2xl text-gold">{v}</div>
                <div className="text-[11px] text-primary-foreground/70 uppercase tracking-wider mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-primary-foreground/60">© 2026 HomeTown Retail Pvt. Ltd.</div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logo} alt="HomeTown" className="h-11 w-11 rounded-full ring-2 ring-[#1B3B6F]/40" />
            <div className="font-display text-xl">HomeTown POS</div>
          </div>

          <h2 className="font-display text-3xl text-foreground">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-1.5">Choose your role to continue.</p>

          {/* Role grid */}
          <div className="mt-6 grid grid-cols-3 gap-2 p-1 rounded-xl bg-muted">
            {ROLE_ORDER.map((r) => {
              const Icon = ROLE_ICONS[r];
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => selectRole(r)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-[11px] font-medium leading-tight transition-all ${
                    active ? "bg-card text-[#1B3B6F] shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-center">{ROLE_LABELS[r]}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">{ROLE_BLURB[role]}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">Username</label>
              <div className="mt-1.5 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`e.g. ${roleUsers[0]?.email || "username"}`}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Password</label>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#1B3B6F] text-white font-medium hover:bg-[#142d57] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              Sign in as {ROLE_LABELS[role]}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Demo accounts – searchable real users for selected role */}
          <div className="mt-7 rounded-xl border border-dashed border-border p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              {ROLE_LABELS[role]} accounts — tap to fill ({roleUsers.length} of {POS_LOGINS.filter((u) => u.role === ROLE_TO_POS_ROLE[role]).length})
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                placeholder="Search name, store, email..."
                className="w-full pl-8 pr-3 py-2 rounded-md bg-card border border-input text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            <div className="grid gap-1 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              {roleUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => selectUser(u.email)}
                  className={`flex items-center justify-between text-xs rounded-md px-2.5 py-1.5 text-left hover:bg-muted ${
                    selectedEmail === u.email ? "bg-card text-[#1B3B6F] ring-1 ring-[#1B3B6F]/40" : ""
                  }`}
                >
                  <span className="font-medium text-foreground">{u.serial}. {u.name}</span>
                  <span className="text-muted-foreground font-mono text-[10px] truncate max-w-[150px]">
                    {u.storeCode} · {u.storeName}
                  </span>
                </button>
              ))}
              {roleUsers.length === 0 && (
                <div className="text-xs text-muted-foreground px-2.5 py-1.5">No matches.</div>
              )}
            </div>

            {selectedUser && (
              <div className="mt-3 rounded-lg bg-muted p-3 text-[11px] space-y-1">
                <div><b>Name:</b> {selectedUser.name}</div>
                <div><b>Role:</b> {selectedUser.role}</div>
                <div><b>Store:</b> {selectedUser.storeCode} · {selectedUser.storeName}</div>
                <div><b>Dashboard:</b> {selectedUser.dashboardType}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;