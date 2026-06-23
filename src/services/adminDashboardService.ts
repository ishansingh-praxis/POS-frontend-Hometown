import { apiFetch, buildQuery } from "./api";

export type AdminDashboardQuery = {
  businessDate?: string;
  storeCode?: string;
};

export const getAdminDashboardApi = (params: AdminDashboardQuery = {}) =>
  apiFetch<any>(`/admin-dashboard${buildQuery(params)}`);

export const getAdminOverviewApi = (params: AdminDashboardQuery = {}) =>
  apiFetch<any>(`/admin-dashboard/overview${buildQuery(params)}`);

export const getAdminStorePerformanceApi = (params: AdminDashboardQuery = {}) =>
  apiFetch<any[]>(`/admin-dashboard/store-performance${buildQuery(params)}`);
