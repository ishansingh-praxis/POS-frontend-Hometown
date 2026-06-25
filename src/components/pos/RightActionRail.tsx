import { Undo2, ReceiptText, TicketPercent, BadgePercent, Wallet, Archive } from "lucide-react";

export type PosAction =
  | "RETURN"
  | "SEARCH_BILL"
  | "VOUCHER_COUPON"
  | "PROMOTION_DISCOUNT"
  | "CREDIT_NOTE"
  | "HELD_BILLS";

const ACTIONS: { key: PosAction; label: string; icon: any }[] = [
  { key: "RETURN", label: "Return", icon: Undo2 },
  { key: "SEARCH_BILL", label: "Search Bill", icon: ReceiptText },
  { key: "VOUCHER_COUPON", label: "Voucher / Coupon", icon: TicketPercent },
  { key: "PROMOTION_DISCOUNT", label: "Promotion / Discount", icon: BadgePercent },
  { key: "CREDIT_NOTE", label: "Credit Note", icon: Wallet },
  { key: "HELD_BILLS", label: "Held Bills", icon: Archive },
];

// Command rail for everything beyond the core scan→cart→pay flow. Every button
// just opens a drawer — none of them touch the active bill directly, so the
// cashier never loses their place mid-checkout by clicking one of these.
export default function RightActionRail({ onOpen }: { onOpen: (action: PosAction) => void }) {
  return (
    <aside className="hidden xl:flex flex-col w-[88px] shrink-0 bg-blue-900 rounded-3xl py-3 px-1.5 gap-1.5 overflow-y-auto">
      {ACTIONS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onOpen(key)}
          className="flex flex-col items-center gap-1 rounded-2xl py-2.5 px-1 text-blue-50 hover:bg-blue-800 transition-colors"
        >
          <Icon className="h-4 w-4" />
          <span className="text-[9px] font-bold leading-tight text-center">{label}</span>
        </button>
      ))}
    </aside>
  );
}
