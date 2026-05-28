import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { resolveTheme } from '../utils/theme';
import { Sidebar } from '../components/navigation/Sidebar';
import { Header } from '../components/navigation/Header';
import { ToastContainer } from '../components/ui/ToastContainer';
import { CommandPalette } from '../components/ui/CommandPalette';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toggleResolvedTheme = useThemeStore(state => state.toggleResolvedTheme);
  const { updateProfile } = useAuthStore();
  const syncedThemeForUser = useRef<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Prefer local theme (login/settings); sync profile once per user in the background.
  useEffect(() => {
    if (!user?.id || syncedThemeForUser.current === user.id) return;
    syncedThemeForUser.current = user.id;

    const localResolved = resolveTheme(useThemeStore.getState().theme);
    if (user.theme !== localResolved) {
      const timer = window.setTimeout(() => {
        void updateProfile(user.name, localResolved);
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [updateProfile, user?.id, user?.name, user?.theme]);

  // Global Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Detect if focus is inside typing inputs to prevent conflicts
      const activeEl = document.activeElement;
      const isInputFocused = 
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.getAttribute('contenteditable') === 'true' ||
         activeEl.classList.contains('tiptap'));

      // Ctrl/Cmd + K -> Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
        return;
      }

      // Ctrl/Cmd + Shift + D -> Toggle Dark Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const next = toggleResolvedTheme();
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          void useAuthStore.getState().updateProfile(currentUser.name, next);
        }
        return;
      }

      // Stop processing single-key shortcuts when user is focused inside input forms
      if (isInputFocused) return;

      // N -> New Note
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/notes');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-new-note-modal'));
        }, 100);
        return;
      }

      // T -> New Todo
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        navigate('/todo');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-new-todo-modal'));
        }, 100);
        return;
      }

      // / -> Focus Search Bar
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-global-search="true"]');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleResolvedTheme]);

  // Redirect to authorization barrier if no active session exists
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky top navbar */}
        <Header setIsMobileOpen={setIsMobileOpen} />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onOpenTodoModal={() => {
          navigate('/todo');
          setTimeout(() => window.dispatchEvent(new CustomEvent('open-new-todo-modal')), 100);
        }}
        onOpenNoteModal={() => {
          navigate('/notes');
          setTimeout(() => window.dispatchEvent(new CustomEvent('open-new-note-modal')), 100);
        }}
      />

      {/* Global Slide-up Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
