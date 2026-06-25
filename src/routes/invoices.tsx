import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatINR } from "@/lib/pos-data";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/hometown_logo.png";
import {
  Search,
  Printer,
  Download,
  Mail,
  MessageCircle,
  RefreshCcw,
  Ban,
  FileText,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Loader2,
  Store,
  CalendarDays,
  Phone,
  IndianRupee,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api/pos";

type InvoiceStatus = "ISSUED" | "CANCELLED" | "REFUNDED" | "DRAFT";

type InvoiceApiItem = {
  invoiceItemId?: string;
  sku?: string;
  productName?: string;
  name?: string;
  hsnCode?: string;
  hsn?: string;
  quantity?: number;
  qty?: number;
  mrp?: number;
  unitPrice?: number;
  lineDiscount?: number;
  discount?: number;
  taxableAmount?: number;
  taxable?: number;
  gstPercent?: number;
  gstPct?: number;
  gstAmount?: number;
  gst?: number;
  lineTotal?: number;
  total?: number;
};

type InvoiceApi = {
  _id: string;
  invoiceId: string;
  invoiceNumber?: string;
  invoiceType?: string;
  invoiceStatus?: InvoiceStatus;
  invoiceDate?: string;
  issuedAt?: string;
  financialYear?: string;

  orderId?: string;
  orderNumber?: string;
  channel?: string;
  orderType?: string;

  storeCode?: string;
  storeName?: string;
  city?: string;
  state?: string;
  region?: string;
  zone?: string;
  storeAddress?: string;

  store?: {
    storeCode?: string;
    storeName?: string;
    city?: string;
    state?: string;
    region?: string;
    zone?: string;
    address?: string;
    gstNumber?: string;
    sapStoreCode?: string;
    managerId?: string;
  };

  seller?: {
    companyName?: string;
    brandName?: string;
    storeCode?: string;
    storeName?: string;
    storeAddress?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    currency?: string;
  };

  customer?: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    billingAddress?: any;
    shippingAddress?: any;
  };

  items?: InvoiceApiItem[];

  billing?: {
    itemCount?: number;
    totalQuantity?: number;
    subtotal?: number;
    itemDiscountTotal?: number;
    couponCode?: string;
    couponDiscount?: number;
    discountTotal?: number;
    taxableAmount?: number;
    gstPercent?: number;
    cgstPercent?: number;
    sgstPercent?: number;
    igstPercent?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    taxTotal?: number;
    deliveryFee?: number;
    roundingAdjustment?: number;
    grandTotal?: number;
    paidAmount?: number;
    dueAmount?: number;
    currency?: string;
  };

  payment?: {
    paymentStatus?: string;
    paymentMode?: string;
    payments?: {
      paymentId?: string;
      paymentMode?: string;
      paymentStatus?: string;
      amount?: number;
      transactionReference?: string;
      paidAt?: string;
    }[];
  };

  fulfillment?: {
    fulfillmentStatus?: string;
    deliveryRequired?: boolean;
    shippingAddress?: any;
  };

  sap?: {
    sapSyncStatus?: string;
    sapInvoiceNumber?: string | null;
    sapAccountingDocument?: string | null;
    sapPostingDate?: string | null;
  };

  accounting?: {
    accountingStatus?: string;
    ledgerPosted?: boolean;
    revenueAccount?: string;
    taxAccount?: string;
  };

  print?: {
    printStatus?: string;
    printTemplate?: string;
    printCount?: number;
    lastPrintedAt?: string;
  };

  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
};

type InvoiceSummary = {
  totalInvoices: number;
  issuedInvoices: number;
  cancelledInvoices: number;
  refundedInvoices: number;
  totalInvoiceValue: number;
  totalPaid: number;
  totalDue: number;
  totalTax: number;
  avgInvoiceValue: number;
};

type ApiMeta = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};

type InvoiceTypeFilter = "All" | "TAX_INVOICE" | "SALES_INVOICE" | "CREDIT_NOTE";

