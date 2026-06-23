import { Link, useNavigate, useRouterState, type LinkProps } from "@/lib/routerCompat";
import { useEffect, type ReactNode } from "react";
import logo from "@/assets/hometown_logo.png";
import { useAuth, ROLE_LABELS, type Role } from "@/lib/auth";
import {
  LayoutDashboard, ScanBarcode, Package, Users, Receipt, Store, BarChart3, RefreshCcw, LogOut,
  Wallet, ShieldCheck, MonitorSmartphone, Building2, Percent, CreditCard,
  FileText, Globe, Settings as SettingsIcon,
  FolderTree, Printer, TicketPercent, Clock, Boxes,
} from "lucide-react";

type NavItem = { to: LinkProps["to"]; label: string; icon: ReactNode; group: string; roles: Role[] };

const nav: NavItem[] = [
  { to: "/cashier/dashboard", label: "Dashboard", icon: <Store className="h-4 w-4" />, group: "Counter", roles: ["cashier"] },
  { to: "/cashier/billing", label: "Billing Screen", icon: <ScanBarcode className="h-4 w-4" />, group: "Counter", roles: ["cashier"] },
  { to: "/cashier/shift", label: "My Shift", icon: <Clock className="h-4 w-4" />, group: "Counter", roles: ["cashier"] },
  { to: "/orders", label: "Orders", icon: <Receipt className="h-4 w-4" />, group: "Counter", roles: ["cashier", "manager", "admin"] },
  { to: "/invoices", label: "Invoices", icon: <FileText className="h-4 w-4" />, group: "Counter", roles: ["cashier", "manager", "admin"] },
  { to: "/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" />, group: "Counter", roles: ["cashier", "manager", "admin"] },
  { to: "/customers", label: "Customers", icon: <Users className="h-4 w-4" />, group: "Counter", roles: ["cashier", "manager"] },
  { to: "/manager/dashboard", label: "Store Dashboard", icon: <Store className="h-4 w-4" />, group: "Store", roles: ["manager"] },
  { to: "/inventory", label: "Inventory", icon: <Package className="h-4 w-4" />, group: "Store", roles: ["manager", "admin"] },
  { to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, group: "HQ", roles: ["admin"] },
  { to: "/stores", label: "Stores", icon: <Building2 className="h-4 w-4" />, group: "HQ", roles: ["admin"] },
  { to: "/catalogue", label: "Catalogue", icon: <Package className="h-4 w-4" />, group: "HQ", roles: ["admin", "manager"] },
  { to: "/offers", label: "Discounts & Offers", icon: <Percent className="h-4 w-4" />, group: "HQ", roles: ["admin", "manager"] },
  { to: "/coupons", label: "Coupons", icon: <TicketPercent className="h-4 w-4" />, group: "HQ", roles: ["admin", "manager"] },
  { to: "/online", label: "Online Sales", icon: <Globe className="h-4 w-4" />, group: "HQ", roles: ["admin"] },
  { to: "/reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" />, group: "HQ", roles: ["admin", "manager"] },
  { to: "/accounts", label: "Accounts", icon: <Wallet className="h-4 w-4" />, group: "Finance", roles: ["admin"] },
  { to: "/sap", label: "SAP / ERP Sync", icon: <RefreshCcw className="h-4 w-4" />, group: "Integrations", roles: ["admin"] },
  { to: "/sessions", label: "Active Sessions", icon: <MonitorSmartphone className="h-4 w-4" />, group: "Security", roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: <SettingsIcon className="h-4 w-4" />, group: "Security", roles: ["admin"] },
  { to: "/categories", label: "Categories", icon: <FolderTree className="h-4 w-4" />, group: "HQ", roles: ["admin"] },
  { to: "/manager/categories", label: "Categories", icon: <Boxes className="h-4 w-4" />, group: "HQ", roles: ["manager"] },
  { to: "/hardware", label: "POS Hardware", icon: <Printer className="h-4 w-4" />, group: "Store", roles: ["manager", "admin"] },
  { to: "/my-capabilities", label: "My Capabilities", icon: <ShieldCheck className="h-4 w-4" />, group: "Counter", roles: ["cashier", "manager", "admin"] },
];

const MANAGER_ORDER = [
  "Store Dashboard", "Orders", "Invoices", "Payments", "Customers",
  "Categories", "Catalogue", "Inventory", "Discounts & Offers",
  "Coupons", "POS Hardware", "Reports", "My Capabilities",
];

const ADMIN_ORDER = [
  "Dashboard", "Stores", "Orders", "Invoices", "Payments", "Accounts",
  "Inventory", "Catalogue", "Discounts & Offers", "Coupons", "Categories",
  "Online Sales", "POS Hardware", "Reports", "SAP / ERP Sync",
  "Active Sessions", "Settings", "My Capabilities",
];

const roleLabel = ROLE_LABELS;

export function AppShell({
  children, title, subtitle, actions, allow,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  allow?: Role[];
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/login", search: { redirect: path }, replace: true });
    else if (allow && !allow.includes(user.role))
      navigate({ to: "/login", replace: true });
  }, [user, allow, navigate, path]);

  if (!user) return null;

  const isManager = user.role === "manager";
  const isAdmin = user.role === "admin";
  const managerNav = MANAGER_ORDER
    .map((label) => nav.find((n) => n.label === label && n.roles.includes("manager")))
    .filter((n): n is NavItem => Boolean(n));
  const adminNav = ADMIN_ORDER
    .map((label) => nav.find((n) => n.label === label && n.roles.includes("admin")))
    .filter((n): n is NavItem => Boolean(n));
  const groups = isManager || isAdmin
    ? []
    : Array.from(new Set(nav.filter((n) => n.roles.includes(user.role)).map((n) => n.group)));

  const renderLink = (n: NavItem) => {
    const active = path === n.to;
    return (
      <Link
        key={n.to as string}
        to={n.to}
        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        {n.icon}
        {n.label}
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img src={logo} alt="HomeTown" className="h-10 w-10 rounded-full ring-2 ring-gold/60" />
          <div>
            <div className="font-display text-lg leading-none">HomeTown - POS</div>
            <div className="text-xs text-sidebar-foreground/60 mt-1">Point of Sale</div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {isManager ? (
            <div className="space-y-0.5">{managerNav.map(renderLink)}</div>
          ) : isAdmin ? (
            <div className="space-y-0.5">{adminNav.map(renderLink)}</div>
          ) : (
            groups.map((g) => (
              <div key={g}>
                <div className="px-2 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">{g}</div>
                <div className="space-y-0.5">
                  {nav.filter((n) => n.group === g && n.roles.includes(user.role)).map(renderLink)}
                </div>
              </div>
            ))
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gold text-gold-foreground grid place-items-center text-xs font-semibold">
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{user.name}</div>
            <div className="text-[11px] text-sidebar-foreground/60 truncate">
              {roleLabel[user.role]}{user.store && user.store !== "ALL" ? ` · ${user.storeName}` : ""}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <h1 className="font-display text-2xl text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <span className="md:hidden inline-flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-2 py-1">
                {user.name.split(" ")[0]} · {roleLabel[user.role]}
              </span>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
