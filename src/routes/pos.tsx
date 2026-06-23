// src/routes/pos.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@/lib/routerCompat";
import PosShell from "@/components/pos/PosShell";
import logo from "@/assets/hometown_logo.png";
import {
  formatINR,
  type Product, type ProductCategoryGroup, type Offer,
} from "@/lib/pos-data";
import { useAuth } from "@/lib/auth";
import {
  Search, Plus, Minus, Trash2, Phone, CreditCard, Banknote, QrCode, Receipt, Percent,
  ScanBarcode, Ban, AlertTriangle, X, Tag, Truck,
  TicketPercent, BadgeCheck, Loader2, AlertCircle, StopCircle, Split, UserRound, PauseCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  validateCouponApi,
  markCouponAvailedApi,
  type CouponValidationResult,
} from "@/services/couponService";
import { getCustomersApi, type ApiCustomer } from "@/services/customerService";
import {
  getCurrentSessionApi,
  cashierCheckoutApi,
  type PosSession,
  type CashierCheckoutPayload,
} from "@/services/cashierService";
import { getCatalogApi, type ApiCatalogItem } from "@/services/catalogService";
import { redeemVoucherApi, type ApiVoucher } from "@/services/voucherService";
import { redeemCreditNoteApi, type ApiCreditNote } from "@/services/creditNoteService";
import { createDeliveryScheduleApi } from "@/services/deliveryScheduleService";
import StartShiftModal from "@/components/cashier/StartShiftModal";
import CloseShiftModal from "@/components/cashier/CloseShiftModal";
import RightActionRail, { type PosAction } from "@/components/pos/RightActionRail";
import ReturnCreditNoteDrawer from "@/components/pos/ReturnCreditNoteDrawer";
import SearchBillDrawer from "@/components/pos/SearchBillDrawer";
import VoucherCouponDrawer from "@/components/pos/VoucherCouponDrawer";
import PromotionDiscountDrawer from "@/components/pos/PromotionDiscountDrawer";
import CreditNoteTenderDrawer from "@/components/pos/CreditNoteTenderDrawer";
import HeldBillsDrawer from "@/components/pos/HeldBillsDrawer";
import { holdBillApi, type ApiHeldBill } from "@/services/heldBillService";

// ---- Catalog item carries a few real-ATP fields the shared mock Product type
// doesn't have (articleNo/productId/isSellable) — kept local to this screen.
type StockStatus = "IN_STOCK" | "LIMITED_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

type PosProduct = Product & {
  productId?: string;
  articleNo?: string;
  isSellable: boolean;
  stockStatus: StockStatus;
};

// ---- API response interfaces ----
export interface ApiOffer {
  _id: string;
  offerId: string;
  offerName: string;
  offerType: "CATEGORY" | "SUBCATEGORY" | "SERVICE" | "BILL";
  discountValueType: "PERCENTAGE" | "FREE_SERVICE" | "FREE_DELIVERY";
  discountValue: number;
  applicableMainCategory: string | null;
  applicableSubcategory: string | null;
  minimumBillAmount: number;
  maximumDiscountAmount: number;
  startDate: string;
  endDate: string;
  applicableStoreCodes: string[];
  channel: string[];
  status: string;
}

export interface ApiDiscount {
  _id: string;
  discountId: string;
  discountName: string;
  discountScope: "PRODUCT";
  discountValueType: "PERCENTAGE";
  discountValue: number;
  maxDiscountAmount: number;
  sku: string;
  productId: string;
  mainCategory: string;
  category: string;
  subcategory: string;
  applicableStoreCodes: string[];
  requiresManagerApproval: boolean;
  startDate: string;
  endDate: string;
  status: string;
}

// ---- Local types for offers and discounts attached to cart lines ----
interface ProductOffer {
  discountPct: number;
  maxDiscount: number;
  name: string;
}

interface ProductDiscount {
  discountPct: number;
  maxDiscount: number;
  requiresApproval: boolean;
  name: string;
}

// ---- Find best offer (LOB/merc. category) ----
function findBestProductOffer(
  item: { lob?: string; category?: string },
  offers: ApiOffer[],
  storeCode: string
): ApiOffer | null {
  const now = new Date().toISOString().slice(0, 10);
  const activeOffers = offers.filter(o =>
    o.status === "ACTIVE" &&
    o.startDate <= now && o.endDate >= now &&
    o.applicableStoreCodes.includes(storeCode) &&
    o.channel.includes("POS") &&
    (o.offerType === "CATEGORY" || o.offerType === "SUBCATEGORY") &&
    o.discountValueType === "PERCENTAGE"
  );
  let best: ApiOffer | null = null;
  for (const offer of activeOffers) {
    let score = 0;
    if (offer.applicableMainCategory && item.lob === offer.applicableMainCategory) score += 10;
    if (offer.applicableSubcategory && item.category === offer.applicableSubcategory) score += 20;
    if (score > 0 && offer.discountValue > (best?.discountValue || 0)) {
      best = offer;
    }
  }
  return best;
}

// ---- Find product-specific discount ----
function findProductDiscount(
  item: { sku: string; productId?: string },
  discounts: ApiDiscount[],
  storeCode: string
): ApiDiscount | null {
  const now = new Date().toISOString().slice(0, 10);
  const active = discounts.filter(d =>
    d.status === "ACTIVE" &&
    d.startDate <= now && d.endDate >= now &&
    d.applicableStoreCodes.includes(storeCode) &&
    d.discountScope === "PRODUCT" &&
    d.discountValueType === "PERCENTAGE" &&
    (d.sku === item.sku || d.productId === item.productId)
  );
  if (active.length === 0) return null;
  return active.reduce((a, b) => a.discountValue > b.discountValue ? a : b);
}

