import { useState } from "react";
import { AlertCircle, Loader2, Printer, Search, Undo2 } from "lucide-react";
import { formatINR } from "@/lib/pos-data";
import {
  fetchInvoiceForReturnApi,
  confirmReturnApi,
  type ApiReturnableOrder,
  type ReturnItemPayload,
} from "@/services/returnService";
import PosActionDrawer from "./PosActionDrawer";
import { toast } from "sonner";

type ReturnLine = ReturnItemPayload & { maxQty: number; selected: boolean };

const printCopy = (copyLabel: string, returnId: string, creditNoteId: string, items: ReturnLine[], amount: number, customerName: string, customerPhone: string) => {
  const win = window.open("", "_blank", "width=700,height=600");
  if (!win) {
    toast.error("Popup blocked. Allow popups to print.");
    return;
  }

  const rows = items
    .filter((i) => i.selected && i.quantity > 0)
    .map((i) => `<tr><td>${i.productName}</td><td>${i.sku}</td><td>${i.quantity}</td><td>₹${i.lineTotal}</td></tr>`)
    .join("");

  win.document.write(`
    <html><head><title>Return ${returnId}</title>
    <style>
      body { font-family: Arial; padding: 24px; color: #1f2937; }
      h2 { color: #b45309; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: left; }
      .copy { display:inline-block; background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:bold; }
    </style></head>
    <body>
      <span class="copy">${copyLabel}</span>
      <h2>Return / Credit Note</h2>
      <p><b>Return ID:</b> ${returnId}<br/><b>Credit Note ID:</b> ${creditNoteId}<br/>
      <b>Customer:</b> ${customerName || "Walk-in"} (${customerPhone})<br/>
      <b>Date:</b> ${new Date().toLocaleString("en-IN")}</p>
      <table><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <h3>Credit Note Value: ${formatINR(amount)}</h3>
      <script>window.print();</script>
    </body></html>
  `);
  win.document.close();
};

export default function ReturnCreditNoteDrawer({ storeCode, onClose }: { storeCode: string; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<ApiReturnableOrder | null>(null);
  const [lines, setLines] = useState<ReturnLine[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ returnId: string; creditNoteId: string } | null>(null);

  const fetchInvoice = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setOrder(null);
    setResult(null);
    try {
      const found = await fetchInvoiceForReturnApi({ q: query.trim() });
      setOrder(found);
      setLines(
        found.items.map((i) => ({ ...i, maxQty: i.quantity, selected: false }))
      );
    } catch (err: any) {
      toast.error(err.message || "Bill not found");
    } finally {
      setLoading(false);
    }
  };

  const toggleLine = (sku: string) =>
    setLines((ls) => ls.map((l) => (l.sku === sku ? { ...l, selected: !l.selected } : l)));

  const setLineQty = (sku: string, qty: number) =>
    setLines((ls) =>
      ls.map((l) => {
        if (l.sku !== sku) return l;
        const quantity = Math.max(0, Math.min(qty, l.maxQty));
        const unitValue = l.unitPrice;
        return { ...l, quantity, lineTotal: Math.round(unitValue * quantity) };
      })
    );

  const returnAmount = lines.filter((l) => l.selected).reduce((s, l) => s + l.lineTotal, 0);

  const confirmReturn = async () => {
    if (!order) return;
    const selected = lines.filter((l) => l.selected && l.quantity > 0);
    if (!selected.length) return toast.error("Select at least one item to return");

    setSubmitting(true);
    try {
      const { posReturn, creditNote } = await confirmReturnApi({
        originalInvoiceId: order.invoiceId,
        originalOrderId: order.orderId,
        storeCode,
        customerPhone: order.customerPhone || "",
        customerName: order.customerName,
        returnItems: selected.map(({ sku, productId, productName, quantity, unitPrice, lineTotal }) => ({
          sku, productId, productName, quantity, unitPrice, lineTotal,
        })),
        returnReason,
      });
      setResult({ returnId: posReturn.returnId, creditNoteId: creditNote.creditNoteId });
      toast.success(`Return confirmed — credit note ${creditNote.creditNoteId} issued for ${formatINR(posReturn.returnAmount)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm return");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PosActionDrawer title="Return / Credit Note Issue" icon={<Undo2 className="h-4 w-4" />} onClose={onClose}>
      {!order && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInvoice()}
              placeholder="Old invoice / order ID / mobile number"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <button onClick={fetchInvoice} disabled={loading}
            className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Fetch
          </button>
        </div>
      )}

      {order && !result && (
        <>
          <div className="rounded-2xl border border-slate-200 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="font-bold">{order.invoiceId || order.orderId}</span><span>{formatINR(order.grandTotal)}</span></div>
            <div className="text-xs text-slate-500">{order.customerName || "Walk-in"} · {order.customerPhone}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
            <div className="text-xs font-black text-slate-600">Select items to return</div>
            {lines.map((l) => (
              <div key={l.sku} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={l.selected} onChange={() => toggleLine(l.sku)} className="h-4 w-4" />
                <div className="flex-1 min-w-0 truncate">{l.productName} <span className="text-[11px] text-slate-400 font-mono">({l.sku})</span></div>
                <input
                  type="number" min={0} max={l.maxQty} value={l.quantity}
                  onChange={(e) => setLineQty(l.sku, Number(e.target.value) || 0)}
                  disabled={!l.selected}
                  className="w-14 px-1.5 py-1 rounded border border-slate-200 text-right text-xs disabled:opacity-40"
                />
                <span className="text-xs text-slate-400">/ {l.maxQty}</span>
                <span className="w-16 text-right font-bold">{formatINR(l.lineTotal)}</span>
              </div>
            ))}
          </div>

          <input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Return reason"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />

          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-800">Credit note value</span>
            <span className="text-lg font-black text-emerald-700">{formatINR(returnAmount)}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setOrder(null)} className="rounded-2xl bg-slate-100 text-slate-600 px-5 py-3 font-black text-sm hover:bg-slate-200">
              Back
            </button>
            <button onClick={confirmReturn} disabled={submitting || returnAmount <= 0}
              className="flex-1 rounded-2xl bg-emerald-600 text-white py-3 font-black text-sm hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? "Processing…" : "Confirm Return & Issue Credit Note"}
            </button>
          </div>
        </>
      )}

      {result && order && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div className="text-sm font-bold text-emerald-800">Return {result.returnId} confirmed</div>
          <div className="text-sm text-emerald-700">Credit note <b>{result.creditNoteId}</b> issued for {formatINR(returnAmount)}.</div>
          <div className="text-[11px] text-emerald-700/70 inline-flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> Tell the customer this can be redeemed via Credit Note tender on a future bill.
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => printCopy("CUSTOMER COPY", result.returnId, result.creditNoteId, lines, returnAmount, order.customerName || "", order.customerPhone || "")}
              className="rounded-xl bg-white border border-emerald-300 text-emerald-700 py-2 text-xs font-black inline-flex items-center justify-center gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Customer Copy
            </button>
            <button onClick={() => printCopy("MERCHANT COPY", result.returnId, result.creditNoteId, lines, returnAmount, order.customerName || "", order.customerPhone || "")}
              className="rounded-xl bg-white border border-emerald-300 text-emerald-700 py-2 text-xs font-black inline-flex items-center justify-center gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Merchant Copy
            </button>
          </div>
          <button onClick={onClose} className="w-full rounded-xl bg-emerald-700 text-white py-2.5 text-sm font-black">Done</button>
        </div>
      )}
    </PosActionDrawer>
  );
}
