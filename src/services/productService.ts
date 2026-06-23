import { apiFetch, buildQuery } from "./api";
import type { PagedItems } from "./cashierService";

export type ApiProductDoc = {
  _id: string;
  productId?: string;
  sku: string;
  articleNo?: string;
  barcode?: string;
  productName: string;
  brand?: string;
  mainCategory?: string;
  category?: string;
  subcategory?: string;
  lob?: string;
  mercCategory?: string;
  mrp?: number;
  sellingPrice?: number;
  gstPercent?: number;
  hsnCode?: string;
  material?: string;
  color?: string;
  size?: string;
  warranty?: string;
  returnWindowDays?: number;
  deliveryRequired?: boolean;
  installationRequired?: boolean;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  images?: { url: string; isPrimary?: boolean }[];
};

export const getProductsApi = (params: Record<string, any> = {}) =>
  apiFetch<PagedItems<ApiProductDoc>>(`/products${buildQuery(params)}`);

export const getProductApi = (id: string) => apiFetch<ApiProductDoc>(`/products/${id}`);

export const createProductApi = (payload: Partial<ApiProductDoc>) =>
  apiFetch<ApiProductDoc>(`/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateProductApi = (id: string, payload: Partial<ApiProductDoc>) =>
  apiFetch<ApiProductDoc>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const setProductStatusApi = (id: string, status: string) =>
  apiFetch<ApiProductDoc>(`/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
