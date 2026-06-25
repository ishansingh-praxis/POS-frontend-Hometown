import { apiFetch } from "./api";
import type { PagedItems } from "./cashierService";

export type ApiSetting = {
  _id: string;
  settingKey: string;
  settingValue: any;
  module: string;
  status?: string;
};

export const getAllSettingsApi = () =>
  apiFetch<PagedItems<ApiSetting>>("/settings?limit=500").then((res) => res.items);

export const saveSettingsApi = (records: { settingKey: string; settingValue: any; module: string }[]) =>
  apiFetch<ApiSetting[]>("/settings/bulk", {
    method: "POST",
    body: JSON.stringify({ records }),
  });
