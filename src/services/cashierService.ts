import { apiFetch, apiFetchWithMeta, buildQuery } from "./api";

export type SessionException = {
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  amount?: number;
  status: "OPEN" | "RESOLVED" | "IGNORED";
  createdAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
};

export type PosSession = {
  _id: string;
  sessionId: string;
  storeCode: string;
  storeName?: string;
  cashierId: string;
  cashierName?: string;
  posDeviceId?: string;
  status: "OPEN" | "CLOSED" | "AUTO_VERIFIED" | "EXCEPTION_FLAGGED" | "RESOLVED" | "STORE_DAY_CLOSED";
  openingCash: number;
  closingCash?: number;
  expectedCash: number;
  cashDifference?: number;
  cashSales?: number;
  upiSales?: number;
  cardSales?: number;
  splitSales?: number;
  totalSales?: number;
  orderCount?: number;
  invoiceCount?: number;
  paymentCount?: number;
  openedAt?: string;
  closedAt?: string;
  businessDate?: string;
  autoVerificationStatus?: "PENDING" | "PASSED" | "FAILED";
  managerApprovalRequired?: boolean;
  exceptionCount?: number;
  exceptions?: SessionException[];
  closedByCashierAt?: string;
  autoVerifiedAt?: string;
  resolvedByManagerAt?: string;
  storeDayClosedAt?: string;
};

export type StoreDayStatus = {
  storeCode: string;
  businessDate: string;
  canCloseStoreDay: boolean;
  totalSessions: number;
  validSessions: number;
  openSessions: number;
  exceptionSessions: number;
  autoVerifiedSessions: number;
  criticalExceptions: number;
  blockers: string[];
  status: "READY_TO_CLOSE" | "BLOCKED";
};

export type StartSessionPayload = {
  storeCode: string;
  storeName?: string;
  cashierId: string;
  cashierName?: string;
  openingCash: number;
  posDeviceId?: string;
};

export const startSessionApi = (payload: StartSessionPayload) =>
  apiFetch<PosSession>("/pos-sessions/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getCurrentSessionApi = (params: Record<string, any> = {}) =>
  apiFetch<PosSession>(`/pos-sessions/current${buildQuery(params)}`);

export const closeSessionApi = (
  sessionId: string,
  payload: { closingCash: number; remarks?: string }
) =>
  apiFetch<PosSession>(`/pos-sessions/${sessionId}/close`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const listSessionsApi = (params: Record<string, any> = {}) =>
  apiFetchWithMeta<PosSession[]>(`/pos-sessions${buildQuery(params)}`);

// Manager resolves only flagged exceptions — clean (AUTO_VERIFIED) sessions need no action.
export const resolveSessionExceptionApi = (
  sessionId: string,
  payload: { exceptionType?: string; action?: "resolve" | "ignore"; resolutionNote?: string }
) =>
  apiFetch<PosSession>(`/pos-sessions/${sessionId}/resolve-exception`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const getStoreDayStatusApi = (params: Record<string, any> = {}) =>
  apiFetch<StoreDayStatus>(`/pos-sessions/store-day-status${buildQuery(params)}`);

export const closeStoreDayApi = (payload: { storeCode?: string; businessDate?: string } = {}) =>
  apiFetch<StoreDayStatus & { closedAt: string; closedBy: string }>(`/pos-sessions/store-day-close`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export type CashierCheckoutItem = {
  productId: string;
  sku: string;
  articleNo?: string;
  barcode?: string;
  productName: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  lob?: string;
  quantity: number;
  mrp: number;
  unitPrice: number;
  sellingPrice?: number;
  gstPercent?: number;
  hsnCode?: string;
};

export type CashierCheckoutPayload = {
  storeCode: string;
  storeName?: string;
  cashierId: string;
  cashierName?: string;
  posDeviceId?: string;
  customer: {
    name?: string;
    phone: string;
    email?: string;
    customerType?: string;
    city?: string;
    gstNumber?: string;
    panNumber?: string;
    billingAddress?: string;
    deliveryAddress?: string;
  };
  items: CashierCheckoutItem[];
  billDiscountPercent?: number;
  couponCode?: string;
  couponDiscount?: number;
  voucherCode?: string;
  voucherDiscount?: number;
  deliveryFee?: number;
  installationFee?: number;
  payments: {
    paymentMode: string;
    paymentMethod?: string;
    amount: number;
    upiTransactionId?: string;
    cardLast4?: string;
    cardType?: string;
    bankName?: string;
    cardHolderName?: string;
    cardApprovalCode?: string;
    cashNotes?: Record<string, number>;
    transactionReference?: string;
  }[];
};

export type CashierCheckoutResult = {
  customer: any;
  order: any;
  invoice: any;
  payments: any[];
  inventoryMovements: any[];
  sessionId: string;
  checkoutSummary: {
    storeCode: string;
    cashierId: string;
    cashierName?: string;
    customerPhone: string;
    orderId: string;
    invoiceId: string;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
  };
};

export const cashierCheckoutApi = (payload: CashierCheckoutPayload) =>
  apiFetch<CashierCheckoutResult>("/cashier/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getOrdersApi = (params: Record<string, any> = {}) =>
  apiFetchWithMeta<any[]>(`/orders${buildQuery(params)}`);

export const getOrderByOrderIdApi = (orderId: string) =>
  apiFetch<any>(`/orders/order-id/${orderId}`);

export const getInvoicesApi = (params: Record<string, any> = {}) =>
  apiFetchWithMeta<any[]>(`/invoices${buildQuery(params)}`);

export const getInvoiceByInvoiceIdApi = (invoiceId: string) =>
  apiFetch<any>(`/invoices/invoice-id/${invoiceId}`);

export const markInvoicePrintedApi = (invoiceId: string) =>
  apiFetch<any>(`/invoices/invoice-id/${invoiceId}/print`, {
    method: "PATCH",
  });

export const requestInvoiceCancelApi = (
  invoiceId: string,
  payload: { cancelReason: string; cancelledBy: string }
) =>
  apiFetch<any>(`/invoices/invoice-id/${invoiceId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export type PagedItems<T> = { items: T[]; total: number; page: number; limit: number };

export const getInventoryMovementsApi = (params: Record<string, any> = {}) =>
  apiFetch<PagedItems<any>>(`/inventory-movements${buildQuery(params)}`);

export const getInventoryMovementSummaryApi = (
  params: Record<string, any> = {}
) => apiFetch<any>(`/inventory-movements/summary${buildQuery(params)}`);

export const getAuditLogsApi = (params: Record<string, any> = {}) =>
  apiFetch<PagedItems<any>>(`/audit-logs${buildQuery(params)}`);

export const getAuditLogSummaryApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/audit-logs/summary${buildQuery(params)}`);
