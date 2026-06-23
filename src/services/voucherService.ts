import { apiFetch, buildQuery } from "./api";

export type ApiVoucher = {
  _id: string;
  voucherId: string;
  voucherCode: string;
  customerPhone?: string;
  customerName?: string;
  amount: number;
  availableAmount: number;
  redeemedAmount: number;
  status: "ACTIVE" | "USED" | "EXPIRED";
  storeIssued?: string;
  issuedAt?: string;
  expiryDate?: string;
};

export const issueVoucherApi = (payload: { customerPhone?: string; customerName?: string; amount: number; expiryDate?: string; notes?: string }) =>
  apiFetch<ApiVoucher>("/vouchers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listVouchersApi = (params: Record<string, any> = {}) =>
  apiFetch<ApiVoucher[]>(`/vouchers${buildQuery(params)}`);

export const validateVoucherApi = (payload: { voucherCode: string; customerPhone?: string }) =>
  apiFetch<ApiVoucher>("/vouchers/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const redeemVoucherApi = (payload: { voucherCode: string; customerPhone?: string; amount: number }) =>
  apiFetch<ApiVoucher>("/vouchers/redeem", {
    method: "POST",
    body: JSON.stringify(payload),
  });
