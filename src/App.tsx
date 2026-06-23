import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import PageAccess from "./routes/access";
import PageAccounts from "./routes/accounts";
import PageAdmin from "./routes/admin";
import PageAdminDashboard from "./routes/admin-dashboard";
import PageAudit from "./routes/audit";
import PageCashierDashboard from "./routes/cashier-dashboard";
import PageCashierShift from "./routes/cashier-shift";
import PageCatalogue from "./routes/catalogue";
import PageCategories from "./routes/categories";
import PageCoupons from "./routes/coupons";
import PageCustomers from "./routes/customers";
import PageDataIo from "./routes/data-io";
import PageHardware from "./routes/hardware";
import HomeRedirect from "./routes/index";
import PageInventory from "./routes/inventory";
import PageInvoices from "./routes/invoices";
import PageLogin from "./routes/login";
import PageManager from "./routes/manager";
import PageManagerCategories from "./routes/manager-categories";
import PageManagerDashboard from "./routes/manager-dashboard";
import PageMasterData from "./routes/master-data";
import PageMyCapabilities from "./routes/my-capabilities";
import PageNotifications from "./routes/notifications";
import PageOffers from "./routes/offers";
import PageOnline from "./routes/online";
import PageOrders from "./routes/orders";
import PagePayments from "./routes/payments";
import PagePos from "./routes/pos";
import PageReports from "./routes/reports";
import PageSap from "./routes/sap";
import PageSessions from "./routes/sessions";
import PageSettings from "./routes/settings";
import PageStores from "./routes/stores";
import PageSupport from "./routes/support";

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/access" element={<PageAccess />} />
          <Route path="/accounts" element={<PageAccounts />} />
          <Route path="/admin" element={<PageAdmin />} />
          <Route path="/admin/dashboard" element={<PageAdminDashboard />} />
          <Route path="/manager/dashboard" element={<PageManagerDashboard />} />
          <Route path="/manager/categories" element={<PageManagerCategories />} />
          <Route path="/cashier/dashboard" element={<PageCashierDashboard />} />
          <Route path="/cashier/billing" element={<PagePos />} />
          <Route path="/my-capabilities" element={<PageMyCapabilities />} />
          <Route path="/audit" element={<PageAudit />} />
          <Route path="/catalogue" element={<PageCatalogue />} />
          <Route path="/categories" element={<PageCategories />} />
          <Route path="/coupons" element={<PageCoupons />} />
          <Route path="/customers" element={<PageCustomers />} />
          <Route path="/data-io" element={<PageDataIo />} />
          <Route path="/hardware" element={<PageHardware />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/inventory" element={<PageInventory />} />
          <Route path="/invoices" element={<PageInvoices />} />
          <Route path="/login" element={<PageLogin />} />
          <Route path="/manager" element={<PageManager />} />
          <Route path="/master-data" element={<PageMasterData />} />
          <Route path="/notifications" element={<PageNotifications />} />
          <Route path="/offers" element={<PageOffers />} />
          <Route path="/online" element={<PageOnline />} />
          <Route path="/orders" element={<PageOrders />} />
          <Route path="/payments" element={<PagePayments />} />
          <Route path="/pos" element={<PagePos />} />
          <Route path="/cashier/shift" element={<PageCashierShift />} />
          <Route path="/reports" element={<PageReports />} />
          <Route path="/sap" element={<PageSap />} />
          <Route path="/sessions" element={<PageSessions />} />
          <Route path="/settings" element={<PageSettings />} />
          <Route path="/stores" element={<PageStores />} />
          <Route path="/support" element={<PageSupport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
