import { apiFetch } from "./api";

export type ApiPayment = {
  _id: string;
  paymentId?: string;

  orderId?: string;
  invoiceId?: string;

  sapBillingDocument?: string;
  sapSalesDocument?: string;
  orderReference?: string;

  storeCode?: string;
  storeName?: string;
  storeOrPlant?: string;
  locationType?: string;

  customerCode?: string;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;

  billingType?: string;
  transactionType?: string;

  paymentMethod?: string;
  paymentMode?: string;
  paymentStatus?: string;

  amount?: number;
  currency?: string;

  paymentDate?: string;
  paidAt?: string;

  transactionReference?: string;
  remarks?: string;
  lineCount?: number;
};

export type PaymentListResponse = {
  items: ApiPayment[];
  total: number;
  page: number;
  limit: number;
};

export const getPaymentsApi = async (params: Record<string, any> = {}) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  return apiFetch<PaymentListResponse>(
    `/payments${qs.toString() ? `?${qs}` : ""}`
  );
};

export const getPaymentSummaryApi = async (
  params: Record<string, any> = {}
) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  return apiFetch<any>(`/payments/summary${qs.toString() ? `?${qs}` : ""}`);
};

export const refundPaymentApi = async (
  id: string,
  payload: Record<string, any>
) => {
  return apiFetch<ApiPayment>(`/payments/${id}/refund`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};
