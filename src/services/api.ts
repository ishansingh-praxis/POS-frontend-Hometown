const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api/pos";

export const getToken = () => {
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

export const apiFetchRaw = async (path: string, options: RequestInit = {}) => {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "API request failed");
  }

  return data;
};

export const apiFetch = async <T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const data = await apiFetchRaw(path, options);
  return data.data;
};

export const apiFetchWithMeta = async <T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; meta: any }> => {
  const data = await apiFetchRaw(path, options);
  return { data: data.data, meta: data.meta };
};

export const buildQuery = (params: Record<string, any> = {}) => {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      qs.set(key, String(value));
    }
  });

  return qs.toString() ? `?${qs}` : "";
};
