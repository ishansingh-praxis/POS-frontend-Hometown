import { type ReactNode } from "react";
import { LayoutDashboard, LogOut, Maximize2, Minimize2, Store, UserRound, Wifi } from "lucide-react";
import { useNavigate } from "@/lib/routerCompat";
import { useAuth, type AuthUser } from "@/lib/auth";
import { useFullscreen } from "@/hooks/useFullscreen";

export default function PosShell({
  user,
  session,
  actions,
  children,
}: {
  user: AuthUser;
  session: { status?: string } | null;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();

  const goDashboard = async () => {
    await exitFullscreen();
    navigate("/cashier/dashboard");
  };

  const handleLogout = async () => {
    await exitFullscreen();
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen overflow-hidden bg-emerald-50 text-slate-800">
      <header className="h-14 bg-emerald-700 text-white px-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-white text-emerald-700 grid place-items-center font-black text-sm shrink-0">
            HT
          </div>

          <div className="min-w-0">
            <div className="text-sm font-black leading-tight truncate">HomeTown POS</div>
            <div className="text-[10px] text-white/75 truncate">Billing counter workspace</div>
          </div>

          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 max-w-[260px]">
            <Store className="h-3.5 w-3.5 text-emerald-100 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-white/60">Store</div>
              <div className="text-[11px] font-bold truncate">
                {user?.store} · {user?.storeName}
              </div>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 max-w-[220px]">
            <UserRound className="h-3.5 w-3.5 text-emerald-100 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-white/60">Cashier</div>
              <div className="text-[11px] font-bold truncate">{user?.name}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SessionBadge status={session?.status || "NO_SHIFT"} />

          {actions}

          <button
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white text-emerald-700 px-3 py-2 text-xs font-black hover:bg-emerald-50"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? "Reduce" : "Expand"}</span>
          </button>

          <button
            onClick={goDashboard}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white text-emerald-700 px-3 py-2 text-xs font-black hover:bg-emerald-50"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs">
            <Wifi className="h-3.5 w-3.5 text-emerald-100" />
            Online
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-2 text-xs font-bold hover:bg-emerald-900"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <main className="h-[calc(100vh-3.5rem)] overflow-hidden">{children}</main>
    </div>
  );
}

function SessionBadge({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();

  const cls =
    s === "OPEN"
      ? "bg-emerald-100 text-emerald-800"
      : s === "AUTO_VERIFIED" || s === "RESOLVED"
      ? "bg-green-100 text-green-800"
      : s === "EXCEPTION_FLAGGED"
      ? "bg-rose-100 text-rose-800"
      : "bg-slate-100 text-slate-700";

  return <div className={`rounded-xl px-3 py-2 text-[11px] font-black ${cls}`}>{s}</div>;
}
