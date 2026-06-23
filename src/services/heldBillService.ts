import { apiFetch, buildQuery } from "./api";

export type ApiHeldBill = {
  _id: string;
  holdId: string;
  storeCode: string;
  storeName?: string;
  cashierId: string;
  cashierName?: string;
  customerPhone?: string;
  customer?: any;
  items: any[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  grandTotal: number;
  status: "HELD" | "RECALLED" | "VOIDED";
  posState?: any;
  heldAt: string;
  recalledAt?: string;
  voidedAt?: string;
};

export type HoldBillPayload = {
  storeCode: string;
  storeName?: string;
  cashierId: string;
  cashierName?: string;
  customerPhone?: string;
  customer?: any;
  items: any[];
  subtotal?: number;
  discountAmount?: number;
  gstAmount?: number;
  grandTotal?: number;
  posState?: any;
};

export const holdBillApi = (payload: HoldBillPayload) =>
  apiFetch<ApiHeldBill>("/held-bills", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listHeldBillsApi = (params: Record<string, any> = {}) =>
  apiFetch<ApiHeldBill[]>(`/held-bills${buildQuery(params)}`);

export const recallHeldBillApi = (holdId: string) =>
  apiFetch<ApiHeldBill>(`/held-bills/${holdId}/recall`, { method: "POST" });

export const voidHeldBillApi = (holdId: string) =>
  apiFetch<ApiHeldBill>(`/held-bills/${holdId}/void`, { method: "PATCH" });
