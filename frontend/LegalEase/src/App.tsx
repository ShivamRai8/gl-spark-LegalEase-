import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui';
import { Layout } from './components/Layout';
import { Protected } from './components/Protected';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <Protected>
                  <Layout />
                </Protected>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/:id" element={<CaseDetailPage />} />
              <Route
                path="/users"
                element={
                  <Protected roles={['ADMIN']}>
                    <UsersPage />
                  </Protected>
                }
              />
              <Route
                path="/audit"
                element={
                  <Protected roles={['ADMIN', 'JUDGE']}>
                    <AuditPage />
                  </Protected>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
