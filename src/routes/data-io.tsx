import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { Upload, Download, FileSpreadsheet, FileJson, FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";


type Entity = "Products" | "Inventory" | "Customers" | "Stores" | "Online orders" | "SAP sync" | "Accounting" | "Reports";
type Job = { id: string; entity: Entity; direction: "Import" | "Export"; format: "Excel" | "CSV" | "JSON"; rows: number; by: string; at: string; status: "Completed" | "Processing" | "Failed" };

const ENTITIES: { name: Entity; importable: boolean; exportable: boolean; sample: string }[] = [
  { name: "Products", importable: true, exportable: true, sample: "sku,name,brand,mrp,gst,hsn" },
  { name: "Inventory", importable: true, exportable: true, sample: "sku,store,available,reserved,damaged" },
  { name: "Customers", importable: true, exportable: true, sample: "mobile,name,email,gstin,type" },
  { name: "Stores", importable: true, exportable: true, sample: "code,name,gstin,city,sap_code" },
  { name: "Online orders", importable: true, exportable: false, sample: "channel,order_id,sku,qty,amount" },
  { name: "SAP sync", importable: false, exportable: true, sample: "entity,doc,status,error" },
  { name: "Accounting", importable: false, exportable: true, sample: "ledger,debit,credit,doc" },
  { name: "Reports", importable: false, exportable: true, sample: "Excel · PDF · CSV" },
];

const RECENT: Job[] = [
  { id: "JOB-2041", entity: "Products", direction: "Import", format: "Excel", rows: 1240, by: "Rohit (Admin)", at: "Today · 10:22", status: "Completed" },
  { id: "JOB-2040", entity: "Inventory", direction: "Export", format: "CSV", rows: 8920, by: "Megha (Manager)", at: "Today · 09:14", status: "Completed" },
  { id: "JOB-2039", entity: "Online orders", direction: "Import", format: "JSON", rows: 312, by: "System", at: "Yesterday · 23:45", status: "Processing" },
  { id: "JOB-2038", entity: "Customers", direction: "Import", format: "Excel", rows: 86, by: "Asha (Support)", at: "Yesterday · 18:02", status: "Failed" },
  { id: "JOB-2037", entity: "SAP sync", direction: "Export", format: "JSON", rows: 1450, by: "Vijay (SAP)", at: "Yesterday · 15:30", status: "Completed" },
];

function fmt(s: string) {
  if (s === "Excel") return FileSpreadsheet;
  if (s === "JSON") return FileJson;
  return FileText;
}

function DataIO() {
  const [tab, setTab] = useState<"import" | "export">("import");

  return (
    <AppShell title="Data Import & Export" subtitle="Move catalogue, inventory, customers, orders and accounting in Excel, CSV or JSON" allow={["admin"]}>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setTab("import")} className={`px-3 py-1.5 rounded-md text-sm ${tab === "import" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}><Upload className="inline h-3.5 w-3.5 mr-1.5" /> Import</button>
        <button onClick={() => setTab("export")} className={`px-3 py-1.5 rounded-md text-sm ${tab === "export" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}><Download className="inline h-3.5 w-3.5 mr-1.5" /> Export</button>
        <span className="ml-auto text-xs text-muted-foreground">Supports Excel · CSV · JSON</span>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {ENTITIES.filter((e) => (tab === "import" ? e.importable : e.exportable)).map((e) => (
          <div key={e.name} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{tab === "import" ? "Upload to update master data" : "Download current snapshot"}</div>
              </div>
              {tab === "import" ? <Upload className="h-4 w-4 text-muted-foreground" /> : <Download className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1.5 mb-3 truncate">{e.sample}</div>
            <div className="flex items-center gap-2">
              <button className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" /> Excel</button>
              <button className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1"><FileText className="h-3 w-3" /> CSV</button>
              <button className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1"><FileJson className="h-3 w-3" /> JSON</button>
              {tab === "import" && <button className="ml-auto text-xs px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground">Choose file</button>}
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border font-medium">Recent jobs</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Job</th>
                <th className="text-left px-4 py-2.5">Entity</th>
                <th className="text-left px-4 py-2.5">Direction</th>
                <th className="text-left px-4 py-2.5">Format</th>
                <th className="text-right px-4 py-2.5">Rows</th>
                <th className="text-left px-4 py-2.5">By</th>
                <th className="text-left px-4 py-2.5">When</th>
                <th className="text-left px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map((j) => {
                const Icon = fmt(j.format);
                return (
                  <tr key={j.id} className="border-t border-border">
                    <td className="px-4 py-2.5 font-mono text-xs">{j.id}</td>
                    <td className="px-4 py-2.5">{j.entity}</td>
                    <td className="px-4 py-2.5">{j.direction}</td>
                    <td className="px-4 py-2.5"><span className="inline-flex items-center gap-1 text-xs"><Icon className="h-3 w-3" />{j.format}</span></td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{j.rows.toLocaleString()}</td>
                    <td className="px-4 py-2.5">{j.by}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{j.at}</td>
                    <td className="px-4 py-2.5">
                      {j.status === "Completed" && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" />Completed</span>}
                      {j.status === "Processing" && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400"><Clock className="h-3 w-3" />Processing</span>}
                      {j.status === "Failed" && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="h-3 w-3" />Failed</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

export default DataIO;
