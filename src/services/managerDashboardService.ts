import { apiFetch, buildQuery } from "./api";

export type ManagerDashboardQuery = {
  businessDate?: string;
  fromDate?: string;
  toDate?: string;
  storeCode?: string;
};

export const getManagerDashboardApi = (params: ManagerDashboardQuery = {}) =>
  apiFetch<any>(`/manager-dashboard${buildQuery(params)}`);

export const getManagerSummaryApi = (params: ManagerDashboardQuery = {}) =>
  apiFetch<any>(`/manager-dashboard/summary${buildQuery(params)}`);

export const getManagerSessionsApi = (
  params: ManagerDashboardQuery & { status?: string } = {}
) => apiFetch<any>(`/manager-dashboard/sessions${buildQuery(params)}`);

export const getManagerCashierPerformanceApi = (params: ManagerDashboardQuery = {}) =>
  apiFetch<any>(`/manager-dashboard/cashier-performance${buildQuery(params)}`);

export const resolveSessionExceptionApi = (
  sessionId: string,
  payload: { exceptionType?: string; resolutionNote?: string }
) =>
  apiFetch<any>(`/manager-dashboard/sessions/${sessionId}/resolve`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const closeStoreDayApi = (payload: { businessDate: string; remarks?: string }) =>
  apiFetch<any>("/manager-dashboard/store-day-close", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getInventorySummaryApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/inventories/summary${buildQuery(params)}`);

export const getLowStockApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/inventories/low-stock${buildQuery(params)}`);

export const getOutOfStockApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/inventories/out-of-stock${buildQuery(params)}`);

export const getReplenishmentApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/inventories/replenishment-suggestions${buildQuery(params)}`);

export const getCatalogApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/catalog${buildQuery(params)}`);

export const getCategoriesApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/categories${buildQuery(params)}`);
