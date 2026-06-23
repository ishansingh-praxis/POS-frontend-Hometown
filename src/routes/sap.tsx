import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCcw, AlertCircle, Clock, XCircle, RotateCw, Loader2, Info } from "lucide-react";
import {
  getSapSummaryApi, getSapSyncLogsApi, queueUnsyncedInvoicesApi, retrySapSyncApi, markSapSyncStatusApi,
  type ApiSapSyncLog, type SapSyncStatus, type SapSummary,
} from "@/services/sapService";
import { toast } from "sonner";

const STATUS_TONE: Record<SapSyncStatus, string> = {
  SYNCED: "bg-success/15 text-success",
  PENDING: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/15 text-destructive",
  RETRYING: "bg-warning/20 text-warning-foreground",
};

function StatusIcon({ s }: { s: SapSyncStatus }) {
  const cls = "h-3.5 w-3.5";
  if (s === "SYNCED") return <CheckCircle2 className={cls} />;
  if (s === "FAILED") return <XCircle className={cls} />;
  if (s === "RETRYING") return <RotateCw className={cls + " animate-spin"} />;
  return <Clock className={cls} />;
}

function Sap() {
  const [rows, setRows] = useState<ApiSapSyncLog[]>([]);
  const [summary, setSummary] = useState<SapSummary>({ PENDING: 0, SYNCED: 0, RETRYING: 0, FAILED: 0 });
  const [filter, setFilter] = useState<SapSyncStatus | "All">("All");
  const [inspect, setInspect] = useState<ApiSapSyncLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [queuing, setQueuing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [logsRes, summaryRes] = await Promise.all([
        getSapSyncLogsApi(filter === "All" ? {} : { syncStatus: filter }),
        getSapSummaryApi(),
      ]);
      setRows(logsRes.items || []);
      setSummary(summaryRes);
    } catch (err: any) {
      toast.error(err.message || "Failed to load sync logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const queueUnsynced = async () => {
    setQueuing(true);
    try {
      const created = await queueUnsyncedInvoicesApi();
      toast.success(created.length ? `Queued ${created.length} invoice(s) for sync` : "Every invoice today is already queued or synced");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to queue sync");
    } finally {
      setQueuing(false);
    }
  };

  const retry = async (id: string) => {
    try {
      await retrySapSyncApi(id);
      toast.success("Re-sync queued");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to retry sync");
    }
  };

  const retryAllFailed = async () => {
    const failed = rows.filter((r) => r.syncStatus === "FAILED");
    if (!failed.length) return toast.info("No failed sync entries to retry");
    await Promise.all(failed.map((r) => retrySapSyncApi(r._id).catch(() => null)));
    toast.success(`Retried ${failed.length} failed sync(s)`);
    load();
  };

  // Dev-only helper since there's no live SAP/Tally/Razorpay connector wired up —
  // this just lets an admin manually resolve a queued item for testing.
  const markStatus = async (id: string, status: SapSyncStatus) => {
    try {
      await markSapSyncStatusApi(id, status, status === "FAILED" ? "Manually marked failed" : undefined);
      toast.success(`Marked ${status}`);
      setInspect(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <AppShell
      allow={["admin"]}
      title="SAP / ERP Sync"
      subtitle="Sync queue for invoices going to SAP/ERP — real bookkeeping, no live connector configured yet"
      actions={
        <div className="flex gap-2">
          <button onClick={retryAllFailed}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted">
            <RefreshCcw className="h-3.5 w-3.5" /> Retry all failed
          </button>
          <button onClick={queueUnsynced} disabled={queuing}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {queuing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            Sync today's invoices
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-muted/30 p-4 mb-6 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        No live SAP S/4 HANA, Tally, or Razorpay connection is configured yet — this queue tracks real invoices
        waiting to be pushed once a connector is wired up. "Sync today's invoices" queues any of today's invoices
        not already queued; status changes below are recorded for real but are entered manually until a connector exists.
      </div>

      <div className="grid gap-3 sm:grid-cols-5 mb-4">
        {(["All", "PENDING", "RETRYING", "SYNCED", "FAILED"] as const).map((s) => {
          const n = s === "All" ? Object.values(summary).reduce((a, b) => a + b, 0) : summary[s as SapSyncStatus];
          const active = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s as SapSyncStatus | "All")}
              className={`rounded-xl border p-4 text-left transition ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"}`}>
              <div className="text-xs text-muted-foreground">{s === "All" ? "All" : s}</div>
              <div className="font-display text-2xl mt-1">{n}</div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg">Sync Queue</h2>
            <p className="text-xs text-muted-foreground">Click a row for details</p>
          </div>
          <span className="text-xs text-muted-foreground">{rows.length} records</span>
        </div>

        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No sync records for this filter.</div>
        ) : (
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/40">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Sync ID</th>
              <th className="text-left font-medium px-3 py-2.5">Entity</th>
              <th className="text-left font-medium px-3 py-2.5">Ref</th>
              <th className="text-left font-medium px-3 py-2.5">Store</th>
              <th className="text-left font-medium px-3 py-2.5">Target</th>
              <th className="text-left font-medium px-3 py-2.5">Attempts</th>
              <th className="text-left font-medium px-3 py-2.5">Status</th>
              <th className="text-right font-medium px-5 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t border-border/60 hover:bg-muted/30 cursor-pointer" onClick={() => setInspect(r)}>
                <td className="px-5 py-3 font-mono text-xs">{r.syncId}</td>
                <td className="px-3 py-3">{r.entityType}</td>
                <td className="px-3 py-3 font-mono text-xs">{r.entityId}</td>
                <td className="px-3 py-3 text-muted-foreground">{r.storeCode || "—"}</td>
                <td className="px-3 py-3 text-muted-foreground">{r.target || "—"}</td>
                <td className="px-3 py-3">{r.retryCount}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${STATUS_TONE[r.syncStatus]}`}>
                    <StatusIcon s={r.syncStatus} /> {r.syncStatus}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {(r.syncStatus === "FAILED" || r.syncStatus === "PENDING") && (
                    <button onClick={(e) => { e.stopPropagation(); retry(r._id); }}
                      className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1">
                      <RefreshCcw className="h-3 w-3" /> Re-sync
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {inspect && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setInspect(null)}>
          <div className="bg-card rounded-2xl shadow-xl border border-border max-w-xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-display text-lg">{inspect.entityType} · {inspect.entityId}</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{inspect.syncId} → {inspect.target || "—"}</div>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${STATUS_TONE[inspect.syncStatus]}`}>
                <StatusIcon s={inspect.syncStatus} /> {inspect.syncStatus}
              </span>
            </div>
            {inspect.errorMessage ? (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Error
                </div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap text-foreground/80">{inspect.errorMessage}</pre>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No errors. Last update {new Date(inspect.updatedAt).toLocaleString("en-IN")} after {inspect.retryCount} attempt(s).
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setInspect(null)} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted">Close</button>
              {inspect.syncStatus !== "SYNCED" && (
                <button onClick={() => markStatus(inspect._id, "SYNCED")} className="text-xs px-3 py-1.5 rounded-md border border-success/40 text-success hover:bg-success/10 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Mark Synced
                </button>
              )}
              <button onClick={() => { retry(inspect._id); setInspect(null); }} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1">
                <RefreshCcw className="h-3 w-3" /> Re-sync now
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Sap;
