// src/lib/auth.ts

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import React from "react";

// ---------- Types ----------
export type Role = "cashier" | "manager" | "admin";

export type Permission =
  | "bill.create"
  | "bill.void"
  | "bill.discount.apply"
  | "bill.discount.approve"
  | "bill.price.override"
  | "order.cancel"
  | "order.return.create"
  | "order.return.approve"
  | "payment.collect"
  | "payment.refund"
  | "payment.reconcile"
  | "inventory.view"
  | "inventory.adjust"
  | "inventory.transfer"
  | "customer.view"
  | "customer.edit"
  | "report.store"
  | "report.network"
  | "report.financial"
  | "user.manage"
  | "permission.manage"
  | "store.manage"
  | "sap.sync"
  | "sap.configure"
  | "session.view"
  | "support.ticket";

export type StoreCode = string;

export type AuthUser = {
  username: string;
  name: string;
  role: Role;
  store: StoreCode;
  storeName: string;
  email: string;
  deviceId: string;
  loginAt: number;
  lastActive: number;
  token: string;
  employeeCode?: string;
  managerId?: string;
  city?: string;
  state?: string;
  region?: string;
  zone?: string;
};

export type DeviceSession = {
  username: string;
  name: string;
  role: Role;
  store: StoreCode;
  storeName: string;
  deviceId: string;
  deviceLabel: string;
  ip: string;
  loginAt: number;
  lastActive: number;
  current: boolean;
};

type AuthCtx = {
  user: AuthUser | null;
  login: (username: string, password: string, role: Role) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  can: (perm: Permission) => boolean;
  sessions: DeviceSession[];
  revokeSession: (deviceId: string) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

// ---------- API & Constants ----------
// Use the Vite proxy – no CORS issues
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const STORES: Record<string, string> = {
  "6036": "Ht Bhubaneshwar Janpath",
  "6063": "Ht-Nashik City Center Mall",
  "6068": "Ht Aurangabad-Prozone Mall",
  "6095": "Ht-Vizag Cmr Central Mall",
  "6098": "Ht-Guwahati Lachit Nagar",
  "6139": "Ht-Patna-Bhavya Iconic Tower",
  "6140": "Ht-Lucknow-Gomti Nagar",
  "6144": "Ht-Raipur-Lal ganga",
  "6150": "Ht-Pune Seasons Mall",
  "6343": "Ht-Exp Nagpur Wardha Road",
  "6346": "Ht-Siliguri",
  "6352": "Ht-Kol-Bhavanipur Homeland",
  "6357": "Ht-Kolkata-Dcn Mall",
  "6501": "Ht-Ahmedabad Acropolis Mall",
  "6790": "HT Gwalior DD Mall",
  "ALL": "All stores (Head Office)",
};

export const ROLE_LABELS: Record<Role, string> = {
  cashier: "Cashier",
  manager: "Store Manager",
  admin: "Head Office Admin",
};

export const ROLE_BLURB: Record<Role, string> = {
  cashier: "Bill at the counter",
  manager: "Run a single store",
  admin: "All stores · HQ · Accounts · SAP · Support",
};

export const roleHome: Record<Role, "/cashier/dashboard" | "/manager/dashboard" | "/admin/dashboard"> = {
  cashier: "/cashier/dashboard",
  manager: "/manager/dashboard",
  admin: "/admin/dashboard",
};

// ---------- All 63 Demo Credentials (pulled live from pos_logins) ----------
export const demoCredentials: { role: Role; username: string; password: string }[] = [
  // Admins (2)
  { role: "admin", username: "kailash.vaishanv@praxisretail.in", password: "Password@123" },
  { role: "admin", username: "punit.singh@praxisretail.in", password: "Password@123" },
  // Managers (14)
  { role: "manager", username: "manager.6036@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6063@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6068@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6095@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6098@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6139@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6140@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6144@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6150@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6343@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6346@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6352@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6357@hometownpos.in", password: "Password@123" },
  { role: "manager", username: "manager.6501@hometownpos.in", password: "Password@123" },
  // Cashiers (47)
  { role: "cashier", username: "cashier1.6036@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6036@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6036@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier4.6036@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6063@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6063@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6063@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier4.6063@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6068@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6068@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6068@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier4.6068@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6095@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6095@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6095@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6098@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6098@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6098@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier4.6098@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6139@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6139@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6139@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6140@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6140@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6140@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6144@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6144@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6144@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6150@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6150@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6150@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6343@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6343@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6343@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6346@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6346@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6346@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6352@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6352@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6352@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6357@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6357@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6357@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier1.6501@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier2.6501@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier3.6501@hometownpos.in", password: "Password@123" },
  { role: "cashier", username: "cashier4.6501@hometownpos.in", password: "Password@123" },
];

// ---------- Permission Matrix ----------
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  cashier: [
    "bill.create", "bill.discount.apply",
    "order.return.create",
    "payment.collect",
    "inventory.view",
    "customer.view", "customer.edit",
  ],
  manager: [
    "bill.create", "bill.void", "bill.discount.apply", "bill.discount.approve",
    "order.cancel", "order.return.create", "order.return.approve",
    "payment.collect", "payment.refund",
    "inventory.view", "inventory.adjust", "inventory.transfer",
    "customer.view", "customer.edit",
    "report.store",
  ],
  admin: [
    "bill.create", "bill.void", "bill.discount.apply", "bill.discount.approve", "bill.price.override",
    "order.cancel", "order.return.create", "order.return.approve",
    "payment.collect", "payment.refund", "payment.reconcile",
    "inventory.view", "inventory.adjust", "inventory.transfer",
    "customer.view", "customer.edit",
    "report.store", "report.network", "report.financial",
    "user.manage", "permission.manage", "store.manage",
    "sap.sync", "sap.configure", "session.view", "support.ticket",
  ],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "bill.create": "Create bills",
  "bill.void": "Void / cancel bills",
  "bill.discount.apply": "Apply discounts",
  "bill.discount.approve": "Approve discounts above threshold",
  "bill.price.override": "Override product price",
  "order.cancel": "Cancel orders",
  "order.return.create": "Initiate returns",
  "order.return.approve": "Approve returns / exchanges",
  "payment.collect": "Collect payments",
  "payment.refund": "Issue refunds",
  "payment.reconcile": "Reconcile EOD payments",
  "inventory.view": "View inventory",
  "inventory.adjust": "Adjust stock",
  "inventory.transfer": "Inter-store transfers",
  "customer.view": "View customers",
  "customer.edit": "Edit customer profile",
  "report.store": "Store-level reports",
  "report.network": "Network-wide reports",
  "report.financial": "Financial / GST reports",
  "user.manage": "Manage users",
  "permission.manage": "Manage permissions",
  "store.manage": "Manage stores",
  "sap.sync": "Run SAP / ERP sync",
  "sap.configure": "Configure SAP integration",
  "session.view": "View active device sessions",
  "support.ticket": "Handle support tickets",
};

