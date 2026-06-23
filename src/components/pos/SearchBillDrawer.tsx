import { useState } from "react";
import { Loader2, ReceiptText, Search } from "lucide-react";
import { formatINR } from "@/lib/pos-data";
import { getOrdersApi } from "@/services/cashierService";
import PosActionDrawer from "./PosActionDrawer";

// Backed by the existing /orders search (already supports a free-text q across
// orderId/orderNumber/invoiceId/customerPhone/customerName, plus a date range) —
// no new backend needed, this just gives it a dedicated POS-facing UI.
export default function SearchBillDrawer({ storeCode, onClose }: { storeCode: string; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runSearch = async () => {
    if (!query.trim() && !fromDate && !toDate) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await getOrdersApi({
        q: query.trim() || undefined,
        storeCode,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: 20,
      });
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PosActionDrawer title="Search Bill" icon={<ReceiptText className="h-4 w-4" />} onClose={onClose}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Mobile number / invoice / order ID"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-xs" />
      </div>

      <button
        onClick={runSearch}
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 text-white py-2.5 font-black text-sm hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Search
      </button>

      <div className="space-y-2">
        {results.map((b) => (
          <div key={b._id || b.orderId} className="rounded-xl border border-slate-200 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono">{b.invoiceId || b.orderId}</span>
              <span className="text-sm font-black">{formatINR(b.grandTotal || 0)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>{b.customerName || "Walk-in"} · {b.customerPhone}</span>
              <span className={b.paymentStatus === "PAID" ? "text-emerald-600 font-bold" : "text-amber-700 font-bold"}>
                {b.paymentStatus}
              </span>
            </div>
            {b.createdAt && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                {new Date(b.createdAt).toLocaleString("en-IN")} · {b.itemCount ?? b.items?.length ?? 0} items
              </div>
            )}
          </div>
        ))}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-6 text-sm text-slate-400">No bills match that search.</div>
        )}
      </div>
    </PosActionDrawer>
  );
}