const invoiceTypes: InvoiceTypeFilter[] = [
  "All",
  "TAX_INVOICE",
  "SALES_INVOICE",
  "CREDIT_NOTE",
];

const getStatusStyle = (status?: string) => {
  if (status === "ISSUED") return "bg-teal-100 text-teal-700";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  if (status === "REFUNDED") return "bg-blue-100 text-blue-700";
  return "bg-muted text-muted-foreground";
};

const normalizeList = (response: any): InvoiceApi[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const buildQuery = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      search.set(key, String(value));
    }
  });

  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

function Invoices() {
  const { user } = useAuth();
  const [list, setList] = useState<InvoiceApi[]>([]);
  const [active, setActive] = useState<InvoiceApi | null>(null);
  const [invoiceQr, setInvoiceQr] = useState<{
    invoiceId: string;
    invoiceNumber?: string;
    invoiceUrl: string;
    qrDataUrl: string;
  } | null>(null);

  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [meta, setMeta] = useState<ApiMeta>({});

  const [q, setQ] = useState("");
  const [type, setType] = useState<InvoiceTypeFilter>("All");
  const [storeCode, setStoreCode] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [cancelReason, setCancelReason] = useState(
    "Customer requested cancellation"
  );

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const getToken = () => {
    try {
      const rawUser = typeof window !== "undefined" ? window.localStorage.getItem("ht-pos-user") : null;
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.token) return parsed.token;
      }
    } catch {
      // ignore
    }

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("posToken") ||
      ""
    );
  };

  const authHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchInvoices = async () => {
    setLoading(true);

    try {
      const query = buildQuery({
        limit: 300,
        q,
        storeCode,
        customerPhone,
        fromDate,
        toDate,
        invoiceStatus: undefined,
        financialYear: undefined,
        channel: undefined,
      });

      const res = await fetch(`${API_BASE}/invoices${query}`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch invoices");
      }

      let invoices = normalizeList(data);

      if (type !== "All") {
        invoices = invoices.filter((inv) => inv.invoiceType === type);
      }

      setList(invoices);
      setMeta(data.meta || {});
      setActive((current) => current || invoices[0] || null);
    } catch (error: any) {
      flash(error.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);

    try {
      const endpoint = storeCode
        ? `${API_BASE}/invoices/store/${storeCode}/summary`
        : `${API_BASE}/invoices/summary`;

      const res = await fetch(endpoint, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch summary");
      }

      setSummary(data.data);
    } catch (error: any) {
      flash(error.message || "Failed to fetch invoice summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchInvoiceByInvoiceId = async () => {
    if (!invoiceId.trim()) {
      flash("Enter invoice ID first");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/invoices/invoice-id/${invoiceId.trim()}`,
        { headers: authHeaders() }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Invoice not found");
      }

      setList([data.data]);
      setActive(data.data);
      setMeta({ total: 1, page: 1, limit: 1, pages: 1 });
    } catch (error: any) {
      flash(error.message || "Invoice not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceByOrderId = async () => {
    if (!orderId.trim()) {
      flash("Enter order ID first");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/invoices/order-id/${orderId.trim()}`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Invoice not found for order");
      }

      setList([data.data]);
      setActive(data.data);
      setMeta({ total: 1, page: 1, limit: 1, pages: 1 });
    } catch (error: any) {
      flash(error.message || "Invoice not found for order");
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreInvoices = async () => {
    if (!storeCode.trim()) {
      flash("Enter store code first");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/invoices/store/${storeCode.trim()}?limit=300`,
        { headers: authHeaders() }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch store invoices");
      }

      const invoices = normalizeList(data);
      setList(invoices);
      setMeta(data.meta || {});
      setActive(invoices[0] || null);
    } catch (error: any) {
      flash(error.message || "Failed to fetch store invoices");
    } finally {
      setLoading(false);
    }
  };

  const markPrinted = async (inv: InvoiceApi) => {
    try {
      const res = await fetch(
        `${API_BASE}/invoices/invoice-id/${inv.invoiceId}/print`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to mark printed");
      }

      setActive(data.data);
      setList((prev) =>
        prev.map((item) => (item.invoiceId === inv.invoiceId ? data.data : item))
      );

      flash(`Invoice ${inv.invoiceId} marked as printed`);
    } catch (error: any) {
      flash(error.message || "Failed to mark printed");
    }
  };

  const cancelInvoice = async (inv: InvoiceApi) => {
    if (inv.invoiceStatus === "CANCELLED") {
      flash("Invoice already cancelled");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/invoices/invoice-id/${inv.invoiceId}/cancel`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            cancelReason,
            cancelledBy: "ADMIN",
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to cancel invoice");
      }

      setActive(data.data);
      setList((prev) =>
        prev.map((item) => (item.invoiceId === inv.invoiceId ? data.data : item))
      );

      flash(`Invoice ${inv.invoiceId} cancelled`);
      fetchSummary();
    } catch (error: any) {
      flash(error.message || "Failed to cancel invoice");
    }
  };

  const generateRealQr = async (inv: InvoiceApi) => {
    try {
      const res = await fetch(`${API_BASE}/invoices/invoice-id/${inv.invoiceId}/qr`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to generate QR");
      }

      setInvoiceQr(data.data);
      flash("Real invoice QR generated");
      return data.data as typeof invoiceQr;
    } catch (error: any) {
      flash(error.message || "Failed to generate QR");
      return null;
    }
  };

  const sendInvoiceEmail = async (inv: InvoiceApi) => {
    const email =
      inv.customer?.customerEmail ||
      window.prompt("Enter customer email");

    if (!email) {
      flash("Customer email missing");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/invoices/invoice-id/${inv.invoiceId}/email`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to send invoice email");
      }

      flash(`Invoice emailed to ${data.data.sentTo}`);
    } catch (error: any) {
      flash(error.message || "Email failed");
    }
  };

  const sendWhatsAppInvoice = (inv: InvoiceApi) => {
    const phone = inv.customer?.customerPhone;

    if (!phone) {
      flash("Customer phone missing");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const invoiceUrl = `${window.location.origin}/invoice-view/${inv.invoiceId}`;

    const message = encodeURIComponent(
      `Hello ${inv.customer?.customerName || "Customer"}, your HomeTown invoice ${
        inv.invoiceNumber || inv.invoiceId
      } is ready. View invoice: ${invoiceUrl}`
    );

    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${message}`, "_blank");
  };

  const downloadInvoiceHtml = (inv: InvoiceApi) => {
    const html = buildPrintableInvoiceHtml(inv, invoiceQr?.invoiceId === inv.invoiceId ? invoiceQr.qrDataUrl : null);

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.invoiceNumber || inv.invoiceId}.html`;
    a.click();

    URL.revokeObjectURL(url);
    flash("Invoice file downloaded");
  };

  const createCreditNote = async (inv: InvoiceApi) => {
    const reason =
      window.prompt("Reason for credit note", "Customer return / billing correction") ||
      "Credit note created";

    try {
      const res = await fetch(
        `${API_BASE}/invoices/invoice-id/${inv.invoiceId}/credit-note`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ reason }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create credit note");
      }

      flash(`Credit note created: ${data.data.invoiceNumber || data.data.invoiceId}`);
      fetchInvoices();
      fetchSummary();
    } catch (error: any) {
      flash(error.message || "Credit note failed");
    }
  };

  const buildPrintableInvoiceHtml = (inv: InvoiceApi, qrDataUrl?: string | null) => {
    const billing = inv.billing || {};
    const customer = inv.customer || {};
    const seller = inv.seller || {};
    const store = inv.store || {};

    const rows = (inv.items || [])
      .map(
        (line) => `
          <tr>
            <td>${line.sku || ""}<br/><b>${line.productName || line.name || ""}</b></td>
            <td>${line.hsnCode || line.hsn || ""}</td>
            <td>${line.quantity || line.qty || 0}</td>
            <td>₹${line.mrp || 0}</td>
            <td>₹${line.lineDiscount || line.discount || 0}</td>
            <td>₹${line.taxableAmount || line.taxable || 0}</td>
            <td>${line.gstPercent || line.gstPct || 18}%<br/>₹${line.gstAmount || line.gst || 0}</td>
            <td>₹${line.lineTotal || line.total || 0}</td>
          </tr>
        `
      )
      .join("");

    return `
      <html>
        <head>
          <title>${inv.invoiceNumber || inv.invoiceId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 14px; }
            .brandWrap { display: flex; gap: 12px; align-items: center; }
            .logo { width: 56px; height: 56px; border-radius: 50%; object-fit: contain; border: 1px solid #f5d6a4; }
            .brand { font-size: 28px; font-weight: 800; color: #b45309; }
            .muted { color: #6b7280; font-size: 12px; line-height: 1.5; }
            .tag { display: inline-block; background: #fff7ed; color: #9a3412; padding: 4px 8px; border-radius: 999px; font-size: 11px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th { background: #fff7ed; color: #9a3412; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 18px; }
            .box { border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px; font-size: 12px; }
            .total { margin-top: 20px; width: 300px; margin-left: auto; font-size: 13px; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; }
            .grand { border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 20px; font-weight: 800; color: #ea580c; }
            .qr { margin-top: 18px; text-align: center; }
            .qr img { width: 110px; height: 110px; }
            .footer { margin-top: 30px; font-size: 11px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brandWrap">
              <img class="logo" src="${window.location.origin}${logo}" />
              <div>
                <div class="brand">HomeTown</div>
                <div class="muted">${seller.companyName || "Praxis Home Retail Limited - HomeTown"}</div>
                <div class="muted">${seller.storeName || store.storeName || inv.storeName || ""}</div>
                <div class="muted">${seller.storeAddress || store.address || inv.storeAddress || ""}</div>
                <div class="muted">GSTIN: ${seller.gstNumber || store.gstNumber || "—"}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div class="tag">${inv.invoiceType || "TAX_INVOICE"}</div>
              <h2>${inv.invoiceNumber || inv.invoiceId}</h2>
              <div class="muted">Order: ${inv.orderId || "—"}</div>
              <div class="muted">Date: ${new Date(inv.invoiceDate || inv.issuedAt || "").toLocaleString("en-IN")}</div>
              <div class="muted">Status: ${inv.invoiceStatus}</div>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <b>Bill To</b><br/>
              ${customer.customerName || "Walk-in Customer"}<br/>
              ${customer.customerPhone || ""}<br/>
              ${customer.customerEmail || ""}
            </div>
            <div class="box">
              <b>Store</b><br/>
              ${inv.storeCode || ""} · ${inv.storeName || ""}<br/>
              ${inv.city || ""}, ${inv.state || ""}<br/>
              ${inv.region || ""} / ${inv.zone || ""}
            </div>
            <div class="box">
              <b>Payment</b><br/>
              Status: ${inv.payment?.paymentStatus || "—"}<br/>
              Mode: ${inv.payment?.paymentMode || "—"}<br/>
              Paid: ₹${billing.paidAmount || 0}<br/>
              Due: ₹${billing.dueAmount || 0}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>SKU · Item</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>MRP</th>
                <th>Discount</th>
                <th>Taxable</th>
                <th>GST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="total">
            <div class="row"><span>Subtotal</span><b>₹${billing.subtotal || 0}</b></div>
            <div class="row"><span>Discount</span><b>₹${billing.discountTotal || 0}</b></div>
            <div class="row"><span>Taxable</span><b>₹${billing.taxableAmount || 0}</b></div>
            <div class="row"><span>CGST 9%</span><b>₹${billing.cgstAmount || 0}</b></div>
            <div class="row"><span>SGST 9%</span><b>₹${billing.sgstAmount || 0}</b></div>
            <div class="row"><span>Total GST</span><b>₹${billing.taxTotal || 0}</b></div>
            <div class="row"><span>Round Off</span><b>₹${billing.roundingAdjustment || 0}</b></div>
            <div class="row grand"><span>Total</span><span>₹${billing.grandTotal || 0}</span></div>
          </div>

          ${
            qrDataUrl
              ? `<div class="qr"><div class="muted">Scan to verify invoice</div><img src="${qrDataUrl}" /></div>`
              : ""
          }

          <div class="footer">
            Computer-generated invoice. Thank you for shopping with HomeTown.
          </div>

          <script>
            window.print();
          </script>
        </body>
      </html>
    `;
  };

  const printInvoice = async (inv: InvoiceApi) => {
    await markPrinted(inv);

    let qr = invoiceQr?.invoiceId === inv.invoiceId ? invoiceQr : null;

    if (!qr) {
      qr = await generateRealQr(inv);
    }

    const printWindow = window.open("", "_blank", "width=900,height=750");

    if (!printWindow) {
      flash("Popup blocked. Allow popups to print invoice.");
      return;
    }

    printWindow.document.write(buildPrintableInvoiceHtml(inv, qr?.qrDataUrl));
    printWindow.document.close();
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return list;

    const needle = q.toLowerCase();

    return list.filter((inv) =>
      `${inv.invoiceId} ${inv.invoiceNumber} ${inv.orderId} ${inv.storeCode} ${inv.storeName} ${inv.customer?.customerName} ${inv.customer?.customerPhone}`
        .toLowerCase()
        .includes(needle)
    );
  }, [list, q]);

  useEffect(() => {
    if (!getToken()) return;
    fetchInvoices();
    fetchSummary();
  }, [user?.token]);

  return (
    <AppShell
      allow={["cashier", "manager", "admin"]}
      title="Invoices & Receipts"
      subtitle="Tax invoices, store invoices, customer invoice search, print and cancellation from MongoDB"
    >
      <div className="space-y-5">
        <section className="grid md:grid-cols-5 gap-3">
          <SummaryCard
            icon={<ReceiptText className="h-4 w-4" />}
            label="Invoices"
            value={summaryLoading ? "..." : String(summary?.totalInvoices || 0)}
          />
          <SummaryCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Issued"
            value={String(summary?.issuedInvoices || 0)}
            tone="success"
          />
          <SummaryCard
            icon={<Ban className="h-4 w-4" />}
            label="Cancelled"
            value={String(summary?.cancelledInvoices || 0)}
            tone="risk"
          />
          <SummaryCard
            icon={<IndianRupee className="h-4 w-4" />}
            label="Value"
            value={formatINR(summary?.totalInvoiceValue || 0)}
            tone="gold"
          />
          <SummaryCard
            icon={<IndianRupee className="h-4 w-4" />}
            label="Due"
            value={formatINR(summary?.totalDue || 0)}
            tone="warning"
          />
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] p-4 space-y-3">
          <div className="grid md:grid-cols-6 gap-2">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search invoice, customer, phone, store…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>

            <input
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              placeholder="Store code e.g. 6036"
              className="px-3 py-2 rounded-lg bg-background border border-input text-sm"
            />

            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Customer mobile"
              className="px-3 py-2 rounded-lg bg-background border border-input text-sm"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value as InvoiceTypeFilter)}
              className="px-3 py-2 rounded-lg bg-background border border-input text-sm"
            >
              {invoiceTypes.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All invoice types" : item}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                fetchInvoices();
                fetchSummary();
              }}
              className="rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
            >
              Apply
            </button>
          </div>

          <div className="grid md:grid-cols-5 gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-input text-sm"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-input text-sm"
            />

            <input
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Invoice ID"
              className="px-3 py-2 rounded-lg bg-background border border-input text-sm"
            />

            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID"
              className="px-3 py-2 rounded-lg bg-background border border-input text-sm"
            />

            <div className="flex gap-2">
              <button
                onClick={fetchInvoiceByInvoiceId}
                className="flex-1 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5"
              >
                By Invoice
              </button>
              <button
                onClick={fetchInvoiceByOrderId}
                className="flex-1 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5"
              >
                By Order
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchStoreInvoices}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3F5FF] text-[#4B49AC] px-3 py-2 text-xs font-semibold"
            >
              <Store className="h-3.5 w-3.5" />
              Store invoices
            </button>

            <button
              onClick={() => {
                setQ("Kolkata");
                setTimeout(fetchInvoices, 0);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3F5FF] text-[#4B49AC] px-3 py-2 text-xs font-semibold"
            >
              <Search className="h-3.5 w-3.5" />
              Search Kolkata
            </button>

            <button
              onClick={() => {
                setCustomerPhone("9999999999");
                setTimeout(fetchInvoices, 0);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3F5FF] text-[#4B49AC] px-3 py-2 text-xs font-semibold"
            >
              <Phone className="h-3.5 w-3.5" />
              Customer mobile search
            </button>

            <button
              onClick={() => {
                setFromDate("2026-06-01");
                setToDate("2026-06-30");
                setTimeout(fetchInvoices, 0);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3F5FF] text-[#4B49AC] px-3 py-2 text-xs font-semibold"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              June date filter
            </button>

            <button
              onClick={() => {
                setQ("");
                setType("All");
                setStoreCode("");
                setCustomerPhone("");
                setInvoiceId("");
                setOrderId("");
                setFromDate("");
                setToDate("");
                setTimeout(() => {
                  fetchInvoices();
                  fetchSummary();
                }, 0);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </section>

        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Invoice List</div>
                <div className="text-xs text-muted-foreground">
                  {meta.total ?? filtered.length} records
                </div>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            <ul className="max-h-[70vh] overflow-y-auto divide-y divide-border">
              {filtered.length === 0 && (
                <li className="px-5 py-10 text-center text-xs text-muted-foreground">
                  No invoices match.
                </li>
              )}

              {filtered.map((inv) => (
                <li key={inv._id || inv.invoiceId}>
                  <button
                    onClick={() => setActive(inv)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#F3F5FF] ${
                      active?.invoiceId === inv.invoiceId ? "bg-[#F3F5FF]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">
                        {inv.invoiceNumber || inv.invoiceId}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusStyle(
                          inv.invoiceStatus
                        )}`}
                      >
                        {inv.invoiceStatus || "—"}
                      </span>
                    </div>

                    <div className="text-xs mt-0.5">
                      {inv.customer?.customerName || "Walk-in Customer"}
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>
                        {inv.storeCode} · {inv.city || inv.storeName}
                      </span>
                      <span>{formatINR(inv.billing?.grandTotal || 0)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            {active ? (
              <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center gap-1.5 flex-wrap">
                  <Action
                    icon={<Printer className="h-3.5 w-3.5" />}
                    label="Print"
                    onClick={() => printInvoice(active)}
                  />
                  <Action
                    icon={<Download className="h-3.5 w-3.5" />}
                    label="PDF"
                    onClick={() => downloadInvoiceHtml(active)}
                  />
                  <Action
                    icon={<MessageCircle className="h-3.5 w-3.5" />}
                    label="WhatsApp"
                    onClick={() => sendWhatsAppInvoice(active)}
                  />
                  <Action
                    icon={<Mail className="h-3.5 w-3.5" />}
                    label="Email"
                    onClick={() => sendInvoiceEmail(active)}
                  />
                  <Action
                    icon={<QrCode className="h-3.5 w-3.5" />}
                    label="QR"
                    onClick={() => generateRealQr(active)}
                  />

                  <div className="ml-auto flex items-center gap-2">
                    <input
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="hidden md:block w-64 px-2 py-1.5 rounded-md bg-background border border-input text-[11px]"
                      placeholder="Cancel reason"
                    />
                    <Action
                      icon={<Ban className="h-3.5 w-3.5" />}
                      label="Cancel"
                      tone="destructive"
                      onClick={() => cancelInvoice(active)}
                    />
                  </div>
                </div>

                <InvoicePreview
                  inv={active}
                  invoiceQr={invoiceQr}
                  generateRealQr={generateRealQr}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground">
                Select an invoice from the list.
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-foreground text-background text-xs shadow-[var(--shadow-pop)]">
          {toast}
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "success" | "risk" | "gold" | "warning";
}) {
  const hex =
    tone === "success" ? "#17A2B8" :
    tone === "risk" ? "#FE9496" :
    tone === "gold" ? "#E0B50F" :
    tone === "warning" ? "#F29F67" :
    "#4B49AC";

  return (
    <div className="rounded-2xl border border-[#E6EAFE] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 font-semibold">{label}</div>
        <div className="h-8 w-8 rounded-full grid place-items-center text-white" style={{ background: hex }}>
          {icon}
        </div>
      </div>
      <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "destructive";
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1.5 rounded-md border inline-flex items-center gap-1.5 transition-colors ${
        tone === "destructive"
          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
          : "border-border hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InvoicePreview({
  inv,
  invoiceQr,
  generateRealQr,
}: {
  inv: InvoiceApi;
  invoiceQr: { invoiceId: string; invoiceUrl: string; qrDataUrl: string } | null;
  generateRealQr: (inv: InvoiceApi) => void;
}) {
  const billing = inv.billing || {};
  const customer = inv.customer || {};
  const seller = inv.seller || {};
  const store = inv.store || {};
  const items = inv.items || [];

  return (
    <div className="p-8 bg-background">
      <header className="flex items-start justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="HomeTown"
            className="h-12 w-12 rounded-full ring-1 ring-gold/50"
          />
          <div>
            <div className="font-display text-xl leading-tight">HomeTown</div>
            <div className="text-xs text-muted-foreground">
              {seller.companyName || "Praxis Home Retail Limited"}
            </div>
            <div className="text-xs text-muted-foreground">
              {seller.storeName || store.storeName || inv.storeName}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {seller.storeAddress || store.address || inv.storeAddress}
            </div>
            <div className="text-[11px] font-mono mt-0.5">
              GSTIN: {seller.gstNumber || store.gstNumber || "—"}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {inv.invoiceType || "TAX_INVOICE"}
          </div>
          <div className="font-display text-lg">
            {inv.invoiceNumber || inv.invoiceId}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {inv.invoiceDate
              ? new Date(inv.invoiceDate).toLocaleString("en-IN")
              : "—"}
          </div>
          <span
            className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full ${getStatusStyle(
              inv.invoiceStatus
            )}`}
          >
            {inv.invoiceStatus}
          </span>
        </div>
      </header>

      <section className="grid sm:grid-cols-3 gap-4 py-4 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Bill to
          </div>
          <div className="font-medium">
            {customer.customerName || "Walk-in Customer"}
          </div>
          <div className="text-muted-foreground">{customer.customerPhone}</div>
          <div className="text-muted-foreground">{customer.customerEmail}</div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Payment
          </div>
          <div>{inv.payment?.paymentMode || "—"}</div>
          <div className="text-muted-foreground">
            {inv.payment?.paymentStatus || "—"}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Store
          </div>
          <div>{inv.storeName || store.storeName}</div>
          <div className="text-muted-foreground">
            Store {inv.storeCode || store.storeCode}
          </div>
          <div className="text-muted-foreground">
            {inv.city || store.city}, {inv.state || store.state}
          </div>
        </div>
      </section>

      <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="text-left font-medium px-3 py-2">SKU · Item</th>
            <th className="text-left font-medium px-2 py-2">HSN</th>
            <th className="text-right font-medium px-2 py-2">Qty</th>
            <th className="text-right font-medium px-2 py-2">MRP</th>
            <th className="text-right font-medium px-2 py-2">Disc</th>
            <th className="text-right font-medium px-2 py-2">Taxable</th>
            <th className="text-right font-medium px-2 py-2">GST</th>
            <th className="text-right font-medium px-3 py-2">Total</th>
          </tr>
        </thead>

        <tbody>
          {items.map((line, i) => (
            <tr key={line.invoiceItemId || i} className="border-t border-border/60">
              <td className="px-3 py-2">
                <div className="font-mono text-[10px] text-muted-foreground">
                  {line.sku}
                </div>
                {line.productName || line.name}
              </td>
              <td className="px-2 py-2 font-mono">
                {line.hsnCode || line.hsn || "—"}
              </td>
              <td className="px-2 py-2 text-right">
                {line.quantity || line.qty || 0}
              </td>
              <td className="px-2 py-2 text-right text-muted-foreground line-through">
                {formatINR(line.mrp || 0)}
              </td>
              <td className="px-2 py-2 text-right">
                {formatINR(line.lineDiscount || line.discount || 0)}
              </td>
              <td className="px-2 py-2 text-right">
                {formatINR(line.taxableAmount || line.taxable || 0)}
              </td>
              <td className="px-2 py-2 text-right">
                {line.gstPercent || line.gstPct || 18}%
                <div className="text-[10px] text-muted-foreground">
                  {formatINR(line.gstAmount || line.gst || 0)}
                </div>
              </td>
              <td className="px-3 py-2 text-right font-medium">
                {formatINR(line.lineTotal || line.total || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="grid sm:grid-cols-3 gap-4 mt-5">
        <div className="sm:col-span-2 space-y-2">
          <div className="rounded-lg border border-border p-3 text-[11px] text-muted-foreground">
            <div className="font-medium text-foreground mb-1 inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Return & Warranty
            </div>
            Return and warranty depend on product category and HomeTown policy.
            Keep invoice and original packing for claims.
          </div>

          {inv.remarks && (
            <div className="rounded-lg border border-border p-3 text-[11px]">
              <span className="text-muted-foreground">Notes — </span>
              {inv.remarks}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-3 text-xs">
          <Row label="Subtotal" value={formatINR(billing.subtotal || 0)} />
          <Row label="Discount" value={`− ${formatINR(billing.discountTotal || 0)}`} />
          <Row label="Taxable" value={formatINR(billing.taxableAmount || 0)} />
          <Row label="CGST 9%" value={formatINR(billing.cgstAmount || 0)} />
          <Row label="SGST 9%" value={formatINR(billing.sgstAmount || 0)} />
          <Row label="GST Total" value={formatINR(billing.taxTotal || 0)} />
          <Row label="Round-off" value={formatINR(billing.roundingAdjustment || 0)} />
          <Row label="Paid" value={formatINR(billing.paidAmount || 0)} />
          <Row label="Due" value={formatINR(billing.dueAmount || 0)} />

          <div className="border-t border-border mt-2 pt-2 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatINR(billing.grandTotal || 0)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground">
              Scan for invoice & support
            </div>
            {invoiceQr?.invoiceId === inv.invoiceId ? (
              <img
                src={invoiceQr.qrDataUrl}
                alt="Invoice QR"
                className="h-14 w-14 rounded border border-border bg-white p-1"
              />
            ) : (
              <button
                onClick={() => generateRealQr(inv)}
                className="h-14 w-14 grid place-items-center rounded border border-border bg-card text-muted-foreground hover:bg-muted"
              >
                <QrCode className="h-9 w-9" />
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-6 text-center text-[10px] text-muted-foreground border-t border-border pt-3 inline-flex items-center gap-1 w-full justify-center">
        <ReceiptText className="h-3 w-3" />
        Computer-generated invoice. Subject to applicable store jurisdiction.
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default Invoices;