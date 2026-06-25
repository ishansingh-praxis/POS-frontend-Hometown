import { apiFetch, buildQuery } from "./api";

export type DsrQuery = {
  storeCode?: string;
  sku?: string;
  article?: string;
  docType?: string;
  lob?: string;
  newLob?: string;
  category?: string;
  brand?: string;
  customerPhone?: string;
  fromDate?: string;
  toDate?: string;
  q?: string;
  search?: string;
  page?: number;
  limit?: number;
  days?: number;
};

export type DsrSummary = {
  rows: number;
  storeCount: number;
  articleCount: number;
  customerCount: number;
  totalQty: number;
  grossSales: number;
  netSales: number;
  taxValue: number;
  cogs: number;
  discount: number;
  marginValue: number;
};

export type DsrStoreSummary = {
  storeCode: string;
  storeName: string;
  city: string;
  zone: string;
  rows: number;
  qty: number;
  grossSales: number;
  netSales: number;
  marginValue: number;
  articleCount: number;
  customerCount: number;
};

export type DsrArticleSummary = {
  sku: string;
  article: string;
  articleDescription: string;
  category: string;
  lob: string;
  newLob: string;
  brand: string;
  rows: number;
  qty: number;
  grossSales: number;
  netSales: number;
  marginValue: number;
  storeCount: number;
};

export type DsrCategorySummary = {
  lob: string;
  newLob: string;
  category: string;
  rows: number;
  qty: number;
  grossSales: number;
  netSales: number;
  marginValue: number;
  articleCount: number;
};

export type DsrCustomerSummary = {
  customerPhone: string;
  customerName: string;
  rows: number;
  qty: number;
  grossSales: number;
  netSales: number;
  lastVisit: string;
  storeCount: number;
  categoryCount: number;
};

export type DsrReplenishmentSignal = {
  storeCode: string;
  sku: string;
  storeName: string;
  articleDescription: string;
  category: string;
  lob: string;
  qtySold: number;
  grossSales: number;
  currentAtpQty: number;
  dailyAverageSale: number;
  daysOfStockLeft: number;
  replenishmentPriority: "HIGH" | "MEDIUM" | "LOW" | "OK";
};

export const getDsrSummaryApi = (params: DsrQuery = {}) =>
  apiFetch<DsrSummary>(`/dsr/summary${buildQuery(params)}`);

export const getDsrStoreSummaryApi = (params: DsrQuery = {}) =>
  apiFetch<DsrStoreSummary[]>(`/dsr/store-summary${buildQuery(params)}`);

export const getDsrArticleSummaryApi = (params: DsrQuery = {}) =>
  apiFetch<DsrArticleSummary[]>(`/dsr/article-summary${buildQuery(params)}`);

export const getDsrCategorySummaryApi = (params: DsrQuery = {}) =>
  apiFetch<DsrCategorySummary[]>(`/dsr/category-summary${buildQuery(params)}`);

export const getDsrCustomerSummaryApi = (params: DsrQuery = {}) =>
  apiFetch<DsrCustomerSummary[]>(`/dsr/customer-summary${buildQuery(params)}`);

export const getDsrReplenishmentSignalApi = (params: DsrQuery = {}) =>
  apiFetch<DsrReplenishmentSignal[]>(
    `/dsr/replenishment-signal${buildQuery(params)}`
  );

export type DsrOnlineOrder = {
  orderId: string;
  storeCode: string;
  storeName: string;
  channel: "ONLINE" | "MARKETPLACE";
  businessDate: string;
  businessDateStr: string;
  docType: string;
  customerName: string;
  customerPhone: string;
  marketplace: string;
  deliverySite: string;
  firstItem: string;
  itemCount: number;
  qty: number;
  grossSales: number;
};

export const getDsrOnlineOrdersApi = (
  params: DsrQuery & { channel?: "ONLINE" | "MARKETPLACE" } = {}
) => apiFetch<DsrOnlineOrder[]>(`/dsr/online-orders${buildQuery(params)}`);
