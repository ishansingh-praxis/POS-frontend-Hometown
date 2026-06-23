import { useEffect, useState } from "react";
import { Archive, Loader2, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/pos-data";
import {
  listHeldBillsApi,
  recallHeldBillApi,
  voidHeldBillApi,
  type ApiHeldBill,
} from "@/services/heldBillService";
import PosActionDrawer from "./PosActionDrawer";

export default function HeldBillsDrawer({
  storeCode,
  cartHasItems,
  onRecall,
  onClose,
}: {
  storeCode: string;
  cartHasItems: boolean;
  onRecall: (bill: ApiHeldBill) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<ApiHeldBill[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listHeldBillsApi({ storeCode, status: "HELD" });
      setBills(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load held bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [storeCode]);

  const recall = async (bill: ApiHeldBill) => {
    if (cartHasItems) {
      return toast.error("Clear or hold the current bill before recalling another one");
    }
    setBusyId(bill.holdId);
    try {
      const recalled = await recallHeldBillApi(bill.holdId);
      onRecall(recalled);
      toast.success(`Bill ${bill.holdId} recalled`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to recall bill");
    } finally {
      setBusyId(null);
    }
  };

  const voidBill = async (bill: ApiHeldBill) => {
    setBusyId(bill.holdId);
    try {
      await voidHeldBillApi(bill.holdId);
      toast.success(`Held bill ${bill.holdId} voided`);
      setBills((prev) => prev.filter((b) => b.holdId !== bill.holdId));
    } catch (err: any) {
      toast.error(err.message || "Failed to void bill");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PosActionDrawer title="Held Bills" icon={<Archive className="h-4 w-4" />} onClose={onClose}>
      {loading && (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loading && bills.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-400">
          No bills are currently on hold.
        </div>
      )}

      <div className="space-y-2">
        {bills.map((b) => (
          <div key={b.holdId} className="rounded-xl border border-slate-200 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono">{b.holdId}</span>
              <span className="text-sm font-black">{formatINR(b.grandTotal || 0)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {b.customer?.name || "Walk-in"} · {b.customerPhone}
              </span>
              <span>{b.itemCount} items</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Held {new Date(b.heldAt).toLocaleString("en-IN")} by {b.cashierName || b.cashierId}
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => recall(b)}
                disabled={busyId === b.holdId}
                className="flex-1 rounded-lg bg-emerald-600 text-white py-1.5 text-xs font-black hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                {busyId === b.holdId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="h-3.5 w-3.5" />
                )}
                Recall
              </button>
              <button
                onClick={() => voidBill(b)}
                disabled={busyId === b.holdId}
                className="rounded-lg bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-black hover:bg-rose-100 disabled:opacity-50 inline-flex items-center justify-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Void
              </button>
            </div>
          </div>
        ))}
      </div>
    </PosActionDrawer>
  );
}
