import { apiFetch, buildQuery } from "./api";

export type SalesChannel = "STORE" | "ONLINE" | "MARKETPLACE";

export type DsrStorewiseQuery = {
  businessMonth?: string;
  storeCode?: string;
  zone?: string;
  city?: string;
  search?: string;
  q?: string;
  channel?: SalesChannel;
  sortBy?: "qty" | "customers" | "bills" | "grossSales";
  limit?: number;
};

export type DsrStorewiseBreakupRow = {
  qty: number;
  grossSales: number;
  [key: string]: any;
};

export type DsrStorewiseSummary = {
  storeCode: string;
  storeName: string;
  city: string;
  zone: string;
  concept: string;
  storeType: string;
  salesChannel: SalesChannel;
  rows: number;
  bills: number;
  articles: number;
  customers: number;
  qty: number;
  grossSales: number;
  netSales: number;
  taxValue: number;
  cogs: number;
  discount: number;
  marginValue: number;
  docTypeBreakup: DsrStorewiseBreakupRow[];
  lobBreakup: DsrStorewiseBreakupRow[];
  topCategories: DsrStorewiseBreakupRow[];
  topArticles: DsrStorewiseBreakupRow[];
  topCustomers: DsrStorewiseBreakupRow[];
  otcVsSalesOrder: {
    otcQty: number;
    otcGrossSales: number;
    salesOrderQty: number;
    salesOrderGrossSales: number;
  };
  businessMonth: string;
};

export type DsrStorewiseTotals = {
  stores: number;
  rows: number;
  bills: number;
  articles: number;
  customers: number;
  qty: number;
  grossSales: number;
  netSales: number;
  taxValue: number;
  cogs: number;
  discount: number;
  marginValue: number;
  averageBillValue: number;
};

export type DsrStorewiseBreakups = {
  storeCode: string;
  storeName: string;
  docTypeBreakup: DsrStorewiseBreakupRow[];
  lobBreakup: DsrStorewiseBreakupRow[];
  topCategories: DsrStorewiseBreakupRow[];
  topArticles: DsrStorewiseBreakupRow[];
  topCustomers: DsrStorewiseBreakupRow[];
  otcVsSalesOrder: DsrStorewiseSummary["otcVsSalesOrder"] | null;
};

export type DsrChannelBreakdown = {
  salesChannel: SalesChannel;
  stores: number;
  grossSales: number;
  bills: number;
  customers: number;
};

export type DsrChannelSummary = {
  totalSales: number;
  storeSales: number;
  onlineSales: number;
  marketplaceSales: number;
  digitalSales: number;
  channels: DsrChannelBreakdown[];
};

export const getDsrStorewiseApi = (params: DsrStorewiseQuery = {}) =>
  apiFetch<DsrStorewiseSummary[]>(`/dsr-storewise${buildQuery(params)}`);

export const getDsrChannelSummaryApi = (params: DsrStorewiseQuery = {}) =>
  apiFetch<DsrChannelSummary>(`/dsr-storewise/channel-summary${buildQuery(params)}`);

export const getDsrStorewiseSummaryApi = (params: DsrStorewiseQuery = {}) =>
  apiFetch<DsrStorewiseTotals>(`/dsr-storewise/summary${buildQuery(params)}`);

export const getDsrTopStoresApi = (params: DsrStorewiseQuery = {}) =>
  apiFetch<DsrStorewiseSummary[]>(`/dsr-storewise/top-stores${buildQuery(params)}`);

export const getDsrStoreByCodeApi = (
  storeCode: string,
  params: DsrStorewiseQuery = {}
) => apiFetch<DsrStorewiseSummary>(`/dsr-storewise/store/${storeCode}${buildQuery(params)}`);

export const getDsrStoreBreakupsApi = (
  storeCode: string,
  params: DsrStorewiseQuery = {}
) =>
  apiFetch<DsrStorewiseBreakups>(
    `/dsr-storewise/store/${storeCode}/breakups${buildQuery(params)}`
  );
