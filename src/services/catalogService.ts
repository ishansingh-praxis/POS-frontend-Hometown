import { apiFetch, buildQuery } from "./api";
import type { PagedItems } from "./cashierService";

export type ApiCatalogItem = {
  catalogId: string;
  inventoryId?: string;

  productId?: string;
  sku: string;
  articleNo?: string;

  productName: string;
  articleDescription?: string;

  brand?: string;
  category?: string;
  mercCategory?: string;
  lob?: string;

  siteCode?: string;
  siteName?: string;
  storeCode?: string;
  storeName?: string;
  locationType?: string;

  mrp: number;
  map?: number;
  sellingPrice: number;
  discountAmount?: number;
  discountPercent?: number;

  stockQty?: number;
  atpQty: number;
  availableQty?: number;
  stockStatus?: "IN_STOCK" | "LIMITED_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

  isSellable: boolean;

  description?: string;

  image?: string;
  primaryImage?: string;
  thumbnailImage?: string;
  images?: string[];

  imageStatus?: "WEBSITE_IMAGE_MATCHED" | "CATEGORY_BEST_MATCH" | "PENDING_WEBSITE_IMAGE" | "NO_IMAGE";
  imageMatchType?: string;
  imageMatchConfidence?: "HIGH" | "MEDIUM" | "LOW" | "MEDIUM_CATEGORY_LEVEL" | "";

  sourceSystem?: string;
};

export type CatalogFilters = {
  lobs: string[];
  categories: string[];
  brands: string[];
  price: { minPrice: number; maxPrice: number; minMrp: number; maxMrp: number };
};

export const getCatalogApi = (params: Record<string, any> = {}) =>
  apiFetch<PagedItems<ApiCatalogItem>>(`/catalog${buildQuery(params)}`);

export const getCatalogFiltersApi = (params: Record<string, any> = {}) =>
  apiFetch<CatalogFilters>(`/catalog/filters${buildQuery(params)}`);

export const getCatalogHomeApi = (params: Record<string, any> = {}) =>
  apiFetch<any>(`/catalog/home${buildQuery(params)}`);
