import { BadgePercent, Tag } from "lucide-react";
import { formatINR } from "@/lib/pos-data";
import type { ApiOffer, ApiDiscount } from "@/routes/pos";
import PosActionDrawer, { ComingSoonNotice } from "./PosActionDrawer";

// There's no separate "promotions" collection in this codebase — offers
// (category/subcategory/bill/service) and product discounts already ARE the
// promotion engine, and both already auto-apply on add-to-cart / checkout.
// This drawer just makes the currently-active ones browsable; building a
// parallel "promotions" store would only duplicate what's already live here.
export default function PromotionDiscountDrawer({
  storeCode,
  offers,
  discounts,
  billDisc,
  onClose,
}: {
  storeCode: string;
  offers: ApiOffer[];
  discounts: ApiDiscount[];
  billDisc: number;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const activeOffers = offers.filter(
    (o) =>
      o.status === "ACTIVE" &&
      o.startDate <= today && o.endDate >= today &&
      o.applicableStoreCodes.includes(storeCode) &&
      o.channel.includes("POS")
  );

  const activeDiscounts = discounts.filter(
    (d) =>
      d.status === "ACTIVE" &&
      d.startDate <= today && d.endDate >= today &&
      d.applicableStoreCodes.includes(storeCode)
  );

  return (
    <PosActionDrawer title="Promotion / Discount" icon={<BadgePercent className="h-4 w-4" />} onClose={onClose}>
      <ComingSoonNotice>
        These already auto-apply — item/category offers when you add a product, and bill
        discount via <b>Billing Form → Discount &amp; Charges</b>{billDisc > 0 ? ` (currently ${billDisc}%)` : ""}.
        This is just a browsable list of what's active right now.
      </ComingSoonNotice>

      <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
        <div className="text-xs font-black text-slate-600">Active Offers ({activeOffers.length})</div>
        {activeOffers.length === 0 && (
          <div className="text-center py-4 text-sm text-slate-400">No active offers at this store right now.</div>
        )}
        {activeOffers.map((o) => (
          <div key={o._id} className="rounded-xl border border-amber-100 bg-amber-50 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-amber-800 inline-flex items-center gap-1">
                <Tag className="h-3 w-3" /> {o.offerName}
              </span>
              <span className="text-sm font-black text-amber-700">
                {o.discountValueType === "PERCENTAGE" ? `${o.discountValue}%` : o.discountValueType.replace(/_/g, " ")}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-amber-700/70">
              {o.offerType}{o.applicableMainCategory ? ` · ${o.applicableMainCategory}` : ""}{o.applicableSubcategory ? ` / ${o.applicableSubcategory}` : ""}
              {o.minimumBillAmount > 0 ? ` · Min bill ${formatINR(o.minimumBillAmount)}` : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
        <div className="text-xs font-black text-slate-600">Active Product Discounts ({activeDiscounts.length})</div>
        {activeDiscounts.length === 0 && (
          <div className="text-center py-4 text-sm text-slate-400">No active product discounts at this store right now.</div>
        )}
        {activeDiscounts.map((d) => (
          <div key={d._id} className="rounded-xl border border-teal-100 bg-teal-50 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-teal-800 truncate">{d.discountName}</span>
              <span className="text-sm font-black text-teal-700">{d.discountValue}%</span>
            </div>
            <div className="mt-1 text-[11px] text-teal-700/70">
              {d.sku} · {d.category || d.mainCategory}
              {d.requiresManagerApproval ? " · Needs manager approval" : ""}
            </div>
          </div>
        ))}
      </div>
    </PosActionDrawer>
  );
}
