import { apiFetch } from "./api";

export type ApiReturnableOrder = {
  _id: string;
  orderId: string;
  invoiceId: string;
  storeCode: string;
  customerName?: string;
  customerPhone?: string;
  items: {
    sku: string;
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  grandTotal: number;
  createdAt: string;
};

export type ReturnItemPayload = {
  sku: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ApiPosReturn = {
  _id: string;
  returnId: string;
  originalInvoiceId?: string;
  originalOrderId?: string;
  storeCode: string;
  customerPhone: string;
  customerName?: string;
  returnItems: ReturnItemPayload[];
  returnAmount: number;
  returnReason?: string;
  status: string;
  generatedCreditNoteId: string;
};

export const fetchInvoiceForReturnApi = (payload: { invoiceId?: string; orderId?: string; q?: string }) =>
  apiFetch<ApiReturnableOrder>("/pos-returns/fetch-invoice", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const confirmReturnApi = (payload: {
  originalInvoiceId?: string;
  originalOrderId?: string;
  storeCode: string;
  customerPhone: string;
  customerName?: string;
  returnItems: ReturnItemPayload[];
  returnReason?: string;
}) =>
  apiFetch<{ posReturn: ApiPosReturn; creditNote: any }>("/pos-returns/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
