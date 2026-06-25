import { apiFetch, buildQuery } from "./api";
import type { PagedItems } from "./cashierService";

export type ApiCategory = {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  level: "LOB" | "CATEGORY" | "SUBCATEGORY";
  parentName?: string;
  lob?: string;
  mercCategory?: string;
  productCount: number;
  totalAtpQty: number;
  totalMapValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  brands: string[];
};

export const getCategoriesApi = (params: Record<string, any> = {}) =>
  apiFetch<PagedItems<ApiCategory>>(`/categories${buildQuery(params)}`);

export type GenerateCategoriesResult = {
  lobCategories: number;
  productCategories: number;
  total: number;
};

export const generateCategoriesFromInventoryApi = () =>
  apiFetch<GenerateCategoriesResult>(`/categories/generate-from-inventory`, {
    method: "POST",
  });
