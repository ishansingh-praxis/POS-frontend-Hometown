import { apiFetch, buildQuery } from "./api";

export const getManagerCategorySummaryApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/categories${buildQuery(params)}`);

export const getManagerCatalogByCategoryApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/catalog${buildQuery(params)}`);

export const getManagerInventoryByCategoryApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/inventories${buildQuery(params)}`);

export const getManagerInventorySummaryApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/inventories/summary${buildQuery(params)}`);

export const getManagerReplenishmentApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/inventories/replenishment-suggestions${buildQuery(params)}`);