// ---- Normalize list-shaped API responses (supports {data:[]}, {data:{items:[]}}, {items:[]}) ----
function normalizeList(response: any): any[] {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

// ---- Map a catalog item (inventory + product fields joined server-side) to our Product type ----
function mapCatalogItem(
  x: ApiCatalogItem,
  offers: ApiOffer[],
  discounts: ApiDiscount[],
  storeCode: string
): PosProduct {
  // Keep only the best offer (if any) – Offer type only has discountPct
  const bestOffer = findBestProductOffer(x, offers, storeCode);
  const offer: Offer | undefined = bestOffer ? { label: bestOffer.offerName, discountPct: bestOffer.discountValue } : undefined;

  // Never blank: primaryImage -> thumbnailImage -> first images[] entry -> legacy `image` field.
  const primaryImage = x.primaryImage || x.thumbnailImage || x.images?.[0] || x.image || "";

  return {
    id: x.inventoryId || x.catalogId,
    productId: x.productId,
    articleNo: x.articleNo || x.sku,
    sku: x.sku,
    barcode: x.articleNo || x.sku,
    name: x.productName,
    price: Number(x.sellingPrice || x.map || x.mrp || 0),
    mrp: Number(x.mrp || x.sellingPrice || 0),
    gstPct: 18,
    hsn: "",
    group: (x.lob || "Uncategorized") as ProductCategoryGroup,
    status: "active",
    // ATP qty is what's actually sellable, not raw on-hand stock
    stock: Number(x.atpQty || 0),
    offer,
    delivery: false,
    installation: false,
    category: x.mercCategory || x.category || "",
    brand: x.brand || "HomeTown",
    warrantyMonths: 12,
    returnDays: 7,
    image: primaryImage,
    isSellable: x.isSellable !== false && Number(x.atpQty || 0) > 0,
    stockStatus: x.stockStatus || "OUT_OF_STOCK",
  };
}

// ---- Optional details collected for a brand-new customer (only shown when
// the looked-up phone number has no existing customer record) ----
type NewCustomerDetails = {
  name: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  city: string;
  billingAddress: string;
  deliveryAddress: string;
};

const EMPTY_NEW_CUSTOMER: NewCustomerDetails = {
  name: "", email: "", gstNumber: "", panNumber: "", city: "", billingAddress: "", deliveryAddress: "",
};

// ---- Cart line type ----
export type CartLine = {
  product: PosProduct;
  qty: number;
  itemDiscPct: number;          // effective percentage (offer or discount)
  appliedOffer?: ProductOffer;
  appliedDiscount?: ProductDiscount;
};

// ---- Payment types ----
type PaymentMethod = "UPI" | "CARD" | "CASH" | "SPLIT";

type PaymentLine = {
  method: "UPI" | "CARD" | "CASH";
  amount: number;
  upiTransactionId?: string;
  cardNumber?: string;
  cardLast4?: string;
  cardType?: string;
  bankName?: string;
  cardHolderName?: string;
  cardApprovalCode?: string;
  cashNotes?: Record<string, number>;
};

// Purely informational — mirrors the backend's maxManualDiscountPercent default.
// Checkout is never blocked; sessions are flagged automatically for manager review instead.
const HIGH_DISCOUNT_HINT_THRESHOLD = 10;

// ---- POS color system: green/emerald/mint family only — differentiate by shade, not hue ----
const PAYMENT_METHOD_STYLE: Record<PaymentMethod, { icon: any; active: string; idle: string; key: string }> = {
  CASH: { icon: Banknote, active: "bg-emerald-600 text-white border-emerald-600", idle: "bg-white text-emerald-700 border-emerald-200", key: "F6" },
  UPI: { icon: QrCode, active: "bg-teal-600 text-white border-teal-600", idle: "bg-white text-teal-700 border-teal-200", key: "F7" },
  CARD: { icon: CreditCard, active: "bg-green-700 text-white border-green-700", idle: "bg-white text-green-700 border-green-200", key: "F8" },
  SPLIT: { icon: Split, active: "bg-lime-600 text-white border-lime-600", idle: "bg-white text-lime-700 border-lime-200", key: "F9" },
};

const POS_ALLOWED_ROLES: string[] = ["cashier", "manager"];

function POS() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // This page bypasses AppShell (full-screen counter layout), so it has to
  // replicate AppShell's own auth/role gate instead of inheriting it.
  useEffect(() => {
    if (!user) navigate({ to: "/login", replace: true });
    else if (!POS_ALLOWED_ROLES.includes(user.role)) navigate({ to: "/login", replace: true });
  }, [user, navigate]);

  // "ALL" (head office / admin) has no real store to bill against in the POS UI, so fall back to a default store
  const storeCode = user?.store && user.store !== "ALL" ? user.store : "6036";
  const storeName = user?.storeName || "Ht Bhubaneshwar Janpath";
  const cashierId = user?.employeeCode || user?.username || "";
  const cashierName = user?.name || "";
  const posDeviceId = `POS-${storeCode}-01`;

  // ---- State ----
  const [allProducts, setAllProducts] = useState<PosProduct[]>([]);
  const [discountMap, setDiscountMap] = useState<Map<string, ApiDiscount>>(new Map()); // keyed by product id
  const [allDiscounts, setAllDiscounts] = useState<ApiDiscount[]>([]); // de-duplicated, for browsable promotion lists
  const [allOffers, setAllOffers] = useState<ApiOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Cashier shift / session ----
  const [session, setSession] = useState<PosSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // ---- Live customer lookup (by mobile number) ----
  const [foundCustomer, setFoundCustomer] = useState<ApiCustomer | null>(null);
  const [newCustomerDetails, setNewCustomerDetails] = useState<NewCustomerDetails>(EMPTY_NEW_CUSTOMER);

  // ---- Optional delivery schedule for this bill (e.g. furniture delivered later
  // even though the sale itself is rung up now) ----
  const [scheduleDelivery, setScheduleDelivery] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("HOME_DELIVERY");
  const [deliverySiteCode, setDeliverySiteCode] = useState("");

  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ProductCategoryGroup | "All">("All");
  const scanRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [phone, setPhone] = useState("");
  const [billDisc, setBillDisc] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [installation, setInstallation] = useState(0);
  const [paid, setPaid] = useState(0);

  // ---- Right Action Rail: every capability beyond the core scan→cart→pay flow
  // opens as its own drawer and never touches the active bill on its own. ----
  const [showReturn, setShowReturn] = useState(false);
  const [showSearchBill, setShowSearchBill] = useState(false);
  const [showVoucherCoupon, setShowVoucherCoupon] = useState(false);
  const [showPromotionDiscount, setShowPromotionDiscount] = useState(false);
  const [showCreditNoteTender, setShowCreditNoteTender] = useState(false);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [holdingBill, setHoldingBill] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([]);
  const [upiQr, setUpiQr] = useState<string>("");
  const [upiAmount, setUpiAmount] = useState(0);

  // ---- Billing form drawer + payment plan (Full vs manually-entered Partial) ----
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<"FULL" | "PARTIAL">("FULL");
  const [partialPercent, setPartialPercent] = useState(50);
  const [partialAmount, setPartialAmount] = useState(0);

  const [cardInfo, setCardInfo] = useState({
    cardNumber: "",
    cardHolderName: "",
    cardType: "VISA",
    bankName: "",
    approvalCode: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // ---- Customer wallet voucher (distinct from coupon codes — see VoucherCouponDrawer) ----
  const [appliedVoucher, setAppliedVoucher] = useState<ApiVoucher | null>(null);
  const [voucherApplyAmount, setVoucherApplyAmount] = useState(0);

  // ---- Credit note tender (OTP-verified, see CreditNoteTenderDrawer) ----
  const [appliedCreditNote, setAppliedCreditNote] = useState<ApiCreditNote | null>(null);
  const [creditNoteApplyAmount, setCreditNoteApplyAmount] = useState(0);
  const [creditNoteOtpId, setCreditNoteOtpId] = useState("");

  const [cashNotes, setCashNotes] = useState<Record<string, number>>({
    "2000": 0,
    "500": 0,
    "200": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
  });

  // ---- Fetch data ----
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Note: offers/discounts are filtered client-side by storeCode (via applicableStoreCodes)
      // further down — that field is an array on those documents, not a plain storeCode, so it
      // can't be passed as a query param the way it can for /catalog.
      const [catalogRes, offersRes, discountsRes] = await Promise.all([
        getCatalogApi({ storeCode, posOnly: "true", limit: 500 }),
        fetch(`${API_BASE}/api/pos/offers?limit=300`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/pos/discounts?limit=500`, { headers: authHeaders() }),
      ]);

      if (!offersRes.ok) throw new Error("Offers API failed");
      if (!discountsRes.ok) throw new Error("Discounts API failed");

      const offersData = await offersRes.json();
      const discountsData = await discountsRes.json();

      const catalogItems: ApiCatalogItem[] = catalogRes.items || [];
      const offers: ApiOffer[] = normalizeList(offersData);
      const discounts: ApiDiscount[] = normalizeList(discountsData);

      setAllOffers(offers);
      setAllDiscounts(discounts);

      // Build discount map, keyed by both productId and sku
      const discountMap = new Map<string, ApiDiscount>();
      discounts.forEach((d: ApiDiscount) => {
        if (d.productId) discountMap.set(d.productId, d);
        if (d.sku) discountMap.set(d.sku, d);
      });
      setDiscountMap(discountMap);

      // Catalog items already carry per-store ATP stock, so no separate inventory join is needed
      const mapped = catalogItems.map((x) => mapCatalogItem(x, offers, discounts, storeCode));
      setAllProducts(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to load POS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  // ---- Cashier shift / session ----
  const loadSession = async () => {
    setSessionLoading(true);
    try {
      const current = await getCurrentSessionApi({ cashierId });
      setSession(current);
    } catch {
      setSession(null);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---- Live customer lookup by mobile number ----
  useEffect(() => {
    if (!phone || phone.length < 10) {
      setFoundCustomer(null);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const result = await getCustomersApi({ phone, limit: 1 });
        setFoundCustomer(result.items?.[0] || null);
      } catch {
        setFoundCustomer(null);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [phone]);

  // ---- Lookup functions ----
  const productByBarcode = (barcode: string) => allProducts.find((p) => p.barcode === barcode);
  const productBySku = (sku: string) => allProducts.find((p) => p.sku === sku);

  // ---- Filtered products ----
  const filtered = useMemo(() =>
    allProducts
      .filter((p) => p.status === "active")
      .filter((p) =>
        (group === "All" || p.group === group) &&
        (p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()) ||
          p.barcode.includes(query))
      ),
    [allProducts, query, group],
  );

  // ---- LOB filter pills, derived from whatever this store's catalog actually contains ----
  const groupOptions = useMemo(
    () => ["All", ...Array.from(new Set(allProducts.map((p) => p.group))).sort()] as (ProductCategoryGroup | "All")[],
    [allProducts],
  );

  // ---- Cart actions ----
  const stockAvailable = (p: PosProduct) =>
    p.stock - (cart.find((l) => l.product.id === p.id)?.qty ?? 0);

  const add = (p: PosProduct, qty = 1) => {
    if (!p.isSellable) {
      toast.error(`${p.name} is not available for sale at this store`);
      return;
    }
    if (stockAvailable(p) < qty) {
      toast.error(`Only ${p.stock} units of ${p.name} in store`);
      return;
    }
    // Get discount info from map (keyed by productId or sku, not Mongo _id)
    const apiDiscount = discountMap.get(p.sku);
    const discount: ProductDiscount | undefined = apiDiscount ? {
      discountPct: apiDiscount.discountValue,
      maxDiscount: apiDiscount.maxDiscountAmount,
      requiresApproval: apiDiscount.requiresManagerApproval,
      name: apiDiscount.discountName,
    } : undefined;

    // Determine effective discount: use discount if exists and better than offer
    let effectivePct = 0;
    let appliedOffer: ProductOffer | undefined;
    let appliedDiscount: ProductDiscount | undefined;
    if (discount && (!p.offer || discount.discountPct > p.offer.discountPct)) {
      effectivePct = discount.discountPct;
      appliedDiscount = discount;
      appliedOffer = undefined;
    } else if (p.offer) {
      effectivePct = p.offer.discountPct;
      // The Offer type does not have name, so we use a placeholder
      appliedOffer = { discountPct: p.offer.discountPct, maxDiscount: 0, name: "Offer" };
      appliedDiscount = undefined;
    }

    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === p.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === p.id ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [...prev, {
        product: p,
        qty,
        itemDiscPct: effectivePct,
        appliedOffer,
        appliedDiscount,
      }];
    });
  };

  const inc = (id: string) => {
    const line = cart.find((l) => l.product.id === id);
    if (!line) return;
    if (line.qty + 1 > line.product.stock) { toast.error(`Only ${line.product.stock} in stock`); return; }
    setCart((c) => c.map((l) => l.product.id === id ? { ...l, qty: l.qty + 1 } : l));
  };
  const dec = (id: string) => setCart((c) => c.flatMap((l) => l.product.id === id ? (l.qty <= 1 ? [] : [{ ...l, qty: l.qty - 1 }]) : [l]));
  const remove = (id: string) => setCart((c) => c.filter((l) => l.product.id !== id));
  const setItemDisc = (id: string, pct: number) =>
    setCart((c) => c.map((l) => l.product.id === id ? { ...l, itemDiscPct: Math.max(0, Math.min(50, pct)) } : l));

  // ---- Barcode scan ----
  const onScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = (e.target as HTMLInputElement).value.trim();
    if (!code) return;
    const p = productByBarcode(code) ?? productBySku(code);
    if (p) { add(p); (e.target as HTMLInputElement).value = ""; toast.success(`Added ${p.name}`); }
    else toast.error(`No product for ${code}`);
  };

  // ---- Totals ----
  const lineTotals = cart.map((line) => {
    const basePrice = line.product.price;
    const gross = basePrice * line.qty;
    const discPct = line.itemDiscPct || 0;
    const itemDisc = Math.round((gross * discPct) / 100);
    const net = gross - itemDisc;

    // GST fixed at 18%, inclusive calculation (net already includes GST)
    const taxableValue = Math.round(net / 1.18);
    const gst = net - taxableValue;

    return { line, gross, itemDisc, net, taxableValue, gst, gstPct: 18, discPct };
  });

  const subtotal = lineTotals.reduce((s, x) => s + x.gross, 0);
  const itemDiscTotal = lineTotals.reduce((s, x) => s + x.itemDisc, 0);
  const afterItemDisc = subtotal - itemDiscTotal;

  const billDiscAmt = Math.round((afterItemDisc * billDisc) / 100);

  const gstTotal = lineTotals.reduce((s, x) => s + x.gst, 0);
  const taxable = lineTotals.reduce((s, x) => s + x.taxableValue, 0) - billDiscAmt;

  // Bill-level offers
  const billOffers = allOffers.filter(o =>
    o.status === "ACTIVE" &&
    o.offerType === "BILL" &&
    o.discountValueType === "FREE_DELIVERY" &&
    o.applicableStoreCodes.includes(storeCode) &&
    o.channel.includes("POS") &&
    o.minimumBillAmount <= taxable + gstTotal
  );
  const freeDelivery = billOffers.length > 0;

  const serviceOffers = allOffers.filter(o =>
    o.status === "ACTIVE" &&
    o.offerType === "SERVICE" &&
    o.discountValueType === "FREE_SERVICE" &&
    o.applicableStoreCodes.includes(storeCode) &&
    o.channel.includes("POS")
  );
  const freeInstallation = serviceOffers.some(o =>
    cart.some(line =>
      o.applicableMainCategory && line.product.group === o.applicableMainCategory
    )
  );

  const deliveryCharge = freeDelivery ? 0 : delivery;
  const installationCharge = freeInstallation ? 0 : installation;
  const charges = (Number(deliveryCharge) || 0) + (Number(installationCharge) || 0);
  const raw = taxable + gstTotal + charges;
  const rounded = Math.round(raw);
  const roundOff = rounded - raw;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const totalBeforeVoucher = Math.max(0, rounded - couponDiscount);
  // Self-clamps if the cart shrinks after a voucher was applied, so the discount
  // can never exceed what's actually still payable.
  const voucherDiscount = appliedVoucher ? Math.min(voucherApplyAmount, totalBeforeVoucher) : 0;
  const total = Math.max(0, totalBeforeVoucher - voucherDiscount);
  // Credit note is a TENDER mode (like Cash/UPI/Card), not a bill discount — it
  // doesn't reduce `total`, it just covers part of it; see checkout()'s payment-line build.
  const creditNoteDiscount = appliedCreditNote ? Math.min(creditNoteApplyAmount, total) : 0;
  const balance = Math.max(0, total - (Number(paid) || 0));

  const reset = () => {
    setCart([]); setPhone(""); setBillDisc(0); setDelivery(0); setInstallation(0); setPaid(0);
    setAppliedCoupon(null); setCouponCode(""); setCouponError("");
    setAppliedVoucher(null); setVoucherApplyAmount(0);
    setAppliedCreditNote(null); setCreditNoteApplyAmount(0); setCreditNoteOtpId("");
    setNewCustomerDetails(EMPTY_NEW_CUSTOMER);
    setScheduleDelivery(false); setDeliveryDate(""); setDeliveryOption("HOME_DELIVERY"); setDeliverySiteCode("");
    // Payment plan/method must not leak into the next customer's bill — a stale
    // PARTIAL plan + amount from the previous sale would otherwise silently try
    // to collect the wrong amount against the new (different) total.
    setShowBillingForm(false);
    setPaymentPlan("FULL");
    setPartialPercent(50);
    setPartialAmount(0);
    setPaymentMethod("UPI");
    setPaymentLines([]);
    setUpiQr(""); setUpiAmount(0);
    setCardInfo({ cardNumber: "", cardHolderName: "", cardType: "VISA", bankName: "", approvalCode: "" });
    setCashNotes({ "2000": 0, "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0 });
  };

  // ---- Right Action Rail dispatcher: every entry only opens its drawer. ----
  const openRailAction = (action: PosAction) => {
    switch (action) {
      case "RETURN": setShowReturn(true); break;
      case "SEARCH_BILL": setShowSearchBill(true); break;
      case "VOUCHER_COUPON": setShowVoucherCoupon(true); break;
      case "PROMOTION_DISCOUNT": setShowPromotionDiscount(true); break;
      case "CREDIT_NOTE": setShowCreditNoteTender(true); break;
      case "HELD_BILLS": setShowHeldBills(true); break;
    }
  };

  // ---- Hold the in-progress bill so the counter can serve the next customer,
  // then come back to it later via Held Bills / recall. ----
  const holdCurrentBill = async () => {
    if (!cart.length) return toast.error("Cart is empty");

    setHoldingBill(true);
    try {
      await holdBillApi({
        storeCode,
        storeName,
        cashierId,
        cashierName,
        customerPhone: phone,
        customer: {
          phone,
          name: foundCustomer?.customerName || foundCustomer?.name || newCustomerDetails.name || "Walk-in Customer",
        },
        items: cart,
        subtotal,
        discountAmount: itemDiscTotal + billDiscAmt,
        gstAmount: gstTotal,
        grandTotal: total,
        posState: {
          billDisc, delivery, installation,
          foundCustomer, newCustomerDetails,
          scheduleDelivery, deliveryDate, deliveryOption, deliverySiteCode,
        },
      });
      toast.success("Bill held — free to start the next customer");
      reset();
    } catch (err: any) {
      toast.error(err.message || "Failed to hold bill");
    } finally {
      setHoldingBill(false);
    }
  };

  // ---- Recall a held bill back into the active cart ----
  const recallHeldBillIntoCart = (bill: ApiHeldBill) => {
    setCart(bill.items || []);
    setPhone(bill.customerPhone || "");

    const ps = bill.posState || {};
    setBillDisc(ps.billDisc || 0);
    setDelivery(ps.delivery || 0);
    setInstallation(ps.installation || 0);
    setFoundCustomer(ps.foundCustomer || null);
    setNewCustomerDetails(ps.newCustomerDetails || EMPTY_NEW_CUSTOMER);
    setScheduleDelivery(!!ps.scheduleDelivery);
    setDeliveryDate(ps.deliveryDate || "");
    setDeliveryOption(ps.deliveryOption || "HOME_DELIVERY");
    setDeliverySiteCode(ps.deliverySiteCode || "");
  };

  // ---- Payment helpers ----
  const cashTotal = useMemo(() => {
    return Object.entries(cashNotes).reduce(
      (sum, [note, count]) => sum + Number(note) * Number(count || 0),
      0
    );
  }, [cashNotes]);

  // methodOverride lets a payment-method button apply the plan against the method
  // it just clicked, instead of the pre-click `paymentMethod` (setPaymentMethod
  // hasn't flushed yet when these run synchronously in the same click handler).
  const applyFullPayment = (methodOverride?: PaymentMethod) => {
    const effectiveMethod = methodOverride ?? paymentMethod;
    setPaymentPlan("FULL");
    setPaid(total);

    if (effectiveMethod === "SPLIT") {
      const half = Math.round(total * 0.5);
      setPaymentLines([
        { method: "CASH", amount: half, cashNotes },
        { method: "UPI", amount: total - half },
      ]);
      return;
    }

    if (effectiveMethod === "UPI") {
      setPaymentLines([{ method: "UPI", amount: total }]);
    }

    if (effectiveMethod === "CARD") {
      setPaymentLines([{ method: "CARD", amount: total }]);
    }

    if (effectiveMethod === "CASH") {
      setPaymentLines([{ method: "CASH", amount: total, cashNotes }]);
    }
  };

  const applyPartialByPercent = (pct: number, methodOverride?: PaymentMethod) => {
    const effectiveMethod = methodOverride ?? paymentMethod;
    const clampedPct = Math.max(1, Math.min(99, pct));
    const amount = Math.round((total * clampedPct) / 100);

    setPaymentPlan("PARTIAL");
    setPartialPercent(clampedPct);
    setPartialAmount(amount);
    setPaid(amount);

    if (effectiveMethod === "SPLIT") {
      setPaymentLines([
        { method: "CASH", amount, cashNotes },
        { method: "UPI", amount: 0 },
      ]);
    } else {
      setPaymentLines([{ method: effectiveMethod as "UPI" | "CARD" | "CASH", amount }]);
    }
  };

  const applyPartialByAmount = (amountValue: number, methodOverride?: PaymentMethod) => {
    const effectiveMethod = methodOverride ?? paymentMethod;
    const amount = Math.max(0, Math.min(total, Math.round(amountValue || 0)));
    const pct = total > 0 ? Math.round((amount / total) * 100) : 0;

    setPaymentPlan("PARTIAL");
    setPartialAmount(amount);
    setPartialPercent(pct);
    setPaid(amount);

    if (effectiveMethod === "SPLIT") {
      setPaymentLines([
        { method: "CASH", amount, cashNotes },
        { method: "UPI", amount: 0 },
      ]);
    } else {
      setPaymentLines([{ method: effectiveMethod as "UPI" | "CARD" | "CASH", amount }]);
    }
  };

  const generateUpiQr = async (amount = total) => {
    try {
      const res = await fetch(`${API_BASE}/api/pos/pos-checkout/upi-qr`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          amount,
          orderId: `TEMP-${Date.now()}`,
          upiId: "hometown@upi",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to generate QR");
      }

      setUpiQr(data.data.qrDataUrl);
      setUpiAmount(amount);
      toast.success("UPI QR generated");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const buildPaymentLines = (): PaymentLine[] => {
    const amountToCollect = paymentPlan === "PARTIAL" ? Number(partialAmount || paid || 0) : Number(paid || total);

    if (paymentMethod === "UPI") {
      return [
        {
          method: "UPI",
          amount: amountToCollect,
          upiTransactionId: `UPI-${Date.now()}`,
        },
      ];
    }

    if (paymentMethod === "CARD") {
      return [
        {
          method: "CARD",
          amount: amountToCollect,
          cardNumber: cardInfo.cardNumber,
          cardLast4: cardInfo.cardNumber.slice(-4),
          // cardInfo.cardType holds the card network (VISA/MASTER), not the
          // card class coupon eligibility checks against (CREDIT_CARD/DEBIT_CARD) —
          // keep this constant so it matches what was already validated on Apply.
          cardType: "CREDIT_CARD",
          bankName: cardInfo.bankName || undefined,
          cardHolderName: cardInfo.cardHolderName,
          cardApprovalCode: cardInfo.approvalCode,
        },
      ];
    }

    if (paymentMethod === "CASH") {
      return [
        {
          method: "CASH",
          amount: Number(amountToCollect || cashTotal || total),
          cashNotes,
        },
      ];
    }

    return paymentLines.length
      ? paymentLines
      : [
          { method: "CASH", amount: Math.round(amountToCollect * 0.5), cashNotes },
          { method: "UPI", amount: amountToCollect - Math.round(amountToCollect * 0.5) },
        ];
  };

  const printInvoice = (invoice: any, order: any, payments: any[]) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      toast.error("Popup blocked. Allow popups to print invoice.");
      return;
    }

    const rows = order.items
      .map(
        (item: any) => `
          <tr>
            <td>${item.productName}</td>
            <td>${item.sku}</td>
            <td>${item.quantity}</td>
            <td>₹${item.unitPrice}</td>
            <td>₹${item.gstAmount}</td>
            <td>₹${item.lineTotal}</td>
          </tr>
        `
      )
      .join("");

    const paymentRows = payments
      .map(
        (p: any) => `
          <tr>
            <td>${p.paymentMethod}</td>
            <td>₹${p.amount}</td>
            <td>${p.transactionReference || ""}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial; padding: 24px; color: #1f2937; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 12px; }
            .brand-row { display: flex; align-items: center; gap: 10px; }
            .brand-row img { height: 40px; width: 40px; border-radius: 50%; }
            .brand { font-size: 26px; font-weight: 800; color: #b45309; }
            .muted { color: #6b7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th { background: #fff7ed; color: #9a3412; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
            .total { margin-top: 20px; text-align: right; font-size: 16px; }
            .grand { font-size: 24px; font-weight: 800; color: #ea580c; }
            .footer { margin-top: 30px; font-size: 11px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-row">
                <img src="${window.location.origin}${logo}" alt="HomeTown" />
                <div class="brand">HomeTown POS</div>
              </div>
              <div class="muted">${order.storeName}</div>
              <div class="muted">${order.storeCode}</div>
            </div>
            <div>
              <b>Invoice:</b> ${invoice.invoiceNumber}<br/>
              <b>Order:</b> ${order.orderId}<br/>
              <b>Date:</b> ${new Date().toLocaleString("en-IN")}
            </div>
          </div>

          <p>
            <b>Customer:</b> ${order.customerName}<br/>
            <b>Mobile:</b> ${order.customerPhone}
          </p>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Price</th>
                <th>GST 18%</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <table>
            <thead>
              <tr>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>${paymentRows}</tbody>
          </table>

          <div class="total">
            Subtotal: ₹${invoice.billing?.subtotal}<br/>
            Discount: ₹${invoice.billing?.discountTotal}<br/>
            GST 18%: ₹${invoice.billing?.taxTotal}<br/>
            ${invoice.billing?.couponCode ? `Coupon (${invoice.billing.couponCode}): − ₹${invoice.billing.couponDiscount}<br/>` : ""}
            Paid: ₹${invoice.billing?.paidAmount}<br/>
            Due: ₹${invoice.billing?.dueAmount}<br/>
            <div class="grand">Grand Total: ₹${invoice.billing?.grandTotal}</div>
          </div>

          <div class="footer">
            Thank you for shopping with HomeTown.
          </div>

          <script>
            window.print();
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // ---- Coupon ----
  const validateCoupon = async () => {
    try {
      setCouponError("");

      if (!couponCode.trim()) {
        setCouponError("Enter coupon code");
        return;
      }

      if (!cart.length) {
        setCouponError("Add products before applying coupon");
        return;
      }

      if (!phone || phone.length < 10) {
        setCouponError("Enter customer mobile number before applying coupon");
        return;
      }

      setCouponLoading(true);

      const paymentModeForCoupon = paymentMethod === "SPLIT" ? "MIXED" : paymentMethod;

      const result = await validateCouponApi({
        offerCode: couponCode.trim().toUpperCase(),
        storeCode,
        storeName,
        customerPhone: phone,
        billAmount: Math.round(taxable + gstTotal + charges),
        paymentMode: paymentModeForCoupon,
        bankName: paymentMethod === "CARD" ? cardInfo.bankName || undefined : undefined,
        cardType: paymentMethod === "CARD" ? "CREDIT_CARD" : undefined,
        cashierId: user?.employeeCode || user?.username || "",
        cashierName: user?.name || "",
      });

      setAppliedCoupon(result);
      setCouponCode(result.offerCode);
    } catch (error: any) {
      setAppliedCoupon(null);
      setCouponError(error.message || "Coupon invalid");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // ---- Voucher ----
  const applyVoucher = (voucher: ApiVoucher, amount: number) => {
    setAppliedVoucher(voucher);
    setVoucherApplyAmount(Math.max(0, Math.min(amount, voucher.availableAmount)));
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherApplyAmount(0);
  };

  // ---- Credit note tender ----
  const applyCreditNote = (creditNote: ApiCreditNote, amount: number, otpId: string) => {
    setAppliedCreditNote(creditNote);
    setCreditNoteApplyAmount(Math.max(0, Math.min(amount, creditNote.availableAmount)));
    setCreditNoteOtpId(otpId);
  };

  const removeCreditNote = () => {
    setAppliedCreditNote(null);
    setCreditNoteApplyAmount(0);
    setCreditNoteOtpId("");
  };

  // ---- Checkout ----
  const checkout = async () => {
    if (!session) return toast.error("Start your shift before billing");
    if (!cart.length) return toast.error("Cart is empty");
    if (!phone || phone.length < 10) return toast.error("Enter valid customer mobile number");

    // Discounts/refunds/etc. are no longer blocked at checkout — exceptions are
    // flagged automatically on the cashier's session and reviewed by the manager later.
    setCheckingOut(true);

    try {
      const rawPayments = buildPaymentLines();
      const finalPaid = rawPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Credit note is a tender mode, not a discount — it substitutes for part of
      // whatever the cashier was going to collect via cash/UPI/card, so the chosen
      // method's line(s) get netted down by the credit note amount and a separate
      // CREDIT_NOTE line is appended for the difference (total collected is unchanged).
      let finalPayments = rawPayments;
      if (appliedCreditNote && creditNoteDiscount > 0) {
        let remaining = creditNoteDiscount;
        finalPayments = rawPayments
          .map((p) => {
            if (remaining <= 0) return p;
            const reduce = Math.min(p.amount, remaining);
            remaining -= reduce;
            return { ...p, amount: p.amount - reduce };
          })
          .filter((p) => p.amount > 0);
      }

      const payload: CashierCheckoutPayload = {
        storeCode,
        storeName,
        cashierId,
        cashierName,
        posDeviceId,

        // foundCustomer is an existing record — its own fields win. Otherwise this is a
        // brand-new customer, so the manually-entered optional details apply instead.
        customer: {
          phone,
          name: foundCustomer?.customerName || foundCustomer?.name || newCustomerDetails.name || "Walk-in Customer",
          email: foundCustomer?.email || newCustomerDetails.email || "",
          city: foundCustomer?.city || newCustomerDetails.city || "",
          gstNumber: foundCustomer?.gstNumber || foundCustomer?.gstin || newCustomerDetails.gstNumber || "",
          panNumber: newCustomerDetails.panNumber || "",
          billingAddress: newCustomerDetails.billingAddress || "",
          deliveryAddress: newCustomerDetails.deliveryAddress || "",
        },

        // cashierCheckout derives the item discount from (mrp - unitPrice), so the
        // manual per-line discount % has to be baked into unitPrice here rather than
        // sent as a separate percentage field like the old /pos-checkout payload did.
        items: cart.map((line) => {
          const discountedUnitPrice = Math.round(
            line.product.price * (1 - (line.itemDiscPct || 0) / 100)
          );

          return {
            productId: line.product.productId || line.product.id,
            sku: line.product.sku,
            articleNo: line.product.articleNo || line.product.sku,
            productName: line.product.name,
            brand: line.product.brand,
            category: line.product.category,
            lob: line.product.group,
            quantity: line.qty,
            mrp: line.product.mrp,
            unitPrice: discountedUnitPrice,
            sellingPrice: discountedUnitPrice,
            gstPercent: 18,
          };
        }),

        billDiscountPercent: billDisc,
        couponCode: appliedCoupon?.offerCode || "",
        couponDiscount: appliedCoupon?.discountAmount || 0,
        voucherCode: appliedVoucher?.voucherCode || "",
        voucherDiscount,
        deliveryFee: deliveryCharge,
        installationFee: installationCharge,

        payments: [
          ...finalPayments.map((p) => ({
            paymentMode: p.method,
            paymentMethod: p.method,
            amount: Number(p.amount || 0),
            upiTransactionId: p.upiTransactionId,
            cardLast4: p.cardLast4,
            cardType: p.cardType,
            bankName: p.bankName,
            cardHolderName: p.cardHolderName,
            cardApprovalCode: p.cardApprovalCode,
            cashNotes: p.cashNotes,
            transactionReference: p.upiTransactionId || p.cardApprovalCode,
          })),
          ...(appliedCreditNote && creditNoteDiscount > 0
            ? [{
                paymentMode: "CREDIT_NOTE",
                paymentMethod: "CREDIT_NOTE",
                amount: creditNoteDiscount,
                transactionReference: appliedCreditNote.creditNoteId,
              }]
            : []),
        ],
      };

      const result = await cashierCheckoutApi(payload);

      // cashierCheckout trusts the coupon discount it's given but doesn't mark the
      // coupon as redeemed itself, so that has to happen as a follow-up call here.
      if (appliedCoupon) {
        try {
          await markCouponAvailedApi(appliedCoupon.offerCode, {
            storeCode,
            storeName,
            customerId: result.customer.customerId,
            customerName: result.customer.customerName || result.customer.name,
            customerPhone: phone,
            orderId: result.order.orderId,
            invoiceId: result.invoice.invoiceId,
            billAmount: appliedCoupon.billAmount,
            discountAmount: appliedCoupon.discountAmount,
            finalPayableAmount: appliedCoupon.finalPayableAmount,
            paymentMode: payload.payments.length > 1 ? "MIXED" : payload.payments[0]?.paymentMode,
            cashierId,
            cashierName,
          });
        } catch (couponError: any) {
          toast.error(`Sale saved, but coupon could not be marked used: ${couponError.message}`);
        }
      }

      // Same pattern as the coupon follow-up above: the voucher's balance is only
      // actually decremented once the sale has successfully gone through.
      if (appliedVoucher && voucherDiscount > 0) {
        try {
          await redeemVoucherApi({
            voucherCode: appliedVoucher.voucherCode,
            customerPhone: phone,
            amount: voucherDiscount,
          });
        } catch (voucherError: any) {
          toast.error(`Sale saved, but voucher could not be redeemed: ${voucherError.message}`);
        }
      }

      // Same pattern again: the credit note's balance is only actually decremented
      // once the sale has gone through, re-verifying the already-confirmed OTP server-side.
      if (appliedCreditNote && creditNoteDiscount > 0) {
        try {
          await redeemCreditNoteApi({
            creditNoteId: appliedCreditNote.creditNoteId,
            customerPhone: phone,
            amount: creditNoteDiscount,
            otpId: creditNoteOtpId,
            invoiceId: result.invoice.invoiceId,
            orderId: result.order.orderId,
          });
        } catch (creditNoteError: any) {
          toast.error(`Sale saved, but credit note could not be redeemed: ${creditNoteError.message}`);
        }
      }

      const paymentSummary = finalPaid >= total
        ? `${formatINR(total)} collected`
        : `${formatINR(finalPaid)} collected · ${formatINR(total - finalPaid)} pending`;

      toast.success(`Invoice ${result.invoice.invoiceNumber} saved`, {
        description: appliedCoupon
          ? `Coupon ${appliedCoupon.offerCode} applied: ${formatINR(appliedCoupon.discountAmount)} · ${paymentSummary}`
          : paymentSummary,
      });

      printInvoice(result.invoice, result.order, result.payments);

      if (scheduleDelivery) {
        try {
          await createDeliveryScheduleApi({
            orderId: result.order.orderId,
            invoiceId: result.invoice.invoiceId,
            storeCode,
            storeName,
            customerPhone: phone,
            customerName: foundCustomer?.customerName || foundCustomer?.name || newCustomerDetails.name || "",
            deliveryOption,
            deliveryDate,
            deliverySiteCode,
            billingAddress: newCustomerDetails.billingAddress,
            shippingAddress: newCustomerDetails.deliveryAddress,
          });
        } catch (scheduleError: any) {
          toast.error(`Sale saved, but delivery could not be scheduled: ${scheduleError.message}`);
        }
      }

      reset();
      loadSession();
    } catch (error: any) {
      toast.error(error.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  useEffect(() => { scanRef.current?.focus(); }, []);

  // ---- Keyboard shortcuts: fast counter operation without reaching for the mouse ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "F2":
          e.preventDefault();
          scanRef.current?.focus();
          break;
        case "F4":
          e.preventDefault();
          phoneRef.current?.focus();
          break;
        case "F6":
          e.preventDefault();
          setPaymentMethod("CASH");
          break;
        case "F7":
          e.preventDefault();
          setPaymentMethod("UPI");
          generateUpiQr(total);
          break;
        case "F8":
          e.preventDefault();
          setPaymentMethod("CARD");
          break;
        case "F9":
          e.preventDefault();
          setPaymentMethod("SPLIT");
          break;
        case "F10":
          e.preventDefault();
          if (paymentPlan === "FULL") applyFullPayment();
          setShowBillingForm(true);
          break;
        case "Escape":
          setShowCloseShift(false);
          setShowBillingForm(false);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, cashNotes, paymentPlan]);

  // ---- Loading / error ----
  if (!user) return null;

  if (loading) {
    return (
      <PosShell user={user} session={session}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" />
        </div>
      </PosShell>
    );
  }

  if (error) {
    return (
      <PosShell user={user} session={session}>
        <div className="h-full grid place-items-center p-6">
          <div className="max-w-md text-center text-red-700 border border-red-200 rounded-3xl bg-red-50 p-6">
            <p>{error}</p>
            <button onClick={fetchData} className="mt-4 text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700">Retry</button>
          </div>
        </div>
      </PosShell>
    );
  }

  // ---- Shift gate: billing requires an OPEN cashier session ----
  if (sessionLoading) {
    return (
      <PosShell user={user} session={session}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" />
        </div>
      </PosShell>
    );
  }

  if (!session) {
    return (
      <PosShell user={user} session={session}>
        <div className="h-full flex items-center justify-center text-sm text-slate-500">
          Start your shift to begin billing.
        </div>
        <StartShiftModal
          user={user}
          locked
          onStarted={(created) => setSession(created)}
        />
      </PosShell>
    );
  }

  // ---- Main billing screen: fixed 3-zone counter layout ----
  return (
    <PosShell
      user={user}
      session={session}
      actions={
        <button onClick={() => setShowCloseShift(true)} className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-white text-emerald-700 px-3 py-2 text-xs font-black hover:bg-emerald-50">
          <StopCircle className="h-4 w-4" /> Close Shift
        </button>
      }
    >
      <div className="flex h-full gap-3 p-3 pb-24">
      <div className="grid grid-cols-12 gap-3 flex-1 min-w-0">
        {/* LEFT ZONE: product search + grid */}
        <section className="col-span-12 lg:col-span-7 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="relative">
                <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                <input ref={scanRef} onKeyDown={onScan} placeholder="Scan barcode / SKU + Enter  (F2)"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-base font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products by name / SKU"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-white text-base font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto">
              {groupOptions.map((g) => (
                <button key={g} onClick={() => setGroup(g)}
                  className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${
                    group === g ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-100"
                  }`}>{g}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((p) => {
              const left = stockAvailable(p);
              const out = left <= 0 || !p.isSellable;
              const discount = discountMap.get(p.sku);
              const offer = p.offer;
              const showDiscount = discount && (!offer || discount.discountValue > offer.discountPct);
              return (
                <button key={p.id} onClick={() => add(p)} disabled={out}
                  className={`text-left rounded-2xl border p-3 shadow-sm transition-all relative ${
                    out ? "bg-red-50 border-red-200 opacity-70" : "bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md"
                  }`}>
                  {showDiscount ? (
                    <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 border border-teal-200 inline-flex items-center gap-1 z-10">
                      <Tag className="h-2.5 w-2.5" /> {discount.discountValue}% OFF
                    </span>
                  ) : offer && (
                    <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center gap-1 z-10">
                      <Tag className="h-2.5 w-2.5" /> {offer.discountPct}%
                    </span>
                  )}
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-50 to-amber-100 overflow-hidden border border-emerald-100">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-3xl font-black text-emerald-200">
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">{p.sku}</div>
                  <div className="text-sm font-black text-slate-900 line-clamp-2 leading-snug">{p.name}</div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="rounded-lg bg-slate-50 px-2 py-1">
                      <div className="text-slate-400 text-[9px]">ATP</div>
                      <div className="font-black text-slate-900">{p.stock}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1">
                      <div className="text-slate-400 text-[9px]">MRP</div>
                      <div className="font-black text-slate-400 line-through">{formatINR(p.mrp)}</div>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span className="text-base font-black text-emerald-600">{formatINR(p.price)}</span>
                    <StockBadge status={p.stockStatus} />
                  </div>
                  {showDiscount && discount.requiresManagerApproval && (
                    <div className="mt-1 text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded inline-block">Approval needed</div>
                  )}
                  <div className={`mt-2 w-full rounded-xl py-2 text-center text-xs font-black ${
                    out ? "bg-slate-200 text-slate-400" : "bg-emerald-600 text-white"
                  }`}>
                    {out ? "Out of Stock" : "Add to Bill"}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-sm text-slate-400">No products match.</div>
            )}
          </div>
        </section>

        {/* RIGHT ZONE: customer + cart + payment */}
        <section className="col-span-12 lg:col-span-5 rounded-3xl bg-white border border-emerald-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 bg-emerald-600 text-white flex items-center justify-between shrink-0">
            <div>
              <div className="text-[10px] text-white/70 uppercase tracking-wide">Current Bill</div>
              <div className="text-sm font-black">Customer + Cart</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/70">Items</div>
              <div className="text-base font-black">{cart.length}</div>
            </div>
          </div>

          <div className="p-4 bg-white text-slate-950 shrink-0">
            <div className="flex items-center gap-2 text-sm font-black"><UserRound className="h-4 w-4 text-teal-600" /> Customer</div>
            <div className="mt-2 relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input ref={phoneRef} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number  (F4)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50/40 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-300" />
            </div>
            {foundCustomer && (
              <div className="mt-2 flex items-center justify-between rounded-xl bg-teal-50 px-2.5 py-1.5 text-xs">
                <span className="font-black text-teal-700">{foundCustomer.customerName || foundCustomer.name}</span>
                <span className="text-slate-500">
                  {foundCustomer.invoiceCount || foundCustomer.orderCount || 0} visits ·{" "}
                  {formatINR(foundCustomer.totalHistoricalSalesValue || foundCustomer.totalSpent || foundCustomer.totalSpend || 0)}
                </span>
              </div>
            )}
            {phone.length >= 10 && !foundCustomer && (
              <div className="mt-2 text-[11px] text-slate-400 px-1">New customer — will be created on checkout.</div>
            )}

            <button
              onClick={() => setScheduleDelivery((s) => !s)}
              className={`mt-3 w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-black transition-colors ${
                scheduleDelivery ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-100"
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Schedule Delivery</span>
              <span>{scheduleDelivery ? "ON" : "OFF"}</span>
            </button>

            {scheduleDelivery && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select value={deliveryOption} onChange={(e) => setDeliveryOption(e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-xs">
                  <option value="HOME_DELIVERY">Home Delivery</option>
                  <option value="STORE_PICKUP">Store Pickup</option>
                </select>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                <input value={deliverySiteCode} onChange={(e) => setDeliverySiteCode(e.target.value)} placeholder="Site code"
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs" />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px] bg-slate-50">
            {cart.length === 0 && (
              <div className="text-center py-10 text-sm text-slate-400">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Scan or tap a product to start.
              </div>
            )}
            {lineTotals.map(({ line: l, net, gstPct, discPct }) => (
              <div key={l.product.id} className="rounded-xl bg-white text-slate-950 p-2.5 shadow-sm border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold line-clamp-1">{l.product.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{l.product.sku} · {gstPct}% GST</div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1 rounded-md border border-slate-200">
                        <button onClick={() => dec(l.product.id)} className="p-1 hover:bg-slate-100"><Minus className="h-3 w-3" /></button>
                        <span className="w-7 text-center text-sm font-bold">{l.qty}</span>
                        <button onClick={() => inc(l.product.id)} className="p-1 hover:bg-slate-100"><Plus className="h-3 w-3" /></button>
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Percent className="h-3 w-3" />
                        <input type="number" min={0} max={50} value={l.itemDiscPct}
                          onChange={(e) => setItemDisc(l.product.id, Number(e.target.value) || 0)}
                          className="w-10 px-1 py-0.5 rounded border border-slate-200 bg-white text-right text-[11px]" />
                        disc
                      </div>
                      {l.appliedDiscount && (
                        <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">Discount</span>
                      )}
                      {l.appliedOffer && !l.appliedDiscount && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Offer</span>
                      )}
                      {l.appliedDiscount?.requiresApproval && (
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded">Approval</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 line-through">{formatINR(l.product.mrp * l.qty)}</div>
                    <div className="text-sm font-black">{formatINR(net)}</div>
                    <button onClick={() => remove(l.product.id)} className="mt-1 text-slate-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white text-slate-950 p-4 space-y-2 shrink-0">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            {itemDiscTotal > 0 && <Row label="Item discounts" value={`- ${formatINR(itemDiscTotal)}`} muted />}
            <Row label="GST" value={formatINR(gstTotal)} muted />
            {appliedCoupon && (
              <div className="flex items-center justify-between text-emerald-700 font-bold text-sm">
                <span>Coupon Discount</span>
                <span>− {formatINR(appliedCoupon.discountAmount)}</span>
              </div>
            )}
            {appliedVoucher && voucherDiscount > 0 && (
              <div className="flex items-center justify-between text-teal-700 font-bold text-sm">
                <span>Voucher ({appliedVoucher.voucherCode})</span>
                <span>− {formatINR(voucherDiscount)}</span>
              </div>
            )}
            {appliedCreditNote && creditNoteDiscount > 0 && (
              <div className="flex items-center justify-between text-amber-700 font-bold text-sm">
                <span>Credit Note ({appliedCreditNote.creditNoteId}) — tender</span>
                <span>{formatINR(creditNoteDiscount)}</span>
              </div>
            )}

            {/* Grand total must always read at a glance — compact, not oversized */}
            <div className="rounded-2xl bg-emerald-700 text-white p-3">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[11px] text-white/70">Grand Total</div>
                  <div className="text-2xl font-black">{formatINR(total)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-white/70">Items</div>
                  <div className="text-base font-black">{cart.length}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (paymentPlan === "FULL") applyFullPayment();
                setShowBillingForm(true);
              }}
              disabled={!cart.length}
              className="w-full rounded-2xl bg-emerald-600 text-white py-3 font-black text-sm hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Receipt className="h-4 w-4" /> Open Billing Form
            </button>
          </div>
        </section>
      </div>

      <RightActionRail onOpen={openRailAction} />
      </div>

      {/* FIXED BOTTOM BAR: cart total and the complete-bill action are always visible */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-emerald-700 text-white border-t border-white/10 px-4 flex items-center justify-between z-40">
        <div className="flex gap-2">
          <button onClick={reset} className="rounded-2xl bg-emerald-800 px-4 py-2.5 text-xs font-black hover:bg-emerald-900 inline-flex items-center gap-1.5">
            <Ban className="h-3.5 w-3.5" /> Clear
          </button>

          <button
            onClick={holdCurrentBill}
            disabled={holdingBill || !cart.length}
            title="Hold this bill and free up the counter for the next customer"
            className="rounded-2xl bg-emerald-800 px-4 py-2.5 text-xs font-black hover:bg-emerald-900 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {holdingBill ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PauseCircle className="h-3.5 w-3.5" />}
            Hold
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] text-white/70">Payable</div>
            <div className="text-2xl font-black">{formatINR(total)}</div>
          </div>

          <button
            onClick={() => { applyFullPayment(); checkout(); }}
            disabled={checkingOut || !cart.length}
            title="Skip the billing form and collect full payment immediately"
            className="rounded-2xl bg-emerald-800 text-white hover:bg-emerald-900 px-4 py-3 font-black text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            Full Pay Checkout
          </button>

          <button
            onClick={() => {
              if (paymentPlan === "FULL") applyFullPayment();
              setShowBillingForm(true);
            }}
            disabled={checkingOut || !cart.length}
            className="rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 font-black text-sm disabled:opacity-60 inline-flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing Form  (F10)
          </button>
        </div>
      </div>

      {/* Right Action Rail capability drawers */}
      {showReturn && <ReturnCreditNoteDrawer storeCode={storeCode} onClose={() => setShowReturn(false)} />}
      {showSearchBill && <SearchBillDrawer storeCode={storeCode} onClose={() => setShowSearchBill(false)} />}
      {showHeldBills && (
        <HeldBillsDrawer
          storeCode={storeCode}
          cartHasItems={cart.length > 0}
          onRecall={recallHeldBillIntoCart}
          onClose={() => setShowHeldBills(false)}
        />
      )}
      {showVoucherCoupon && (
        <VoucherCouponDrawer
          phone={phone}
          appliedVoucher={appliedVoucher}
          voucherApplyAmount={voucherApplyAmount}
          totalBeforeVoucher={totalBeforeVoucher}
          onApplyVoucher={applyVoucher}
          onRemoveVoucher={removeVoucher}
          onClose={() => setShowVoucherCoupon(false)}
        />
      )}
      {showPromotionDiscount && (
        <PromotionDiscountDrawer
          storeCode={storeCode}
          offers={allOffers}
          discounts={allDiscounts}
          billDisc={billDisc}
          onClose={() => setShowPromotionDiscount(false)}
        />
      )}
      {showCreditNoteTender && (
        <CreditNoteTenderDrawer
          phone={phone}
          appliedCreditNote={appliedCreditNote}
          creditNoteApplyAmount={creditNoteApplyAmount}
          total={total}
          onApplyCreditNote={applyCreditNote}
          onRemoveCreditNote={removeCreditNote}
          onClose={() => setShowCreditNoteTender(false)}
        />
      )}

      {/* Close shift modal */}
      {showCloseShift && (
        <CloseShiftModal
          session={session}
          onClose={() => setShowCloseShift(false)}
          onClosed={() => {
            setShowCloseShift(false);
            setSession(null);
          }}
        />
      )}

      {/* Billing form drawer: customer + discount + coupon + payment plan + payment method */}
      {showBillingForm && (
        <BillingFormDrawer
          onClose={() => setShowBillingForm(false)}
          phone={phone} setPhone={setPhone} phoneRef={phoneRef}
          foundCustomer={foundCustomer}
          newCustomerDetails={newCustomerDetails} setNewCustomerDetails={setNewCustomerDetails}
          billDisc={billDisc} setBillDisc={setBillDisc}
          delivery={delivery} setDelivery={setDelivery}
          installation={installation} setInstallation={setInstallation}
          freeDelivery={freeDelivery} freeInstallation={freeInstallation}
          couponCode={couponCode} setCouponCode={setCouponCode}
          appliedCoupon={appliedCoupon} couponLoading={couponLoading} couponError={couponError}
          validateCoupon={validateCoupon} removeCoupon={removeCoupon}
          paymentPlan={paymentPlan}
          partialPercent={partialPercent} partialAmount={partialAmount}
          applyFullPayment={applyFullPayment}
          applyPartialByPercent={applyPartialByPercent}
          applyPartialByAmount={applyPartialByAmount}
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
          generateUpiQr={generateUpiQr} upiQr={upiQr} upiAmount={upiAmount}
          cardInfo={cardInfo} setCardInfo={setCardInfo}
          cashNotes={cashNotes} setCashNotes={setCashNotes} cashTotal={cashTotal}
          paymentLines={paymentLines} setPaymentLines={setPaymentLines}
          subtotal={subtotal} itemDiscTotal={itemDiscTotal} gstTotal={gstTotal}
          total={total} paid={paid}
          checkingOut={checkingOut}
          onCompleteBill={checkout}
        />
      )}
    </PosShell>
  );
}

// ---- Helper components (unchanged) ----
function Row({ label, value, input, muted }: { label: string; value?: string; input?: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      {input ?? <span className={muted ? "text-muted-foreground" : ""}>{value}</span>}
    </div>
  );
}

function StockBadge({ status }: { status: StockStatus }) {
  const cls =
    status === "IN_STOCK"
      ? "bg-emerald-100 text-emerald-700"
      : status === "LIMITED_STOCK"
      ? "bg-amber-100 text-amber-700"
      : status === "LOW_STOCK"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-700";

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black whitespace-nowrap ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ---- Billing form drawer: customer + discount + coupon + payment plan + payment method ----
function BillingFormDrawer({
  onClose,
  phone, setPhone, phoneRef,
  foundCustomer,
  newCustomerDetails, setNewCustomerDetails,
  billDisc, setBillDisc,
  delivery, setDelivery,
  installation, setInstallation,
  freeDelivery, freeInstallation,
  couponCode, setCouponCode,
  appliedCoupon, couponLoading, couponError,
  validateCoupon, removeCoupon,
  paymentPlan,
  partialPercent, partialAmount,
  applyFullPayment, applyPartialByPercent, applyPartialByAmount,
  paymentMethod, setPaymentMethod,
  generateUpiQr, upiQr, upiAmount,
  cardInfo, setCardInfo,
  cashNotes, setCashNotes, cashTotal,
  paymentLines, setPaymentLines,
  subtotal, itemDiscTotal, gstTotal,
  total, paid,
  checkingOut,
  onCompleteBill,
}: {
  onClose: () => void;
  phone: string; setPhone: (v: string) => void; phoneRef: React.RefObject<HTMLInputElement | null>;
  foundCustomer: ApiCustomer | null;
  newCustomerDetails: NewCustomerDetails; setNewCustomerDetails: (v: NewCustomerDetails) => void;
  billDisc: number; setBillDisc: (v: number) => void;
  delivery: number; setDelivery: (v: number) => void;
  installation: number; setInstallation: (v: number) => void;
  freeDelivery: boolean; freeInstallation: boolean;
  couponCode: string; setCouponCode: (v: string) => void;
  appliedCoupon: CouponValidationResult | null; couponLoading: boolean; couponError: string;
  validateCoupon: () => void; removeCoupon: () => void;
  paymentPlan: "FULL" | "PARTIAL";
  partialPercent: number; partialAmount: number;
  applyFullPayment: (methodOverride?: PaymentMethod) => void;
  applyPartialByPercent: (pct: number, methodOverride?: PaymentMethod) => void;
  applyPartialByAmount: (amount: number, methodOverride?: PaymentMethod) => void;
  paymentMethod: PaymentMethod; setPaymentMethod: (m: PaymentMethod) => void;
  generateUpiQr: (amount?: number) => void; upiQr: string; upiAmount: number;
  cardInfo: { cardNumber: string; cardHolderName: string; cardType: string; bankName: string; approvalCode: string };
  setCardInfo: (v: any) => void;
  cashNotes: Record<string, number>; setCashNotes: (v: Record<string, number>) => void; cashTotal: number;
  paymentLines: PaymentLine[]; setPaymentLines: (v: PaymentLine[]) => void;
  subtotal: number; itemDiscTotal: number; gstTotal: number;
  total: number; paid: number;
  checkingOut: boolean;
  onCompleteBill: () => void;
}) {
  const collectedNow = paymentPlan === "PARTIAL" ? partialAmount : paid;
  const pendingNow = Math.max(0, total - collectedNow);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[560px] h-full bg-white shadow-2xl flex flex-col">
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="text-sm font-black">Billing Form</div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer Details */}
          <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
            <div className="text-xs font-black text-slate-600">Customer Details</div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input ref={phoneRef} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number (required)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50/40 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-300" />
            </div>

            {foundCustomer && (
              <div className="rounded-xl bg-teal-50 border border-teal-100 p-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-teal-700">{foundCustomer.customerName || foundCustomer.name}</span>
                  <span className="text-slate-500">
                    {foundCustomer.visits || foundCustomer.invoiceCount || foundCustomer.orderCount || 0} visits ·{" "}
                    {formatINR(foundCustomer.totalHistoricalSalesValue || foundCustomer.totalSpent || foundCustomer.totalSpend || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-slate-500">
                  {foundCustomer.email && <div>Email: {foundCustomer.email}</div>}
                  {(foundCustomer.gstNumber || foundCustomer.gstin) && <div>GST: {foundCustomer.gstNumber || foundCustomer.gstin}</div>}
                  {foundCustomer.city && <div>City: {foundCustomer.city}</div>}
                  {foundCustomer.lastVisit && <div>Last visit: {new Date(foundCustomer.lastVisit).toLocaleDateString("en-IN")}</div>}
                  {!!foundCustomer.totalDue && <div className="text-amber-700 font-bold">Outstanding due: {formatINR(foundCustomer.totalDue)}</div>}
                </div>
                <div className="text-[10px] text-teal-700/60 pt-0.5">Wallet / credit note balance / reward points — coming soon.</div>
              </div>
            )}

            {phone.length >= 10 && !foundCustomer && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5 space-y-2">
                <div className="text-[11px] font-bold text-amber-700">New customer — will be created on checkout. Only mobile is required.</div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={newCustomerDetails.name} onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, name: e.target.value })}
                    placeholder="Name (optional)" className="px-3 py-2 rounded-lg border border-amber-200 text-xs" />
                  <input value={newCustomerDetails.email} onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, email: e.target.value })}
                    placeholder="Email (optional)" className="px-3 py-2 rounded-lg border border-amber-200 text-xs" />
                  <input value={newCustomerDetails.gstNumber} onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="GST number (optional)" className="px-3 py-2 rounded-lg border border-amber-200 text-xs" />
                  <input value={newCustomerDetails.panNumber} onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, panNumber: e.target.value.toUpperCase() })}
                    placeholder="PAN number (optional)" className="px-3 py-2 rounded-lg border border-amber-200 text-xs" />
                  <input value={newCustomerDetails.city} onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, city: e.target.value })}
                    placeholder="City (optional)" className="px-3 py-2 rounded-lg border border-amber-200 text-xs" />
                  <input value={newCustomerDetails.billingAddress} onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, billingAddress: e.target.value })}
                    placeholder="Billing address (optional)" className="px-3 py-2 rounded-lg border border-amber-200 text-xs" />
                  <input value={newCustomerDetails.deliveryAddress} onChange={(e) => setNewCustomerDetails({ ...newCustomerDetails, deliveryAddress: e.target.value })}
                    placeholder="Delivery address (optional)" className="col-span-2 px-3 py-2 rounded-lg border border-amber-200 text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* Discount & Charges */}
          <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
            <div className="text-xs font-black text-slate-600">Discount & Charges</div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-1.5 text-slate-500">
                <Percent className="h-3.5 w-3.5" /> Bill discount
                {billDisc > HIGH_DISCOUNT_HINT_THRESHOLD && (
                  <span title="Sessions with high bill discounts are flagged for manager review automatically" className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">will be reviewed</span>
                )}
              </label>
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={50} value={billDisc}
                  onChange={(e) => setBillDisc(Number(e.target.value) || 0)}
                  className="w-14 px-2 py-1 rounded border border-slate-200 text-right text-xs" />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>
            <Row label="Delivery charge" input={
              <div className="flex items-center gap-1">
                <input type="number" min={0} value={delivery} onChange={(e) => setDelivery(Number(e.target.value) || 0)}
                  className="w-20 px-2 py-1 rounded border border-slate-200 text-right text-xs" />
                {freeDelivery && <span className="text-[10px] text-emerald-600">(Free)</span>}
              </div>
            } />
            <Row label="Installation charge" input={
              <div className="flex items-center gap-1">
                <input type="number" min={0} value={installation} onChange={(e) => setInstallation(Number(e.target.value) || 0)}
                  className="w-20 px-2 py-1 rounded border border-slate-200 text-right text-xs" />
                {freeInstallation && <span className="text-[10px] text-emerald-600">(Free)</span>}
              </div>
            } />
          </div>

          {/* Coupon / Offer Code */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-amber-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-items-center">
                  <TicketPercent className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-950">Coupon / Offer Code</div>
                  <div className="text-xs text-emerald-800/70">Validate unique single-use coupon before checkout</div>
                </div>
              </div>
              {appliedCoupon && (
                <button onClick={removeCoupon} className="text-xs px-2 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1">
                  <X className="h-3 w-3" /> Remove
                </button>
              )}
            </div>

            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon e.g. HTHDFCXI9A18"
                  className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <button onClick={validateCoupon} disabled={couponLoading}
                  className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2">
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                  Apply
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-emerald-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-emerald-700">Coupon Applied: {appliedCoupon.offerCode}</div>
                    <div className="text-xs text-muted-foreground">{appliedCoupon.campaignName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Discount</div>
                    <div className="text-lg font-black text-emerald-700">− {formatINR(appliedCoupon.discountAmount)}</div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>Campaign: {appliedCoupon.campaignCode}</div>
                  <div>Type: {appliedCoupon.discountType}</div>
                  <div>Min bill: {formatINR(appliedCoupon.minimumBillAmount)}</div>
                  <div>Final payable: {formatINR(appliedCoupon.finalPayableAmount)}</div>
                </div>
              </div>
            )}

            {couponError && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 inline-flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {couponError}
              </div>
            )}
          </div>

          {/* Payment Plan: Full (default) vs manually-entered Partial */}
          <div className="rounded-2xl border border-slate-200 p-3 space-y-3">
            <div className="text-xs font-black text-slate-600">Payment Plan</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyFullPayment()}
                className={`rounded-xl py-2.5 text-sm font-black border ${
                  paymentPlan === "FULL" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-700 border-emerald-200"
                }`}
              >
                Full Payment
              </button>
              <button
                onClick={() => applyPartialByPercent(partialPercent || 50)}
                className={`rounded-xl py-2.5 text-sm font-black border ${
                  paymentPlan === "PARTIAL" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-700 border-amber-200"
                }`}
              >
                Partial Payment
              </button>
            </div>

            {paymentPlan === "PARTIAL" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-amber-800 font-bold">Percentage</label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={1} max={99} value={partialPercent}
                      onChange={(e) => applyPartialByPercent(Number(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded border border-amber-200 text-right text-xs" />
                    <span className="text-amber-700">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="text-amber-800 font-bold">Amount</label>
                  <input type="number" min={0} max={total} value={partialAmount}
                    onChange={(e) => applyPartialByAmount(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-1 rounded border border-amber-200 text-right text-xs" />
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200">
                  <span className="text-amber-800">Collected now: <b>{formatINR(partialAmount)}</b></span>
                  <span className="text-amber-800">Pending: <b>{formatINR(Math.max(0, total - partialAmount))}</b></span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl border border-slate-200 p-3 space-y-3">
            <div className="text-xs font-black text-slate-600">Payment Method</div>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(PAYMENT_METHOD_STYLE) as PaymentMethod[]).map((method) => {
                const style = PAYMENT_METHOD_STYLE[method];
                const Icon = style.icon;
                return (
                  <button
                    key={method}
                    onClick={() => {
                      setPaymentMethod(method);
                      if (method === "UPI") generateUpiQr(paymentPlan === "PARTIAL" ? partialAmount : total);
                      if (paymentPlan === "PARTIAL") applyPartialByPercent(partialPercent || 50, method);
                      else applyFullPayment(method);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-4 font-black border transition-colors ${
                      paymentMethod === method ? style.active : style.idle
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{method}</span>
                    <span className="text-[9px] opacity-70">{style.key}</span>
                  </button>
                );
              })}
            </div>

            {paymentMethod === "UPI" && (
              <div className="rounded-xl bg-white border border-teal-200 p-3 text-center">
                <button
                  onClick={() => generateUpiQr(Number(paid || total))}
                  className="mb-2 text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white font-black"
                >
                  Generate UPI QR
                </button>
                {upiQr && (
                  <div className="grid place-items-center gap-2">
                    <img src={upiQr} alt="UPI QR" className="h-40 w-40 rounded-lg border" />
                    <div className="text-xs text-muted-foreground">Scan to pay {formatINR(upiAmount)}</div>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div className="grid grid-cols-2 gap-2">
                <input value={cardInfo.cardNumber} onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: e.target.value })}
                  placeholder="Card number" className="px-3 py-2 rounded-lg border border-green-200 text-xs" />
                <input value={cardInfo.cardHolderName} onChange={(e) => setCardInfo({ ...cardInfo, cardHolderName: e.target.value })}
                  placeholder="Card holder" className="px-3 py-2 rounded-lg border border-green-200 text-xs" />
                <input value={cardInfo.cardType} onChange={(e) => setCardInfo({ ...cardInfo, cardType: e.target.value })}
                  placeholder="VISA / MASTER" className="px-3 py-2 rounded-lg border border-green-200 text-xs" />
                <input value={cardInfo.bankName} onChange={(e) => setCardInfo({ ...cardInfo, bankName: e.target.value })}
                  placeholder="Bank (e.g. HDFC)" className="px-3 py-2 rounded-lg border border-green-200 text-xs" />
                <input value={cardInfo.approvalCode} onChange={(e) => setCardInfo({ ...cardInfo, approvalCode: e.target.value })}
                  placeholder="Approval code" className="px-3 py-2 rounded-lg border border-green-200 text-xs" />
              </div>
            )}

            {paymentMethod === "CASH" && (
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(cashNotes).map((note) => (
                  <div key={note} className="flex items-center gap-2">
                    <span className="w-12 text-xs font-black">₹{note}</span>
                    <input type="number" min={0} value={cashNotes[note]}
                      onChange={(e) => setCashNotes({ ...cashNotes, [note]: Number(e.target.value || 0) })}
                      className="w-full px-2 py-1 rounded border border-emerald-200 text-xs" />
                  </div>
                ))}
                <div className="col-span-2 text-right text-xs font-black text-emerald-700">
                  Cash total: {formatINR(cashTotal)}
                </div>
              </div>
            )}

            {paymentMethod === "SPLIT" && (
              <div className="space-y-2">
                {paymentLines.map((line, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <select
                      value={line.method}
                      onChange={(e) => {
                        const next = [...paymentLines];
                        next[index] = { ...next[index], method: e.target.value as "UPI" | "CARD" | "CASH" };
                        setPaymentLines(next);
                      }}
                      className="px-2 py-2 rounded-lg border border-emerald-200 text-xs"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                    </select>
                    <input
                      type="number"
                      value={line.amount}
                      onChange={(e) => {
                        const next = [...paymentLines];
                        next[index] = { ...next[index], amount: Number(e.target.value || 0) };
                        setPaymentLines(next);
                      }}
                      className="px-2 py-2 rounded-lg border border-emerald-200 text-xs"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setPaymentLines([...paymentLines, { method: "UPI", amount: 0 }])}
                  className="text-xs px-3 py-1 rounded-md bg-white border border-emerald-200 text-emerald-700"
                >
                  Add another payment
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
            <div className="text-xs font-black text-slate-600 mb-1">Summary</div>
            <Row label="Subtotal" value={formatINR(subtotal)} />
            {itemDiscTotal > 0 && <Row label="Item discount" value={`- ${formatINR(itemDiscTotal)}`} muted />}
            <Row label="GST" value={formatINR(gstTotal)} muted />
            <div className="flex items-center justify-between font-black text-slate-900">
              <span>Grand total</span>
              <span>{formatINR(total)}</span>
            </div>
            <Row label="Paid now" value={formatINR(collectedNow)} />
            {pendingNow > 0 && <Row label="Pending" value={formatINR(pendingNow)} muted />}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center gap-3 shrink-0">
          <button onClick={onClose} className="rounded-2xl bg-slate-100 text-slate-600 px-5 py-3 font-black text-sm hover:bg-slate-200">
            Back
          </button>
          <button
            onClick={onCompleteBill}
            disabled={checkingOut}
            className="flex-1 rounded-2xl bg-emerald-600 text-white py-3 font-black text-sm hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {checkingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <Receipt className="h-5 w-5" />}
            {checkingOut ? "Saving…" : "Complete Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default POS;