import { useState } from "react";
import { AlertCircle, BadgeCheck, Loader2, ShieldCheck, Wallet, X } from "lucide-react";
import { formatINR } from "@/lib/pos-data";
import {
  getCreditNotesByPhoneApi,
  sendCreditNoteOtpApi,
  verifyCreditNoteOtpApi,
  type ApiCreditNote,
} from "@/services/creditNoteService";
import PosActionDrawer from "./PosActionDrawer";
import { toast } from "sonner";

type Step = "LOOKUP" | "SELECT" | "OTP" | "APPLY";

export default function CreditNoteTenderDrawer({
  phone,
  appliedCreditNote,
  creditNoteApplyAmount,
  total,
  onApplyCreditNote,
  onRemoveCreditNote,
  onClose,
}: {
  phone: string;
  appliedCreditNote: ApiCreditNote | null;
  creditNoteApplyAmount: number;
  total: number;
  onApplyCreditNote: (creditNote: ApiCreditNote, amount: number, otpId: string) => void;
  onRemoveCreditNote: () => void;
  onClose: () => void;
}) {
  const [customerPhone, setCustomerPhone] = useState(phone);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<ApiCreditNote[]>([]);
  const [selected, setSelected] = useState<ApiCreditNote | null>(null);
  const [step, setStep] = useState<Step>("LOOKUP");

  const [otpId, setOtpId] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [applyAmount, setApplyAmount] = useState(0);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!customerPhone || customerPhone.length < 10) return setError("Enter a valid mobile number");
    setError("");
    setLoading(true);
    try {
      const result = await getCreditNotesByPhoneApi(customerPhone);
      setNotes(result);
      setStep("SELECT");
      if (!result.length) setError("No active credit notes for this customer");
    } catch (err: any) {
      setError(err.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (note: ApiCreditNote) => {
    setSelected(note);
    setError("");
    setLoading(true);
    try {
      const result = await sendCreditNoteOtpApi({ customerPhone, creditNoteId: note.creditNoteId });
      setOtpId(result.otpId);
      setDevOtpHint(result.devOtp || "");
      setStep("OTP");
      if (result.devOtp) toast.message(`Dev-mode OTP for ${customerPhone}: ${result.devOtp}`, { description: "No SMS provider is wired up yet — this is shown here for testing." });
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!selected) return;
    setError("");
    setLoading(true);
    try {
      await verifyCreditNoteOtpApi({ customerPhone, otpId, otp: otpInput });
      setApplyAmount(Math.max(0, Math.min(selected.availableAmount, total)));
      setStep("APPLY");
    } catch (err: any) {
      setError(err.message || "Incorrect OTP");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!selected) return;
    onApplyCreditNote(selected, applyAmount, otpId);
    onClose();
  };

  return (
    <PosActionDrawer title="Credit Note Tender" icon={<Wallet className="h-4 w-4" />} onClose={onClose}>
      {appliedCreditNote ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-amber-800">Credit Note Applied: {appliedCreditNote.creditNoteId}</div>
              <div className="text-xs text-amber-700/70">Covering {formatINR(creditNoteApplyAmount)} of this bill's tender</div>
            </div>
            <button onClick={onRemoveCreditNote} className="text-xs px-2 py-1 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 inline-flex items-center gap-1">
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          {step === "LOOKUP" && (
            <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
              <div className="text-xs font-black text-slate-600">Customer Mobile</div>
              <div className="flex gap-2">
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Mobile number"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold" />
                <button onClick={lookup} disabled={loading} className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
                </button>
              </div>
            </div>
          )}

          {step === "SELECT" && (
            <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
              <div className="text-xs font-black text-slate-600">Credit Notes for {customerPhone}</div>
              {notes.map((n) => (
                <div key={n.creditNoteId} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <div>
                    <div className="text-sm font-bold font-mono">{n.creditNoteId}</div>
                    <div className="text-[11px] text-slate-400">Balance: {formatINR(n.availableAmount)} · {n.status}</div>
                  </div>
                  <button onClick={() => sendOtp(n)} disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                    Send OTP
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === "OTP" && selected && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3 space-y-2">
              <div className="text-xs font-black text-teal-700 inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Verify OTP sent to {customerPhone}</div>
              {devOtpHint && (
                <div className="text-[11px] text-teal-700/80 bg-white rounded-lg px-2 py-1.5 border border-teal-200">
                  Dev mode (no SMS provider yet) — OTP: <b>{devOtpHint}</b>
                </div>
              )}
              <div className="flex gap-2">
                <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="6-digit OTP" maxLength={6}
                  className="flex-1 px-3 py-2 rounded-lg border border-teal-200 text-sm font-bold tracking-widest" />
                <button onClick={verifyOtp} disabled={loading || otpInput.length < 4}
                  className="rounded-xl bg-teal-600 text-white px-4 py-2 text-sm font-bold hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                  Verify
                </button>
              </div>
            </div>
          )}

          {step === "APPLY" && selected && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
              <div className="text-sm font-bold text-emerald-800">OTP verified — {selected.creditNoteId}</div>
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-emerald-700">Amount to apply</label>
                <input type="number" min={0} max={Math.min(selected.availableAmount, total)} value={applyAmount}
                  onChange={(e) => setApplyAmount(Math.max(0, Math.min(Number(e.target.value) || 0, selected.availableAmount, total)))}
                  className="w-24 px-2 py-1 rounded border border-emerald-200 text-right text-xs" />
              </div>
              <button onClick={apply} disabled={applyAmount <= 0} className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-black hover:bg-emerald-700 disabled:opacity-50">
                Apply to Bill
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 inline-flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </>
      )}
    </PosActionDrawer>
  );
}
