import { useEffect, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { TodoPage } from './pages/Todo';
import { NotesPage } from './pages/Notes';
import { FormatterPage } from './pages/Formatter';
import { GeneratorPage } from './pages/Generator';
import { SettingsPage } from './pages/Settings';
import { ResetPasswordPage } from './pages/ResetPassword';
import { useAuthStore } from './store/authStore';

const AuthLoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
  </div>
);

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { initialized, isAuthenticated } = useAuthStore();
  if (!initialized) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }: { children: ReactElement }) => {
  const { initialized, isAuthenticated } = useAuthStore();
  if (!initialized) return <AuthLoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { initialized, initializeAuth } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
    }
  }, [initializeAuth, initialized]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="todo" element={<TodoPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="formatter" element={<FormatterPage />} />
          <Route path="generator" element={<GeneratorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
