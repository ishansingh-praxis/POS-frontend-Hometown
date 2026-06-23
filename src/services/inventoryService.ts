import { apiFetch, buildQuery } from "./api";
import type { PagedItems } from "./cashierService";

export type ApiInventoryRow = {
  _id: string;
  inventoryId?: string;
  storeCode: string;
  storeName?: string;
  siteCode?: string;
  locationType?: string;
  sku: string;
  articleNo?: string;
  productId?: string;
  productName: string;
  brand?: string;
  category?: string;
  mercCategory?: string;
  lob?: string;
  mrp?: number;
  map?: number;
  mapValue?: number;
  stockQty: number;
  atpQty: number;
  availableQty?: number;
  stockStatus?: "IN_STOCK" | "LIMITED_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  isPosEnabled?: boolean;
  status?: string;
};

export const getInventoriesApi = (params: Record<string, any> = {}) =>
  apiFetch<PagedItems<ApiInventoryRow>>(`/inventories${buildQuery(params)}`);

export const adjustInventoryApi = (id: string, payload: Record<string, any>) =>
  apiFetch<ApiInventoryRow>(`/inventories/${id}/adjust`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export type InventorySummary = {
  overall: {
    rows: number;
    uniqueSkuCount: number;
    totalStockQty: number;
    totalAtpQty: number;
    totalMapValue: number;
    totalMrpValue: number;
    outOfStock: number;
    lowStock: number;
    limitedStock: number;
    inStock: number;
  };
  byLocationType: { _id: string; rows: number; totalStockQty: number; totalAtpQty: number; totalMapValue: number }[];
  byLob: { _id: string; rows: number; totalStockQty: number; totalAtpQty: number; totalMapValue: number }[];
  byCategory: { _id: string; rows: number; totalStockQty: number; totalAtpQty: number; totalMapValue: number }[];
};

export const getInventorySummaryApi = (params: Record<string, any> = {}) =>
  apiFetch<InventorySummary>(`/inventories/summary${buildQuery(params)}`);
