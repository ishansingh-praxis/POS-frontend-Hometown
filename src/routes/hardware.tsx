import { AppShell } from "@/components/AppShell";
import { ScanLine, Printer, Banknote, CreditCard, QrCode, Monitor, Tag, Tablet, Laptop, Smartphone, CheckCircle2, AlertTriangle } from "lucide-react";


type Device = {
  name: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "Connected" | "Idle" | "Offline";
  detail: string;
};

const PERIPHERALS: Device[] = [
  { name: "Honeywell Voyager 1450g", type: "Barcode scanner", icon: ScanLine, status: "Connected", detail: "USB · COM3 · 312 scans today" },
  { name: "Zebra DS2208 QR", type: "QR scanner", icon: ScanLine, status: "Connected", detail: "USB HID · UPI & invoice QR" },
  { name: "Epson TM-T82 Thermal", type: "Thermal printer", icon: Printer, status: "Connected", detail: "80mm · Counter 1 receipt printer" },
  { name: "HP LaserJet M404", type: "A4 invoice printer", icon: Printer, status: "Idle", detail: "Network · Back office · last used 2h ago" },
  { name: "Brother QL-820NWB", type: "Label printer", icon: Tag, status: "Connected", detail: "Wi-Fi · Inventory labels" },
  { name: "Posiflex CR-4000", type: "Cash drawer", icon: Banknote, status: "Connected", detail: "RJ-11 via thermal printer · auto-open on cash" },
  { name: "Pine Labs Plutus Smart", type: "Card machine", icon: CreditCard, status: "Connected", detail: "Bluetooth · captures TID & RRN" },
  { name: "Paytm Soundbox QR", type: "UPI QR", icon: QrCode, status: "Connected", detail: "Static QR · settles to BLR-IND VPA" },
  { name: "Bematech LE1015", type: "Customer display", icon: Monitor, status: "Connected", detail: "HDMI · shows cart & total" },
];

const TERMINALS = [
  { name: "Tablet POS", icon: Tablet, count: 8, note: "iPad · floor walk billing" },
  { name: "Desktop POS", icon: Laptop, count: 24, note: "Counter terminals · all stores" },
  { name: "Mobile POS", icon: Smartphone, count: 5, note: "Android handheld · queue busting" },
];

function badge(status: Device["status"]) {
  if (status === "Connected") return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" />Connected</span>;
  if (status === "Idle") return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">Idle</span>;
  return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="h-3 w-3" />Offline</span>;
}

function Hardware() {
  return (
    <AppShell title="POS Hardware" subtitle="Scanners, printers, cash drawer, card machine, UPI QR and customer display" allow={["manager", "admin"]}>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {TERMINALS.map((t) => (
          <div key={t.name} className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-md bg-muted grid place-items-center"><t.icon className="h-5 w-5 text-foreground/70" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.note}</div>
            </div>
            <div className="font-display text-2xl">{t.count}</div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-medium">Connected peripherals</div>
          <button className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted">Test all devices</button>
        </div>
        <div className="divide-y divide-border">
          {PERIPHERALS.map((d) => (
            <div key={d.name} className="flex items-center gap-4 px-4 py-3">
              <div className="h-9 w-9 rounded-md bg-muted grid place-items-center"><d.icon className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground truncate">{d.type} · {d.detail}</div>
              </div>
              {badge(d.status)}
              <button className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted">Test</button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default Hardware;
