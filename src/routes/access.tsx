import { AppShell } from "@/components/AppShell";
import { ROLE_LABELS, ROLE_PERMISSIONS, PERMISSION_LABELS, STORES, demoCredentials, type Role, type Permission } from "@/lib/auth";
import { Check, X, ShieldCheck, Users } from "lucide-react";


const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];
const ROLES: Role[] = ["cashier", "manager", "admin"];

const USERS = [
  { name: "Ravi Kumar",    username: "cashier",  role: "cashier" as Role,   store: "GWL-CTY", active: true },
  { name: "Anita Sharma",  username: "manager",  role: "manager" as Role,   store: "BLR-IND", active: true },
  { name: "Vikram Rao",    username: "admin",    role: "admin" as Role,     store: "ALL",     active: true },
  { name: "Pooja Iyer",    username: "pooja.c",  role: "cashier" as Role,   store: "DEL-SKT", active: true },
  { name: "Arjun Mehta",   username: "arjun.m",  role: "manager" as Role,   store: "MUM-LBS", active: false },
];

function Access() {
  void demoCredentials; // imported to keep types
  return (
    <AppShell
      allow={["admin"]}
      title="Access Control"
      subtitle="Roles, permissions and store-bound users"
      actions={
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> 3 roles · {Object.keys(STORES).length - 1} stores
        </span>
      }
    >
      {/* Users */}
      <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg flex items-center gap-2"><Users className="h-4 w-4" /> Users</h2>
            <p className="text-xs text-muted-foreground">Each user is bound to a single store (or HQ-wide)</p>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">+ Invite user</button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Name</th>
              <th className="text-left font-medium px-3 py-2.5">Username</th>
              <th className="text-left font-medium px-3 py-2.5">Role</th>
              <th className="text-left font-medium px-3 py-2.5">Store</th>
              <th className="text-left font-medium px-3 py-2.5">Status</th>
              <th className="text-right font-medium px-5 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((u) => (
              <tr key={u.username} className="border-t border-border/60">
                <td className="px-5 py-3 font-medium">{u.name}</td>
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{u.username}</td>
                <td className="px-3 py-3">{ROLE_LABELS[u.role]}</td>
                <td className="px-3 py-3 text-xs">{STORES[u.store as keyof typeof STORES]}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {u.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-xs text-primary hover:underline mr-3">Edit</button>
                  <button className="text-xs text-destructive hover:underline">{u.active ? "Disable" : "Enable"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Permission matrix */}
      <section className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-display text-lg">Permission Matrix</h2>
          <p className="text-xs text-muted-foreground">What each role can do inside the POS</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40 sticky top-0">
              <tr>
                <th className="text-left font-medium px-5 py-2.5 min-w-[260px]">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="text-center font-medium px-3 py-2.5 whitespace-nowrap">{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((p) => (
                <tr key={p} className="border-t border-border/60">
                  <td className="px-5 py-2.5">
                    <div className="text-sm">{PERMISSION_LABELS[p]}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{p}</div>
                  </td>
                  {ROLES.map((r) => {
                    const has = ROLE_PERMISSIONS[r].includes(p);
                    return (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {has ? (
                          <Check className="h-4 w-4 text-success inline" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 inline" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

export default Access;
