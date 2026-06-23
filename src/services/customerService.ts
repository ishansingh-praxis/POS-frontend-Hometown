import { apiFetch } from "./api";

export type ApiCustomer = {
  _id: string;
  customerId?: string;
  sapCustomerCode?: string;

  name?: string;
  customerName?: string;

  mobile?: string;
  phone?: string;
  customerPhone?: string;

  email?: string;

  customerType?: string;
  primaryCity?: string;
  city?: string;

  primaryAddress?: {
    addressId?: string;
    postalCode?: string;
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    city?: string;
  };

  billingAddress?: any;
  deliveryAddress?: any;
  deliveryAddresses?: any[];

  gstNumber?: string;
  gstin?: string;

  preferredCategory?: string;

  invoiceCount?: number;
  orderCount?: number;
  transactionRows?: number;
  uniqueSkuCount?: number;

  totalHistoricalSalesValue?: number;
  totalSpend?: number;
  totalSpent?: number;

  returnOrCancelRows?: number;
  returnOrCancelRatePercent?: number;

  firstTransactionDate?: string;
  lastTransactionDate?: string;
  lastVisit?: string;

  visits?: number;
  orders?: number;
  totalPaid?: number;
  totalDue?: number;

  status?: string;
};

export type CustomerListResponse = {
  items: ApiCustomer[];
  total: number;
  page: number;
  limit: number;
};

export const getCustomersApi = async (params: Record<string, any> = {}) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  return apiFetch<CustomerListResponse>(
    `/customers${qs.toString() ? `?${qs}` : ""}`
  );
};

export const getCustomerSummaryApi = async (
  params: Record<string, any> = {}
) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  return apiFetch<any>(`/customers/summary${qs.toString() ? `?${qs}` : ""}`);
};

export const getCustomerProfileApi = async (id: string) => {
  return apiFetch<any>(`/customers/${id}/profile`);
};

export const createCustomerApi = async (payload: Record<string, any>) => {
  return apiFetch<ApiCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateCustomerApi = async (
  id: string,
  payload: Record<string, any>
) => {
  return apiFetch<ApiCustomer>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};
