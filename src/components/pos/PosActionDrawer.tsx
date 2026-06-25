import { type ReactNode } from "react";
import { X } from "lucide-react";

// Generic right-side slide-in shell used by every POS capability drawer
// (Hold/Recall, Void, Enquiry, Order Booking, Return, Credit Note, ...) so
// they all share one consistent look instead of each reinventing the chrome.
export default function PosActionDrawer({
  title,
  icon,
  widthClassName = "max-w-[480px]",
  onClose,
  footer,
  children,
}: {
  title: string;
  icon?: ReactNode;
  widthClassName?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full ${widthClassName} h-full bg-white shadow-2xl flex flex-col`}>
        <div className="p-4 bg-blue-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm font-black">
            {icon}
            {title}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>

        {footer && <div className="p-4 border-t border-slate-200 flex items-center gap-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// Shared placeholder body for capabilities whose real backend/logic lands in a later build phase.
export function ComingSoonNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
      {children}
    </div>
  );
}
