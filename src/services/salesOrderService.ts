import { apiFetch, apiFetchWithMeta, buildQuery } from "./api";

export type ApiSalesOrder = {
  _id: string;
  salesOrderId: string;
  storeCode: string;
  storeName?: string;
  cashierId: string;
  cashierName?: string;
  salespersonName?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: any[];
  itemCount: number;
  subtotal: number;
  itemDiscountTotal: number;
  billDiscountPercent: number;
  billDiscountAmount: number;
  couponCode?: string;
  couponDiscount: number;
  discountAmount: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  deliveryFee: number;
  installationFee: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  orderStatus: "BOOKED" | "SCHEDULED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  deliveryScheduleId?: string;
  deliverySchedule?: {
    deliveryOption?: string;
    deliveryDate?: string;
    deliverySiteCode?: string;
    billingAddress?: any;
    shippingAddress?: any;
    status?: string;
  };
  payments: any[];
  createdAt: string;
};

export type SalesOrderItemPayload = {
  productId?: string;
  sku: string;
  articleNo?: string;
  productName: string;
  brand?: string;
  category?: string;
  lob?: string;
  quantity: number;
  mrp: number;
  unitPrice: number;
  sellingPrice?: number;
  gstPercent?: number;
};

export type CreateSalesOrderPayload = {
  storeCode: string;
  storeName?: string;
  cashierId: string;
  cashierName?: string;
  salespersonName?: string;
  customer: { phone: string; name?: string; email?: string; city?: string; gstNumber?: string; panNumber?: string; billingAddress?: string; deliveryAddress?: string };
  items: SalesOrderItemPayload[];
  billDiscountPercent?: number;
  couponCode?: string;
  couponDiscount?: number;
  voucherDiscount?: number;
  deliveryFee?: number;
  installationFee?: number;
  payments: { paymentMode: string; paymentMethod?: string; amount: number }[];
  deliverySchedule?: {
    deliveryOption?: string;
    deliveryDate?: string;
    deliverySiteCode?: string;
    billingAddress?: string;
    shippingAddress?: string;
  };
};

export type CreateSalesOrderResult = {
  customer: any;
  salesOrder: ApiSalesOrder;
  deliverySchedule: any;
  payments: any[];
};

export const createSalesOrderApi = (payload: CreateSalesOrderPayload) =>
  apiFetch<CreateSalesOrderResult>("/sales-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listSalesOrdersApi = (params: Record<string, any> = {}) =>
  apiFetchWithMeta<ApiSalesOrder[]>(`/sales-orders${buildQuery(params)}`);

export const getSalesOrderApi = (salesOrderId: string) =>
  apiFetch<ApiSalesOrder>(`/sales-orders/${salesOrderId}`);

export const updateSalesOrderStatusApi = (salesOrderId: string, status: string) =>
  apiFetch<ApiSalesOrder>(`/sales-orders/${salesOrderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const addSalesOrderPaymentApi = (salesOrderId: string, payload: { paymentMode: string; amount: number }) =>
  apiFetch<ApiSalesOrder>(`/sales-orders/${salesOrderId}/payment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
