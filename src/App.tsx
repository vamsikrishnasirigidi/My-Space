import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { TodoPage } from './pages/Todo';
import { NotesPage } from './pages/Notes';
import { FormatterPage } from './pages/Formatter';
import { GeneratorPage } from './pages/Generator';
import { SettingsPage } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Secure Login Barrier */}
        <Route path="/login" element={<Login />} />

        {/* Unified Dashboard Sub-routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="todo" element={<TodoPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="formatter" element={<FormatterPage />} />
          <Route path="generator" element={<GeneratorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Global Wildcard Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
