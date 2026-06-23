const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api/pos";

const getToken = () => {
  try {
    const raw = localStorage.getItem("ht-pos-user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token as string;
    }
  } catch {
    // ignore
  }
  return "";
};

const authHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export type CouponValidationPayload = {
  offerCode: string;
  storeCode: string;
  storeName?: string;
  customerPhone?: string;
  billAmount: number;
  paymentMode?: string;
  bankName?: string;
  cardType?: string;
  cashierId?: string;
  cashierName?: string;
};

export type CouponValidationResult = {
  offerCode: string;
  campaignCode: string;
  campaignName: string;
  campaignType: string;
  storeCode: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minimumBillAmount: number;
  maximumDiscountAmount: number;
  billAmount: number;
  discountAmount: number;
  finalPayableAmount: number;
  valid: boolean;
};

export const validateCouponApi = async (
  payload: CouponValidationPayload
): Promise<CouponValidationResult> => {
  const res = await fetch(`${API_BASE}/coupon-codes/validate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Coupon validation failed");
  }

  return data.data;
};

export const markCouponAvailedApi = async (
  offerCode: string,
  payload: Record<string, any>
) => {
  const res = await fetch(
    `${API_BASE}/coupon-codes/${offerCode}/mark-availed`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Coupon availed update failed");
  }

  return data.data;
};

export const releaseCouponApi = async (
  offerCode: string,
  payload: Record<string, any>
) => {
  const res = await fetch(`${API_BASE}/coupon-codes/${offerCode}/release`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Coupon release failed");
  }

  return data.data;
};

export const getCouponSummaryApi = async (params: Record<string, any> = {}) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  const res = await fetch(
    `${API_BASE}/coupon-codes/summary${qs.toString() ? `?${qs}` : ""}`,
    {
      headers: authHeaders(),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Coupon summary failed");
  }

  return data.data;
};

export const getCouponCodesApi = async (params: Record<string, any> = {}) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  const res = await fetch(
    `${API_BASE}/coupon-codes${qs.toString() ? `?${qs}` : ""}`,
    {
      headers: authHeaders(),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Coupon list failed");
  }

  return {
    data: data.data,
    meta: data.meta,
  };
};

export const getCouponCampaignsApi = async (
  params: Record<string, any> = {}
) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  const res = await fetch(
    `${API_BASE}/coupon-codes/campaigns${qs.toString() ? `?${qs}` : ""}`,
    {
      headers: authHeaders(),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Coupon campaigns failed");
  }

  return data.data;
};

const fetchCouponAnalytics = async (
  endpoint: string,
  params: Record<string, any> = {}
) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  const res = await fetch(
    `${API_BASE}/coupon-codes/analytics/${endpoint}${
      qs.toString() ? `?${qs}` : ""
    }`,
    {
      headers: authHeaders(),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || `Coupon ${endpoint} analytics failed`);
  }

  return data.data;
};

export const getAdvancedCouponAnalyticsApi = (
  params: Record<string, any> = {}
) => fetchCouponAnalytics("advanced", params);

export const getCouponStoreWiseApi = (params: Record<string, any> = {}) =>
  fetchCouponAnalytics("store-wise", params);

export const getCouponCampaignPerformanceApi = (
  params: Record<string, any> = {}
) => fetchCouponAnalytics("campaign-performance", params);

export const getCouponFailedAttemptsApi = (
  params: Record<string, any> = {}
) => fetchCouponAnalytics("failed-attempts", params);

export const getCouponBurnRateApi = (params: Record<string, any> = {}) =>
  fetchCouponAnalytics("burn-rate", params);

export const getCouponAlertsApi = (params: Record<string, any> = {}) =>
  fetchCouponAnalytics("alerts", params);
