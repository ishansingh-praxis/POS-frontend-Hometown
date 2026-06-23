import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/auth";
import { ShieldCheck, ShieldOff, ShieldQuestion } from "lucide-react";

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

function MyCapabilities() {
  const { user } = useAuth();

  if (!user) return null;

  const granted = new Set(ROLE_PERMISSIONS[user.role]);

  return (
    <AppShell
      allow={["cashier", "manager", "admin"]}
      title="My Capabilities"
      subtitle={`What ${ROLE_LABELS[user.role]} accounts can and can't do in this POS`}
    >
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary grid place-items-center">
            <ShieldQuestion className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg">{user.name}</div>
            <div className="text-xs text-muted-foreground">
              {ROLE_LABELS[user.role]} · {granted.size} of {ALL_PERMISSIONS.length} permissions granted
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Capability</th>
              <th className="text-left font-medium px-3 py-2.5">Permission key</th>
              <th className="text-right font-medium px-5 py-2.5">Access</th>
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((perm) => {
              const has = granted.has(perm);
              return (
                <tr key={perm} className="border-t border-border/60">
                  <td className="px-5 py-3">{PERMISSION_LABELS[perm]}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{perm}</td>
                  <td className="px-5 py-3 text-right">
                    {has ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success">
                        <ShieldCheck className="h-3 w-3" /> Granted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        <ShieldOff className="h-3 w-3" /> Not granted
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

export default MyCapabilities;
