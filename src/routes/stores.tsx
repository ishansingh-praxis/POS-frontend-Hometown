// src/pages/Stores.tsx

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import {
  Building2, Search, RefreshCcw, Store as StoreIcon, MapPin, Clock,
  Info, MapPinned, CheckCircle, XCircle, AlertCircle, Package,
} from "lucide-react";

// -------- Types (mirroring API response) --------
export type StoreStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type Region = "North" | "South" | "East" | "West";

export interface HomeTownStore {
  _id: string;
  storeCode: string;
  storeName: string;
  city: string;
  state: string;
  region: Region;
  zone: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  openingTime: string;
  closingTime: string;
  status: StoreStatus;
  managerId: string;
  managerName?: string;
  gstNumber: string;
  sapStoreCode: string;
  posEnabled: boolean;
  onlineFulfillmentEnabled: boolean;
  offlineBillingEnabled: boolean;
  inventoryTrackingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------- Region color map --------
const REGION_COLORS: Record<Region, string> = {
  North: "bg-blue-500/20 border-blue-500/30 text-blue-700",
  South: "bg-emerald-500/20 border-emerald-500/30 text-emerald-700",
  East: "bg-amber-500/20 border-amber-500/30 text-amber-700",
  West: "bg-rose-500/20 border-rose-500/30 text-rose-700",
};

const REGION_BADGE_COLORS: Record<Region, string> = {
  North: "bg-blue-100 text-blue-700 border-blue-200",
  South: "bg-emerald-100 text-emerald-700 border-emerald-200",
  East: "bg-amber-100 text-amber-700 border-amber-200",
  West: "bg-rose-100 text-rose-700 border-rose-200",
};

const STATUS_COLORS: Record<StoreStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  MAINTENANCE: "bg-orange-100 text-orange-700 border-orange-200",
};

const STATUS_ICONS: Record<StoreStatus, React.ReactNode> = {
  ACTIVE: <CheckCircle className="h-3.5 w-3.5" />,
  INACTIVE: <XCircle className="h-3.5 w-3.5" />,
  MAINTENANCE: <AlertCircle className="h-3.5 w-3.5" />,
};

// -------- Helper: format date --------
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

// -------- Main Component --------
function Stores() {
  const { user } = useAuth();
  const [stores, setStores] = useState<HomeTownStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<HomeTownStore | null>(null);

  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");

  // -------- Fetch stores --------
  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pos/stores", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch stores");
      }
      const items = result.data.items || [];
      setStores(items);
      if (items.length > 0 && !selectedStore) setSelectedStore(items[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchStores();
  }, [user]);

  // -------- Filtering --------
  const filtered = stores.filter((s) =>
    (region === "All" || s.region === region) &&
    (status === "All" || s.status === status) &&
    (q.trim() === "" ||
      `${s.storeCode} ${s.storeName} ${s.city} ${s.gstNumber} ${s.sapStoreCode}`
        .toLowerCase()
        .includes(q.toLowerCase()))
  );

  // -------- Select first store on filter change --------
  useEffect(() => {
    if (filtered.length > 0 && !filtered.find((s) => s._id === selectedStore?._id)) {
      setSelectedStore(filtered[0]);
    }
  }, [filtered, selectedStore]);

  // -------- Render --------
  if (loading) {
    return (
      <AppShell allow={["admin"]} title="Store Management" subtitle="Loading stores…">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell allow={["admin"]} title="Store Management" subtitle="Error loading stores">
        <div className="p-6 text-center text-destructive border border-destructive/30 rounded-xl bg-destructive/5">
          <p>{error}</p>
          <button
            onClick={fetchStores}
            className="mt-4 text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      allow={["admin"]}
      title="Store Management"
      subtitle={`${stores.length} stores · ${stores.filter(s => s.status === "ACTIVE").length} active`}
      actions={
        <button
          onClick={fetchStores}
          className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2 bg-gradient-to-r from-primary/5 via-background to-primary/5 p-3 rounded-xl border border-border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code, name, city, GST, SAP…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="All">All regions</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="All">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Split view: grid + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Store grid */}
        <div>
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-20">No stores match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
              {filtered.map((store) => {
                const isSelected = selectedStore?._id === store._id;
                const regionColor = REGION_COLORS[store.region] || "bg-gray-100";
                return (
                  <div
                    key={store._id}
                    onClick={() => setSelectedStore(store)}
                    className={`rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-9 w-9 rounded-lg grid place-items-center ${regionColor}`}>
                          <StoreIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm truncate max-w-[140px]">{store.storeName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{store.storeCode}</div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[store.status]}`}>
                        {STATUS_ICONS[store.status]}
                        {store.status}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{store.city}, {store.state}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{store.openingTime} – {store.closingTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">Region: {store.region}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-mono">{store.gstNumber}</span>
                      <span className="font-mono">{store.sapStoreCode}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedStore ? (
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className={`h-10 w-10 rounded-lg grid place-items-center ${REGION_COLORS[selectedStore.region]}`}>
                <StoreIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl truncate">{selectedStore.storeName}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{selectedStore.storeCode}</span>
                  <span className="w-px h-3 bg-border" />
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${STATUS_COLORS[selectedStore.status]}`}>
                    {STATUS_ICONS[selectedStore.status]}
                    {selectedStore.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> City
                  </div>
                  <div className="mt-1 font-medium">{selectedStore.city}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> State
                  </div>
                  <div className="mt-1 font-medium">{selectedStore.state}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Region
                  </div>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${REGION_BADGE_COLORS[selectedStore.region]}`}>
                      {selectedStore.region}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPinned className="h-3.5 w-3.5" /> Zone
                  </div>
                  <div className="mt-1 font-medium">{selectedStore.zone}</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </div>
                <div className="mt-1 text-xs bg-muted/50 p-2 rounded-lg">{selectedStore.address}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Opening
                  </div>
                  <div className="mt-1 font-mono text-sm">{selectedStore.openingTime}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Closing
                  </div>
                  <div className="mt-1 font-mono text-sm">{selectedStore.closingTime}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> GST
                  </div>
                  <div className="mt-1 font-mono text-xs">{selectedStore.gstNumber}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> SAP Code
                  </div>
                  <div className="mt-1 font-mono text-xs">{selectedStore.sapStoreCode}</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Capabilities</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { label: "POS", value: selectedStore.posEnabled },
                    { label: "Online Fulfillment", value: selectedStore.onlineFulfillmentEnabled },
                    { label: "Offline Billing", value: selectedStore.offlineBillingEnabled },
                    { label: "Inventory Tracking", value: selectedStore.inventoryTrackingEnabled },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className={`text-[10px] px-2 py-1 rounded-full border ${
                        item.value
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      {item.value ? "✓" : "✕"} {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPinned className="h-3.5 w-3.5" /> Latitude
                  </div>
                  <div className="mt-1 font-mono">{selectedStore.latitude}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPinned className="h-3.5 w-3.5" /> Longitude
                  </div>
                  <div className="mt-1 font-mono">{selectedStore.longitude}</div>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground border-t border-border pt-3 mt-2 space-y-0.5">
                <div>Created: {formatDate(selectedStore.createdAt)}</div>
                <div>Updated: {formatDate(selectedStore.updatedAt)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="mt-2">Select a store to see details</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default Stores;