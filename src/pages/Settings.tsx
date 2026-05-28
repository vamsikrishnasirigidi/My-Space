import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, type Theme, type AccentColor, type SidebarStyle, type RoundedLevel } from '../store/themeStore';
import { toast } from '../store/toastStore';
import { useActivityStore } from '../store/activityStore';
import { 
  User, 
  Settings, 
  Sun, 
  Moon, 
  Monitor,
  LogOut, 
  Check, 
  Save,
  Palette,
  LayoutGrid,
  Minimize2
} from 'lucide-react';
import { cn } from '../utils/cn';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, signOut, loading } = useAuthStore();
  const themeStore = useThemeStore();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themeStore.theme);
  const [accent, setAccent] = useState<AccentColor>(themeStore.accentColor);
  const [sidebar, setSidebar] = useState<SidebarStyle>(themeStore.sidebarStyle);
  const [compact, setCompact] = useState<boolean>(themeStore.compactMode);
  const [rounded, setRounded] = useState<RoundedLevel>(themeStore.roundedLevel);
  const [updating, setUpdating] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setUpdating(true);
    try {
      // Synchronize visual preferences directly
      themeStore.setTheme(selectedTheme);
      themeStore.setAccentColor(accent);
      themeStore.setSidebarStyle(sidebar);
      themeStore.setCompactMode(compact);
      themeStore.setRoundedLevel(rounded);

      // Sync with Supabase / local mock profile
      const fallbackTheme = selectedTheme === 'system' ? 'light' : selectedTheme;
      await updateProfile(displayName, fallbackTheme as 'light' | 'dark');
      toast.success('Workspace preferences updated successfully');
      useActivityStore.getState().addLog(
        'system', 
        `Updated workspace preferences (theme: ${selectedTheme}, accent: ${accent}, compact: ${compact})`
      );
    } catch {
      toast.error('Failed to update workspace settings');
    } finally {
      setUpdating(false);
    }
  };

  const accentColors: { id: AccentColor; name: string; bg: string; border: string }[] = [
    { id: 'indigo', name: 'Indigo Aura', bg: 'bg-[#6366f1]', border: 'border-[#6366f1]' },
    { id: 'blue', name: 'Ocean Breeze', bg: 'bg-[#3b82f6]', border: 'border-[#3b82f6]' },
    { id: 'purple', name: 'Royal Violet', bg: 'bg-[#a855f7]', border: 'border-[#a855f7]' },
    { id: 'green', name: 'Forest Mint', bg: 'bg-[#22c55e]', border: 'border-[#22c55e]' },
    { id: 'orange', name: 'Sunset Glow', bg: 'bg-[#f97316]', border: 'border-[#f97316]' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl select-none">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Workspace Settings
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Personalize visual themes, layout grids, high-density compact settings, and cloud synchronization parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: User Quick Profile card */}
        <div className="glass-panel rounded-3xl p-5 bg-white dark:bg-slate-900/30 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-500 flex items-center justify-center border border-brand-100/30 dark:border-brand-900/20 shadow-inner">
            <User className="h-8 w-8" />
          </div>
          
          <div className="flex flex-col overflow-hidden w-full">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {user?.name || 'User'}
            </span>
            <span className="text-xxs text-slate-400 truncate mt-0.5">
              {user?.email}
            </span>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800/40 w-full" />

          {/* Account status badges */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase px-1">
              <span>Authority</span>
              <span className="text-slate-700 dark:text-slate-300">Google Auth</span>
            </div>
            <div className="flex items-center justify-between text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase px-1">
              <span>Joined</span>
              <span className="text-slate-700 dark:text-slate-300">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'May 2026'}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs transition-all cursor-pointer mt-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out of Space</span>
          </button>
        </div>

        {/* Right Side: Visual Theming Fields Form */}
        <div className="flex flex-col gap-6 md:col-span-2">
          
          <form onSubmit={handleSaveProfile} className="glass-panel rounded-3xl p-6 flex flex-col gap-6 bg-white dark:bg-slate-900/30">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/40 pb-3">
              <Settings className="h-4.5 w-4.5 text-brand-500" />
              <span>Workspace Parameters</span>
            </h3>

            {/* Display Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Display Username
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 dark:text-white"
              />
            </div>

            {/* Visual Theme Panel (System / Light / Dark) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Visual Aesthetic
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Light Theme Panel */}
                <button
                  type="button"
                  onClick={() => setSelectedTheme('light')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center select-none cursor-pointer relative overflow-hidden",
                    selectedTheme === 'light'
                      ? "bg-slate-50/50 border-brand-500 text-slate-800"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Sun className={cn("h-4.5 w-4.5", selectedTheme === 'light' ? "text-brand-500" : "text-slate-400")} />
                  <span className="text-[10px] font-bold">Light Mode</span>
                </button>

                {/* Dark Theme Panel */}
                <button
                  type="button"
                  onClick={() => setSelectedTheme('dark')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center select-none cursor-pointer relative overflow-hidden",
                    selectedTheme === 'dark'
                      ? "bg-slate-950/20 dark:bg-slate-900/20 border-brand-500 dark:border-brand-400 text-slate-200"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  <Moon className={cn("h-4.5 w-4.5", selectedTheme === 'dark' ? "text-brand-500" : "text-slate-400")} />
                  <span className="text-[10px] font-bold">Midnight Dark</span>
                </button>

                {/* System Default Panel */}
                <button
                  type="button"
                  onClick={() => setSelectedTheme('system')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center select-none cursor-pointer relative overflow-hidden",
                    selectedTheme === 'system'
                      ? "bg-slate-50/50 border-brand-500 text-slate-800 dark:text-slate-200"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  <Monitor className={cn("h-4.5 w-4.5", selectedTheme === 'system' ? "text-brand-500" : "text-slate-400")} />
                  <span className="text-[10px] font-bold">System Default</span>
                </button>
              </div>
            </div>

            {/* Accent Color Chooser */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Accent Colorway
                </label>
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                  {accentColors.find(a => a.id === accent)?.name}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/30">
                <Palette className="h-4.5 w-4.5 text-slate-400 mr-1 shrink-0" />
                <div className="flex gap-3.5">
                  {accentColors.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setAccent(color.id)}
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-110 relative ring-offset-2 dark:ring-offset-slate-950",
                        color.bg,
                        accent === color.id ? "ring-2 ring-brand-500" : ""
                      )}
                    >
                      {accent === color.id && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Skin layout options */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Sidebar Skin Layout
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['glass', 'solid', 'bordered'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSidebar(style as SidebarStyle)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-center select-none cursor-pointer capitalize text-[10px] font-bold",
                      sidebar === style
                        ? "bg-slate-50/50 border-brand-500 text-slate-800 dark:text-slate-200"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4 text-slate-400" />
                    <span>{style} Layout</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing & Borders (Compact & Rounding) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Spacing density compact toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Spacing & Layout Density
                </label>
                <button
                  type="button"
                  onClick={() => setCompact(!compact)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl border transition-all select-none cursor-pointer text-left",
                    compact
                      ? "bg-slate-50/50 border-brand-500 text-slate-800 dark:text-slate-200"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Minimize2 className="h-4 w-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold">Compact Dense Mode</span>
                      <span className="text-[8px] text-slate-400">Maximize visual content density</span>
                    </div>
                  </div>
                  <div className={cn(
                    "w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 shrink-0",
                    compact ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-800"
                  )}>
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm",
                      compact ? "translate-x-3.5" : "translate-x-0"
                    )} />
                  </div>
                </button>
              </div>

              {/* Rounded level sliders */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Corner Rounding Level
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/30 p-1.5 rounded-2xl">
                  {(['none', 'medium', 'large'] as RoundedLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRounded(level)}
                      className={cn(
                        "py-2 rounded-xl transition-all cursor-pointer text-[10px] font-bold uppercase tracking-wider text-center select-none",
                        rounded === level
                          ? "bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-white"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/20">
              <button
                type="submit"
                disabled={updating || loading}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 select-none"
              >
                <Save className="h-4 w-4" />
                <span>{updating ? 'Saving Details...' : 'Save All Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
