import { apiFetch, buildQuery } from "./api";

export type SapSyncStatus = "PENDING" | "SYNCED" | "RETRYING" | "FAILED";

export type ApiSapSyncLog = {
  _id: string;
  syncId: string;
  entityType: string;
  entityId: string;
  storeCode?: string;
  target?: string;
  syncStatus: SapSyncStatus;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type SapSummary = Record<SapSyncStatus, number>;

export const getSapSummaryApi = (params: Record<string, any> = {}) =>
  apiFetch<SapSummary>(`/sap/summary${buildQuery(params)}`);

export const getSapSyncLogsApi = (params: Record<string, any> = {}) =>
  apiFetch<{ items: ApiSapSyncLog[]; total: number; page: number; limit: number }>(`/sap/sync-logs${buildQuery(params)}`);

export const queueUnsyncedInvoicesApi = (params: Record<string, any> = {}) =>
  apiFetch<ApiSapSyncLog[]>(`/sap/sync/unsynced-invoices${buildQuery(params)}`, { method: "POST" });

export const retrySapSyncApi = (id: string) =>
  apiFetch<ApiSapSyncLog>(`/sap/retry/${id}`, { method: "POST" });

export const markSapSyncStatusApi = (id: string, syncStatus: SapSyncStatus, errorMessage?: string) =>
  apiFetch<ApiSapSyncLog>(`/sap/${id}/sync-status`, {
    method: "PATCH",
    body: JSON.stringify({ syncStatus, errorMessage }),
  });
