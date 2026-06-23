import { useState } from "react";
import { closeSessionApi, type PosSession } from "@/services/cashierService";
import { formatINR } from "@/lib/pos-data";
import { X, IndianRupee, StopCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {
  session: PosSession;
  onClosed: (session: PosSession) => void;
  onClose: () => void;
};

export default function CloseShiftModal({ session, onClosed, onClose }: Props) {
  const [closingCash, setClosingCash] = useState(String(session.expectedCash ?? 0));
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = Number(closingCash || 0);
  const difference = amount - Number(session.expectedCash || 0);

  const submit = async () => {
    if (closingCash.trim() === "" || Number.isNaN(amount) || amount < 0) {
      setError("Enter the counted cash amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const closed = await closeSessionApi(session.sessionId, { closingCash: amount, remarks });

      // System auto-verifies on close — clean sessions need no manager review,
      // only flagged exceptions do.
      if (closed.status === "EXCEPTION_FLAGGED") {
        toast.warning("Shift closed — flagged for manager review", {
          description: `${closed.exceptionCount || closed.exceptions?.length || 0} exception(s) found: ${
            closed.exceptions?.map((e) => e.message).join("; ") || "see manager dashboard"
          }`,
        });
      } else {
        toast.success("Shift closed — auto-verified", {
          description: "No issues found. No manager review needed.",
        });
      }

      onClosed(closed);
    } catch (err: any) {
      setError(err.message || "Unable to close shift");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display">Close Shift</h2>
            <p className="text-xs text-muted-foreground font-mono">{session.sessionId}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Opening cash" value={formatINR(session.openingCash)} />
            <SummaryCard label="Cash sales" value={formatINR(session.cashSales || 0)} />
            <SummaryCard label="Expected cash" value={formatINR(session.expectedCash || 0)} />
            <SummaryCard label="UPI sales" value={formatINR(session.upiSales || 0)} />
            <SummaryCard label="Card sales" value={formatINR(session.cardSales || 0)} />
            <SummaryCard label="Invoices" value={String(session.invoiceCount || 0)} />
            <SummaryCard label="Total sales" value={formatINR(session.totalSales || 0)} />
            <SummaryCard label="Payments" value={String(session.paymentCount || 0)} />
          </div>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Counted cash *</span>
            <div className="mt-1 flex items-center rounded-lg border border-input overflow-hidden">
              <span className="px-3 text-muted-foreground"><IndianRupee className="h-4 w-4" /></span>
              <input
                type="number"
                min={0}
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                className="w-full px-3 py-2 bg-background outline-none text-sm"
              />
            </div>
          </label>

          <div
            className={`rounded-lg p-3 border text-sm ${
              difference === 0
                ? "bg-success/10 border-success/20 text-success"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            <div className="text-xs">Cash difference</div>
            <div className="text-lg font-display">{formatINR(difference)}</div>
          </div>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Remarks</span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Cash counted and submitted"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm"
            />
          </label>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <StopCircle className="h-4 w-4" />
            {loading ? "Closing…" : "Close shift"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 border border-border p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-display text-sm">{value}</div>
    </div>
  );
}