// ---------- Sessions / Device Tracking ----------
const STORAGE_USER = "ht-pos-user";
const STORAGE_SESSIONS = "ht-pos-sessions";
const IDLE_TIMEOUT_MIN = 30;

const SEED_SESSIONS: DeviceSession[] = [
  { username: "manager", name: "Anita Sharma", role: "manager", store: "BLR-IND", storeName: STORES["BLR-IND"], deviceId: "dev-blr-pos-02", deviceLabel: "Counter 2 — Windows 11", ip: "10.21.4.18", loginAt: Date.now() - 1000 * 60 * 95, lastActive: Date.now() - 1000 * 60 * 3, current: false },
  { username: "cashier", name: "Ravi Kumar",  role: "cashier", store: "GWL-CTY", storeName: STORES["GWL-CTY"], deviceId: "dev-gwl-pos-01", deviceLabel: "Counter 1 — POS Terminal",  ip: "10.44.2.7",  loginAt: Date.now() - 1000 * 60 * 210, lastActive: Date.now() - 1000 * 60 * 1, current: false },
  { username: "admin",   name: "Vikram Rao",   role: "admin", store: "ALL", storeName: STORES["ALL"], deviceId: "dev-hq-lap-04", deviceLabel: "HQ Laptop — MacBook Pro", ip: "203.0.113.22", loginAt: Date.now() - 1000 * 60 * 40, lastActive: Date.now() - 1000 * 60 * 9, current: false },
];

