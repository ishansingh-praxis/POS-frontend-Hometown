export type StoreStatus = "active" | "inactive" | "maintenance";

export type HomeTownStore = {
  code: string;              // e.g. BLR-IND
  name: string;
  city: string;
  state: string;
  region: "North" | "South" | "East" | "West" | "Central";
  zone: string;              // operational zone, e.g. "South-1"
  address: string;
  gstin: string;             // 15-char GSTIN
  phone: string;
  email: string;
  status: StoreStatus;
  openTime: string;          // "10:00"
  closeTime: string;         // "21:30"
  warehouseCode: string;     // mapped warehouse
  sapCode: string;           // mapped SAP / ERP plant code
  // Mock operational KPIs for store-wise drill-down
  mtdSales: number;
  todaySales: number;
  invoicesToday: number;
  pendingPayments: number;
  stockValue: number;
  lowStockSkus: number;
  manager: string;
};

export const STORE_LIST: HomeTownStore[] = [
  {
    code: "BLR-IND", name: "Indiranagar Flagship",
    city: "Bengaluru", state: "Karnataka", region: "South", zone: "South-1",
    address: "100 Ft Rd, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
    gstin: "29AAACH1234F1Z5", phone: "+91 80 4112 8800", email: "indiranagar@hometown.in",
    status: "active", openTime: "10:00", closeTime: "21:30",
    warehouseCode: "WH-BLR-01", sapCode: "HT1101",
    mtdSales: 18420000, todaySales: 482300, invoicesToday: 36, pendingPayments: 124500, stockValue: 24500000, lowStockSkus: 4, manager: "Anita Sharma",
  },
  {
    code: "GWL-CTY", name: "Gwalior City Centre",
    city: "Gwalior", state: "Madhya Pradesh", region: "Central", zone: "Central-2",
    address: "DD Mall, City Centre, Gwalior 474011",
    gstin: "23AAACH1234F1Z9", phone: "+91 751 422 7700", email: "gwalior@hometown.in",
    status: "active", openTime: "10:30", closeTime: "21:00",
    warehouseCode: "WH-IDR-02", sapCode: "HT1207",
    mtdSales: 7820000, todaySales: 186400, invoicesToday: 14, pendingPayments: 41200, stockValue: 9800000, lowStockSkus: 7, manager: "Ramesh Tomar",
  },
  {
    code: "DEL-SKT", name: "Saket Select",
    city: "New Delhi", state: "Delhi", region: "North", zone: "North-1",
    address: "Select Citywalk, Saket District Centre, New Delhi 110017",
    gstin: "07AAACH1234F1Z3", phone: "+91 11 4080 5500", email: "saket@hometown.in",
    status: "active", openTime: "11:00", closeTime: "22:00",
    warehouseCode: "WH-DEL-01", sapCode: "HT1305",
    mtdSales: 16240000, todaySales: 398750, invoicesToday: 29, pendingPayments: 87600, stockValue: 21200000, lowStockSkus: 3, manager: "Aditya Khanna",
  },
  {
    code: "MUM-LBS", name: "LBS Marg Megastore",
    city: "Mumbai", state: "Maharashtra", region: "West", zone: "West-1",
    address: "R-City Mall, LBS Marg, Ghatkopar West, Mumbai 400086",
    gstin: "27AAACH1234F1Z7", phone: "+91 22 6112 9900", email: "lbs@hometown.in",
    status: "active", openTime: "11:00", closeTime: "22:00",
    warehouseCode: "WH-MUM-01", sapCode: "HT1402",
    mtdSales: 21580000, todaySales: 612400, invoicesToday: 42, pendingPayments: 198300, stockValue: 28400000, lowStockSkus: 5, manager: "Sneha Kulkarni",
  },
  {
    code: "HYD-BJR", name: "Banjara Hills",
    city: "Hyderabad", state: "Telangana", region: "South", zone: "South-2",
    address: "Road No 12, Banjara Hills, Hyderabad 500034",
    gstin: "36AAACH1234F1Z1", phone: "+91 40 2335 1100", email: "banjara@hometown.in",
    status: "maintenance", openTime: "10:00", closeTime: "21:00",
    warehouseCode: "WH-HYD-01", sapCode: "HT1108",
    mtdSales: 6420000, todaySales: 0, invoicesToday: 0, pendingPayments: 32100, stockValue: 11800000, lowStockSkus: 9, manager: "Vivek Reddy",
  },
  {
    code: "KOL-PRK", name: "Park Street",
    city: "Kolkata", state: "West Bengal", region: "East", zone: "East-1",
    address: "Park Street, Kolkata 700016",
    gstin: "19AAACH1234F1Z2", phone: "+91 33 4001 2200", email: "park@hometown.in",
    status: "inactive", openTime: "10:30", closeTime: "21:30",
    warehouseCode: "WH-KOL-01", sapCode: "HT1503",
    mtdSales: 0, todaySales: 0, invoicesToday: 0, pendingPayments: 0, stockValue: 4200000, lowStockSkus: 12, manager: "—",
  },
];

export const REGIONS = ["North", "South", "East", "West", "Central"] as const;
export const STATUS_LABEL: Record<StoreStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  maintenance: "Under maintenance",
};
