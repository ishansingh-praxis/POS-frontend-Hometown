import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { getCategoriesApi, type ApiCategory } from "@/services/categoryService";
import { formatINR } from "@/lib/pos-data";
import { FolderTree, ChevronRight, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

function Categories() {
  const [lobs, setLobs] = useState<ApiCategory[]>([]);
  const [active, setActive] = useState<string>("");
  const [children, setChildren] = useState<ApiCategory[]>([]);
  const [q, setQ] = useState("");
  const [loadingLobs, setLoadingLobs] = useState(true);
  const [loadingChildren, setLoadingChildren] = useState(false);

  useEffect(() => {
    getCategoriesApi({ level: "LOB", limit: 50 })
      .then((res) => {
        setLobs(res.items);
        if (res.items.length) setActive(res.items[0].slug);
      })
      .catch((err) => toast.error(err.message || "Failed to load categories"))
      .finally(() => setLoadingLobs(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoadingChildren(true);
    getCategoriesApi({ level: "CATEGORY", parentSlug: active, limit: 200 })
      .then((res) => setChildren(res.items))
      .catch(() => setChildren([]))
      .finally(() => setLoadingChildren(false));
  }, [active]);

  const cat = lobs.find((c) => c.slug === active);
  const subs = children.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell title="Category Management" subtitle="LOB → Merc. Category hierarchy, generated from SAP ATP inventory" allow={["admin", "manager"]}>
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <aside className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium"><FolderTree className="h-4 w-4" /> LOBs</div>
          </div>
          {loadingLobs ? (
            <div className="p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...</div>
          ) : (
            <ul className="p-2">
              {lobs.map((c) => (
                <li key={c.slug}>
                  <button
                    onClick={() => setActive(c.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${active === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <span className="truncate">{c.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </li>
              ))}
              {lobs.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No LOBs yet — run the ATP import to generate categories.
                </li>
              )}
            </ul>
          )}
        </aside>

        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div>
              <div className="font-display text-lg">{cat?.name || "—"}</div>
              <div className="text-xs text-muted-foreground">
                {cat ? `${cat.productCount} SKUs · ATP ${cat.totalAtpQty} · ${formatINR(cat.totalMapValue)} MAP value` : ""}
              </div>
            </div>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search category" className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-border bg-background w-56" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5">Category</th>
                  <th className="text-right px-4 py-2.5">SKUs</th>
                  <th className="text-right px-4 py-2.5">ATP</th>
                  <th className="text-right px-4 py-2.5">MAP Value</th>
                  <th className="text-left px-4 py-2.5">Brands</th>
                </tr>
              </thead>
              <tbody>
                {loadingChildren && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...
                  </td></tr>
                )}
                {!loadingChildren && subs.map((s) => (
                  <tr key={s.slug} className="border-t border-border">
                    <td className="px-4 py-2.5">{s.name}</td>
                    <td className="px-4 py-2.5 text-right">{s.productCount}</td>
                    <td className="px-4 py-2.5 text-right">{s.totalAtpQty}</td>
                    <td className="px-4 py-2.5 text-right">{formatINR(s.totalMapValue)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{(s.brands || []).slice(0, 3).join(", ") || "—"}</td>
                  </tr>
                ))}
                {!loadingChildren && subs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No categories match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default Categories;