function readSessions(): DeviceSession[] {
  if (typeof window === "undefined") return SEED_SESSIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_SESSIONS);
    if (!raw) {
      window.localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(SEED_SESSIONS));
      return SEED_SESSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_SESSIONS;
  }
}

function writeSessions(s: DeviceSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(s));
}

function makeDeviceId(): string {
  const k = "ht-pos-device";
  if (typeof window === "undefined") return "dev-ssr";
  let v = window.localStorage.getItem(k);
  if (!v) {
    v = "dev-" + Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36).slice(-4);
    window.localStorage.setItem(k, v);
  }
  return v;
}

function detectDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "Linux";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Browser";
  return `${browser} · ${os}`;
}

// ---------- Auth Provider ----------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_USER) : null;
      if (raw) {
        const u: AuthUser = JSON.parse(raw);
        if (Date.now() - u.lastActive > IDLE_TIMEOUT_MIN * 60 * 1000) {
          window.localStorage.removeItem(STORAGE_USER);
        } else {
          setUser({ ...u, lastActive: Date.now() });
        }
      }
      setSessions(readSessions());
    } catch {
      /* ignore */
    }
  }, []);

  // Heartbeat
  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      const next = { ...user, lastActive: Date.now() };
      window.localStorage.setItem(STORAGE_USER, JSON.stringify(next));
      const all = readSessions().map((s) => s.deviceId === user.deviceId ? { ...s, lastActive: Date.now() } : s);
      writeSessions(all);
      setSessions(all);
    }, 30_000);
    return () => window.clearInterval(id);
  }, [user]);

  // ---- Login (async, real API) ----
  const login: AuthCtx["login"] = async (username, password, role) => {
    try {
      const payload: any = { password };
      if (role === "admin") {
        payload.email = username;
      } else {
        payload.username = username;
      }

      const response = await fetch(`${API_BASE}/pos/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return { ok: false, error: result.message || "Login failed" };
      }

      const { token, user: apiUser } = result.data;

      const mappedRole = apiUser.role.toLowerCase() as Role;
      const storeCode = apiUser.storeCode || "ALL";
      const storeName = apiUser.storeName || STORES[storeCode] || storeCode;

      const deviceId = makeDeviceId();
      const now = Date.now();

      const newUser: AuthUser = {
        username: apiUser.username || apiUser.email,
        name: apiUser.name,
        role: mappedRole,
        store: storeCode,
        storeName: storeName,
        email: apiUser.email || "",
        deviceId,
        loginAt: now,
        lastActive: now,
        token,
        employeeCode: apiUser.employeeCode || "",
        managerId: apiUser.managerId || "",
        city: apiUser.city || "",
        state: apiUser.state || "",
        region: apiUser.region || "",
        zone: apiUser.zone || "",
      };

      setUser(newUser);
      window.localStorage.setItem(STORAGE_USER, JSON.stringify(newUser));

      // Record device session
      const existing = readSessions().filter((s) => s.deviceId !== deviceId);
      const updated: DeviceSession[] = [
        {
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          store: newUser.store,
          storeName: newUser.storeName,
          deviceId,
          deviceLabel: detectDeviceLabel(),
          ip: "192.168.1." + Math.floor(Math.random() * 200 + 20),
          loginAt: now,
          lastActive: now,
          current: true,
        },
        ...existing.map((s) => ({ ...s, current: false })),
      ];
      writeSessions(updated);
      setSessions(updated);

      return { ok: true };
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, error: "Network error. Please try again." };
    }
  };

  // ---- Logout ----
  const logout = () => {
    if (user) {
      const remaining = readSessions().filter((s) => s.deviceId !== user.deviceId);
      writeSessions(remaining);
      setSessions(remaining);
    }
    setUser(null);
    window.localStorage.removeItem(STORAGE_USER);
  };

  const can = (perm: Permission) => !!user && ROLE_PERMISSIONS[user.role].includes(perm);

  const revokeSession = (deviceId: string) => {
    const next = readSessions().filter((s) => s.deviceId !== deviceId);
    writeSessions(next);
    setSessions(next);
    if (user && user.deviceId === deviceId) logout();
  };

  return React.createElement(
    Ctx.Provider,
    { value: { user, login, logout, can, sessions, revokeSession } },
    children
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}