import { apiFetch } from "./api";

export type ApiSetting = {
  _id: string;
  settingKey: string;
  settingValue: any;
  module: string;
  status?: string;
};

export const getAllSettingsApi = () =>
  apiFetch<ApiSetting[]>("/settings?limit=500");

export const saveSettingsApi = (records: { settingKey: string; settingValue: any; module: string }[]) =>
  apiFetch<ApiSetting[]>("/settings/bulk", {
    method: "POST",
    body: JSON.stringify({ records }),
  });
