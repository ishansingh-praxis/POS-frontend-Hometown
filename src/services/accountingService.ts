import { apiFetch, buildQuery } from "./api";

export type AccountingSummary = {
  todayCollections: number;
  todayCollectionStores: number;
  todayCollectionChannels: number;
  pendingReconciliationAmount: number;
  pendingReconciliationBatches: number;
  invoicesGeneratedToday: number;
  gstLiabilityMtd: number;
};

export type SettlementBatch = {
  batchId: string;
  storeCode: string;
  channel: string;
  businessDate: string;
  amount: number;
  paymentCount: number;
  status: "MATCHED" | "PENDING";
};

export type Gstr1Row = {
  gstPercent: number;
  taxableValue: number;
  gstAmount: number;
  lineCount: number;
};

export const getAccountingSummaryApi = (params: Record<string, any> = {}) =>
  apiFetch<AccountingSummary>(`/accounting/summary${buildQuery(params)}`);

export const getSettlementBatchesApi = (params: Record<string, any> = {}) =>
  apiFetch<SettlementBatch[]>(`/accounting/settlement-batches${buildQuery(params)}`);

export const postSettlementBatchApi = (payload: { storeCode: string; channel: string; businessDate: string }) =>
  apiFetch<any>("/accounting/settlement-batches/post", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getGstr1ExportApi = (params: Record<string, any> = {}) =>
  apiFetch<Gstr1Row[]>(`/accounting/gstr1-export${buildQuery(params)}`);
