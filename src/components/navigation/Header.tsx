import React from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import { 
  Menu, 
  Sun, 
  Moon
} from 'lucide-react';

interface HeaderProps {
  setIsMobileOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setIsMobileOpen }) => {
  const location = useLocation();
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/': return 'Home';
      case '/todo': return 'To-do Planner';
      case '/notes': return 'Notes Workspace';
      case '/formatter': return 'AI Text Formatter';
      case '/generator': return 'AI Content Generator';
      case '/settings': return 'Settings';
      default: return 'Workspace';
    }
  };

  const getBreadcrumbs = (pathname: string) => {
    const title = getPageTitle(pathname);
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <span className="text-slate-400 dark:text-slate-500 font-normal">My Space</span>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-semibold">{title}</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-6 shadow-sm">
      {/* Mobile Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-300 lg:hidden transition-colors"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          {getBreadcrumbs(location.pathname)}
        </div>
        <span className="sm:hidden text-base font-bold text-slate-800 dark:text-slate-100">
          {getPageTitle(location.pathname)}
        </span>
      </div>

      {/* Right widgets */}
      <div className="flex items-center gap-3">
        {/* Database Status Badge */}
        {/* <div 
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold select-none border",
            isMock 
              ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/40 dark:border-amber-900/20 text-amber-600 dark:text-amber-400" 
              : "bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-200/40 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          )}
          title={isMock ? "Local Mock Database running on LocalStorage" : "Connected to Supabase Cloud Database"}
        >
          {isMock ? (
            <>
              <Database className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sandbox Mode</span>
            </>
          ) : (
            <>
              <CloudLightning className="h-3.5 w-3.5 animate-pulse-subtle" />
              <span className="hidden md:inline">Supabase Connected</span>
            </>
          )}
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isMock ? "bg-amber-500" : "bg-indigo-500")} />
        </div> */}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 shadow-sm hover:shadow-premium transition-all duration-300 cursor-pointer"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <Moon className="h-4.5 w-4.5 transition-all text-indigo-500" />
          ) : (
            <Sun className="h-4.5 w-4.5 transition-all text-amber-400" />
          )}
        </button>
      </div>
    </header>
  );
};
