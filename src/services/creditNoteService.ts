import { apiFetch } from "./api";

export type ApiCreditNote = {
  _id: string;
  creditNoteId: string;
  customerPhone: string;
  customerName?: string;
  storeCode: string;
  originalInvoiceId?: string;
  returnId?: string;
  creditAmount: number;
  availableAmount: number;
  redeemedAmount: number;
  status: "ACTIVE" | "PARTIALLY_REDEEMED" | "REDEEMED" | "EXPIRED";
  issuedAt: string;
};

export const getCreditNotesByPhoneApi = (phone: string) =>
  apiFetch<ApiCreditNote[]>(`/credit-notes/customer/${encodeURIComponent(phone)}`);

export const getCreditNoteApi = (creditNoteId: string) =>
  apiFetch<ApiCreditNote>(`/credit-notes/${creditNoteId}`);

export const sendCreditNoteOtpApi = (payload: { customerPhone: string; creditNoteId: string }) =>
  apiFetch<{ otpId: string; expiresAt: string; devOtp?: string }>("/credit-notes/send-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const verifyCreditNoteOtpApi = (payload: { customerPhone: string; otpId: string; otp: string }) =>
  apiFetch<{ verified: boolean; otpId: string }>("/credit-notes/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const redeemCreditNoteApi = (payload: {
  creditNoteId: string; customerPhone: string; amount: number; otpId: string; invoiceId?: string; orderId?: string;
}) =>
  apiFetch<{ creditNote: ApiCreditNote; redemption: any }>("/credit-notes/redeem", {
    method: "POST",
    body: JSON.stringify(payload),
  });
