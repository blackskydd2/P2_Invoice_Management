import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/Shared/ProtectedRoute';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import UnauthorizedPage from './pages/Auth/UnauthorizedPage';
import DashboardPage from './pages/Invoices/DashboardPage';
import InvoiceListPage from './pages/Invoices/InvoiceListPage';
import CreateInvoicePage from './pages/Invoices/CreateInvoicePage';
import InvoiceDetailPage from './pages/Invoices/InvoiceDetailPage';
import AddPaymentPage from './pages/Payments/AddPaymentPage';
import AgingDashboardPage from './pages/Analytics/AgingDashboardPage';
import RevenueDashboardPage from './pages/Analytics/RevenueDashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected - all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/invoices" element={<InvoiceListPage />} />
              <Route path="/invoices/create" element={<CreateInvoicePage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/invoices/:id/payment" element={<AddPaymentPage />} />

              {/* Finance Manager + Admin only */}
              <Route element={<ProtectedRoute allowedRoles={['FinanceManager', 'Admin']} />}>
                <Route path="/analytics/aging" element={<AgingDashboardPage />} />
                <Route path="/analytics/revenue" element={<RevenueDashboardPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
