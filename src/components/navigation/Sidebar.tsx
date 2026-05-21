import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Home, 
  CalendarRange, 
  FileText, 
  Sparkles, 
  PenTool, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, signOut } = useAuthStore();

  const navigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'To-do', path: '/todo', icon: CalendarRange },
    { name: 'Notes', path: '/notes', icon: FileText },
    { name: 'Formatter', path: '/formatter', icon: Sparkles },
    { name: 'Generator', path: '/generator', icon: PenTool },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between border-r border-slate-200/50 dark:border-slate-800/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-all duration-300 ease-in-out lg:static",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Header Section */}
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/40 dark:border-slate-800/20">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/10 text-white font-bold text-lg select-none">
                M
              </div>
              {!isCollapsed && (
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent truncate animate-fade-in">
                  My Space
                </span>
              )}
            </div>
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 p-4">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all relative group",
                    isActive
                      ? "bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform group-hover:scale-105",
                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate animate-fade-in">{item.name}</span>
                    )}
                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 rounded bg-slate-900 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap shadow-md">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User / Settings Footer Section */}
        <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/20">
          <div
            className={cn(
              "flex items-center gap-3.5 p-2 rounded-xl transition-all",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/40 dark:border-slate-700/20">
                <User className="h-4.5 w-4.5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden animate-fade-in">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-xxs text-slate-400 truncate">
                    {user?.email}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
