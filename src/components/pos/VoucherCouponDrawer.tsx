import { useState } from "react";
import { AlertCircle, BadgeCheck, Loader2, TicketPercent, Wallet, X } from "lucide-react";
import { formatINR } from "@/lib/pos-data";
import { validateVoucherApi, type ApiVoucher } from "@/services/voucherService";
import PosActionDrawer, { ComingSoonNotice } from "./PosActionDrawer";

// Coupon codes already work today via Billing Form → Coupon / Offer Code — that
// flow is untouched. This drawer is for the separate "voucher" wallet concept
// (customer-held store credit vouchers), now backed by the vouchers module.
export default function VoucherCouponDrawer({
  phone,
  appliedVoucher,
  voucherApplyAmount,
  totalBeforeVoucher,
  onApplyVoucher,
  onRemoveVoucher,
  onClose,
}: {
  phone: string;
  appliedVoucher: ApiVoucher | null;
  voucherApplyAmount: number;
  totalBeforeVoucher: number;
  onApplyVoucher: (voucher: ApiVoucher, amount: number) => void;
  onRemoveVoucher: () => void;
  onClose: () => void;
}) {
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVoucher, setPendingVoucher] = useState<ApiVoucher | null>(null);
  const [applyAmount, setApplyAmount] = useState(0);

  const validate = async () => {
    setError("");
    if (!voucherCode.trim()) return setError("Enter voucher code");

    setLoading(true);
    try {
      const voucher = await validateVoucherApi({ voucherCode: voucherCode.trim().toUpperCase(), customerPhone: phone || undefined });
      setPendingVoucher(voucher);
      setApplyAmount(Math.max(0, Math.min(voucher.availableAmount, totalBeforeVoucher)));
    } catch (err: any) {
      setPendingVoucher(null);
      setError(err.message || "Voucher invalid");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!pendingVoucher) return;
    onApplyVoucher(pendingVoucher, applyAmount);
    setPendingVoucher(null);
    setVoucherCode("");
  };

  return (
    <PosActionDrawer title="Voucher / Coupon" icon={<TicketPercent className="h-4 w-4" />} onClose={onClose}>
      <ComingSoonNotice>
        Coupon codes already work — open <b>Billing Form → Coupon / Offer Code</b> on the current bill.
      </ComingSoonNotice>

      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-blue-950">Customer Voucher</div>
            <div className="text-xs text-blue-800/70">Store-credit voucher tied to the customer's wallet</div>
          </div>
        </div>

        {!appliedVoucher ? (
          <>
            <div className="flex gap-2">
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Enter voucher code e.g. HTVABC123"
                className="flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={validate}
                disabled={loading}
                className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-bold hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Validate
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 inline-flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {pendingVoucher && (
              <div className="rounded-xl bg-white border border-blue-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-blue-700">{pendingVoucher.voucherCode}</span>
                  <span className="text-blue-700">Balance: {formatINR(pendingVoucher.availableAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-500">Amount to apply</label>
                  <input
                    type="number" min={0} max={Math.min(pendingVoucher.availableAmount, totalBeforeVoucher)}
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(Math.max(0, Math.min(Number(e.target.value) || 0, pendingVoucher.availableAmount, totalBeforeVoucher)))}
                    className="w-24 px-2 py-1 rounded border border-blue-200 text-right text-xs"
                  />
                </div>
                <button
                  onClick={apply}
                  disabled={applyAmount <= 0}
                  className="w-full rounded-lg bg-blue-600 text-white py-2 text-xs font-black hover:bg-blue-700 disabled:opacity-50"
                >
                  Apply to Bill
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl bg-white border border-blue-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-blue-700">Voucher Applied: {appliedVoucher.voucherCode}</div>
                <div className="text-xs text-muted-foreground">Remaining balance: {formatINR(appliedVoucher.availableAmount - voucherApplyAmount)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-blue-700">− {formatINR(voucherApplyAmount)}</div>
                <button onClick={onRemoveVoucher} className="text-xs px-2 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1 mt-1">
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PosActionDrawer>
  );
}
