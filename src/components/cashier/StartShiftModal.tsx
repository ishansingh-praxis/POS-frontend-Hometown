import { useState } from "react";
import { startSessionApi, type PosSession } from "@/services/cashierService";
import type { AuthUser } from "@/lib/auth";
import { X, Wallet, MonitorSmartphone, PlayCircle } from "lucide-react";

type Props = {
  user: AuthUser;
  onStarted: (session: PosSession) => void;
  onClose?: () => void;
  locked?: boolean;
};

export default function StartShiftModal({ user, onStarted, onClose, locked = true }: Props) {
  const [openingCash, setOpeningCash] = useState("");
  const [posDeviceId, setPosDeviceId] = useState(`POS-${user.store || "STORE"}-01`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    const amount = Number(openingCash || 0);

    if (openingCash.trim() === "" || Number.isNaN(amount) || amount < 0) {
      setError("Enter a valid opening cash amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const session = await startSessionApi({
        storeCode: user.store,
        storeName: user.storeName,
        cashierId: user.employeeCode || user.username,
        cashierName: user.name,
        openingCash: amount,
        posDeviceId,
      });

      onStarted(session);
    } catch (err: any) {
      setError(err.message || "Unable to start shift");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-amber-500 text-primary-foreground p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display">Start Cashier Shift</h2>
            <p className="text-xs text-primary-foreground/80">
              Store {user.store} · {user.storeName}
            </p>
          </div>

          {!locked && onClose && (
            <button onClick={onClose} className="p-2 rounded-lg bg-white/20 hover:bg-white/30">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-muted/50 border border-border p-3">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.employeeCode || user.username}</div>
          </div>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Opening cash</span>
            <div className="mt-1 flex items-center rounded-lg border border-input overflow-hidden">
              <span className="px-3 text-muted-foreground"><Wallet className="h-4 w-4" /></span>
              <input
                type="number"
                min={0}
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-background outline-none text-sm"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">POS counter / device</span>
            <div className="mt-1 flex items-center rounded-lg border border-input overflow-hidden">
              <span className="px-3 text-muted-foreground"><MonitorSmartphone className="h-4 w-4" /></span>
              <input
                value={posDeviceId}
                onChange={(e) => setPosDeviceId(e.target.value)}
                className="w-full px-3 py-2 bg-background outline-none text-sm"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={start}
            disabled={loading}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            {loading ? "Starting shift…" : "Start shift"}
          </button>
        </div>
      </div>
    </div>
  );
}
