import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './lib/api';
import LoginPage from './pages/LoginPage';
import QuotationsListPage from './pages/QuotationsListPage';
import QuotationEditorPage from './pages/QuotationEditorPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/cotizador/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cotizador/login" element={<LoginPage />} />
        <Route
          path="/cotizador/"
          element={
            <RequireAuth>
              <QuotationsListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/cotizador/editor"
          element={
            <RequireAuth>
              <QuotationEditorPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/cotizador/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
