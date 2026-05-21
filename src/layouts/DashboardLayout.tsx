import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Sidebar } from '../components/navigation/Sidebar';
import { Header } from '../components/navigation/Header';
import { ToastContainer } from '../components/ui/ToastContainer';
import { CommandPalette } from '../components/ui/CommandPalette';
import { Sparkles } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, initialized, checkSession } = useAuthStore();
  const themeStore = useThemeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Initialize session and sync visual theme on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Synchronize system styling once user is verified
  useEffect(() => {
    if (user?.theme) {
      themeStore.setTheme(user.theme as 'light' | 'dark');
    }
  }, [user]);

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
        themeStore.setTheme(themeStore.theme === 'light' ? 'dark' : 'light');
        return;
      }

      // Stop processing single-key shortcuts when user is focused inside input forms
      if (isInputFocused) return;

      // New Note
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
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, themeStore]);

  // Show a gorgeous modern loading skeleton on boot
  if (!initialized || (loading && !user)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="relative flex items-center justify-center">
          {/* Pulsing outer glowing rings */}
          <div className="absolute h-20 w-20 rounded-2xl bg-brand-500/10 dark:bg-brand-500/5 animate-ping" />
          <div className="absolute h-14 w-14 rounded-xl bg-brand-500/20 dark:bg-brand-500/10 animate-pulse-subtle" />
          
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-white shadow-lg shadow-brand-500/20">
            <Sparkles className="h-6 w-6 animate-spin-slow" />
          </div>
        </div>
        <span className="mt-5 text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 animate-pulse">
          Opening your space...
        </span>
      </div>
    );
  }

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
