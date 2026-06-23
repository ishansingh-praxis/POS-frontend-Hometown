import { AppShell } from "@/components/AppShell";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { MonitorSmartphone, LogOut, ShieldAlert } from "lucide-react";


function timeAgo(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

function Sessions() {
  const { sessions, revokeSession, user } = useAuth();
  return (
    <AppShell
      allow={["admin"]}
      title="Active Sessions"
      subtitle="Devices currently signed into the POS network"
      actions={
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          <MonitorSmartphone className="h-3.5 w-3.5" /> {sessions.length} live
        </span>
      }
    >
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">User</th>
              <th className="text-left font-medium px-3 py-2.5">Role</th>
              <th className="text-left font-medium px-3 py-2.5">Store</th>
              <th className="text-left font-medium px-3 py-2.5">Device</th>
              <th className="text-left font-medium px-3 py-2.5">IP</th>
              <th className="text-left font-medium px-3 py-2.5">Signed in</th>
              <th className="text-left font-medium px-3 py-2.5">Last active</th>
              <th className="text-right font-medium px-5 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">No active sessions.</td></tr>
            )}
            {sessions.map((s) => (
              <tr key={s.deviceId} className="border-t border-border/60">
                <td className="px-5 py-3">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{s.username}</div>
                </td>
                <td className="px-3 py-3 text-xs">{ROLE_LABELS[s.role]}</td>
                <td className="px-3 py-3 text-xs">{s.storeName}</td>
                <td className="px-3 py-3">
                  <div className="text-sm">{s.deviceLabel}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{s.deviceId}</div>
                </td>
                <td className="px-3 py-3 font-mono text-xs">{s.ip}</td>
                <td className="px-3 py-3 text-xs">{timeAgo(s.loginAt)}</td>
                <td className="px-3 py-3 text-xs">{timeAgo(s.lastActive)}</td>
                <td className="px-5 py-3 text-right">
                  {user?.deviceId === s.deviceId ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success">This device</span>
                  ) : (
                    <button
                      onClick={() => revokeSession(s.deviceId)}
                      className="text-xs px-2.5 py-1 rounded-md text-destructive border border-destructive/30 hover:bg-destructive/10 inline-flex items-center gap-1"
                    >
                      <LogOut className="h-3 w-3" /> Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-warning-foreground mt-0.5" />
        <div className="text-xs text-warning-foreground/90">
          Sessions auto-expire after 30 minutes of inactivity. Revoking a session signs the device
          out immediately — the cashier must log in again to resume billing.
        </div>
      </div>
    </AppShell>
  );
}

export default Sessions;
