import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/pos-data";
import { useEffect, useState } from "react";
import { Wallet, IndianRupee, FileText, AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import {
  getAccountingSummaryApi, getSettlementBatchesApi, postSettlementBatchApi, getGstr1ExportApi,
  type AccountingSummary, type SettlementBatch,
} from "@/services/accountingService";
import { toast } from "sonner";

function Accounts() {
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [batches, setBatches] = useState<SettlementBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, batchesRes] = await Promise.all([getAccountingSummaryApi(), getSettlementBatchesApi()]);
      setSummary(summaryRes);
      setBatches(batchesRes);
    } catch (err: any) {
      toast.error(err.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const postBatch = async (b: SettlementBatch) => {
    setPosting(b.batchId);
    try {
      await postSettlementBatchApi({ storeCode: b.storeCode, channel: b.channel, businessDate: b.businessDate });
      toast.success(`Batch ${b.batchId} posted to accounts`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to post batch");
    } finally {
      setPosting(null);
    }
  };

  const exportGstr1 = async () => {
    setExporting(true);
    try {
      const rows = await getGstr1ExportApi();
      if (!rows.length) {
        toast.info("No GST data for this period");
        return;
      }
      const header = "GST Rate %,Taxable Value,GST Amount,Line Count";
      const csv = [header, ...rows.map((r) => `${r.gstPercent},${r.taxableValue},${r.gstAmount},${r.lineCount}`)].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GSTR1-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("GSTR-1 export downloaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to export GSTR-1");
    } finally {
      setExporting(false);
    }
  };

  const kpis = summary ? [
    { label: "Today's Collections", value: formatINR(summary.todayCollections), sub: `${summary.todayCollectionStores} store(s) · ${summary.todayCollectionChannels} channel(s)`, icon: IndianRupee },
    { label: "Pending Reconciliation", value: formatINR(summary.pendingReconciliationAmount), sub: `${summary.pendingReconciliationBatches} batch(es)`, icon: AlertCircle },
    { label: "Invoices Generated", value: String(summary.invoicesGeneratedToday), sub: "Tax invoices today", icon: FileText },
    { label: "GST Liability (MTD)", value: formatINR(summary.gstLiabilityMtd), sub: "Output GST, month to date", icon: Wallet },
  ] : [];

  return (
    <AppShell
      allow={["admin"]}
      title="Finance & Reconciliation"
      subtitle="Daily settlements · GST · No live bank-statement feed — reconciliation here means a batch has been posted to accounts"
      actions={
        <button onClick={exportGstr1} disabled={exporting}
          className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-1.5">
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Export GSTR-1
        </button>
      }
    >
      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 grid place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="h-9 w-9 rounded-lg grid place-items-center bg-primary/15 text-primary"><k.icon className="h-4 w-4" /></div>
                <div className="mt-4 font-display text-2xl">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
                <div className="text-[11px] text-muted-foreground/80 mt-2">{k.sub}</div>
              </div>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <div className="p-5 border-b border-border">
              <h2 className="font-display text-lg">Settlement Batches</h2>
              <p className="text-xs text-muted-foreground">Today's payments grouped by store + channel, awaiting posting to accounts</p>
            </div>
            {batches.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No payments collected today yet.</div>
            ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Batch</th>
                  <th className="text-left font-medium px-3 py-2.5">Channel</th>
                  <th className="text-left font-medium px-3 py-2.5">Store</th>
                  <th className="text-left font-medium px-3 py-2.5">Payments</th>
                  <th className="text-left font-medium px-3 py-2.5">Status</th>
                  <th className="text-right font-medium px-3 py-2.5">Amount</th>
                  <th className="text-right font-medium px-5 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.batchId} className="border-t border-border/60">
                    <td className="px-5 py-3 font-mono text-xs">{b.batchId}</td>
                    <td className="px-3 py-3">{b.channel}</td>
                    <td className="px-3 py-3">{b.storeCode}</td>
                    <td className="px-3 py-3">{b.paymentCount}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        b.status === "MATCHED" ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground"
                      }`}>
                        {b.status === "MATCHED" && <CheckCircle2 className="h-3 w-3" />}
                        {b.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{formatINR(b.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      {b.status === "PENDING" && (
                        <button onClick={() => postBatch(b)} disabled={posting === b.batchId}
                          className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-1">
                          {posting === b.batchId ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          Post to Accounts
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

export default Accounts;
