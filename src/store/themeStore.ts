import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'blue' | 'purple' | 'green' | 'orange';
export type SidebarStyle = 'glass' | 'solid' | 'bordered';
export type RoundedLevel = 'none' | 'medium' | 'large';

interface ThemeState {
  theme: Theme;
  accentColor: AccentColor;
  sidebarStyle: SidebarStyle;
  compactMode: boolean;
  roundedLevel: RoundedLevel;
  
  setTheme: (theme: Theme) => void;
  setAccentColor: (accent: AccentColor) => void;
  setSidebarStyle: (style: SidebarStyle) => void;
  setCompactMode: (compact: boolean) => void;
  setRoundedLevel: (level: RoundedLevel) => void;
  
  applyThemeSettings: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      accentColor: 'indigo',
      sidebarStyle: 'glass',
      compactMode: false,
      roundedLevel: 'medium',

      setTheme: (theme) => {
        set({ theme });
        get().applyThemeSettings();
      },

      setAccentColor: (accentColor) => {
        set({ accentColor });
        get().applyThemeSettings();
      },

      setSidebarStyle: (sidebarStyle) => {
        set({ sidebarStyle });
        get().applyThemeSettings();
      },

      setCompactMode: (compactMode) => {
        set({ compactMode });
        get().applyThemeSettings();
      },

      setRoundedLevel: (roundedLevel) => {
        set({ roundedLevel });
        get().applyThemeSettings();
      },

      applyThemeSettings: () => {
        const { theme, accentColor, sidebarStyle, compactMode, roundedLevel } = get();
        const root = window.document.documentElement;
        
        // 1. Theme Configuration
        let actualTheme = theme;
        if (theme === 'system') {
          actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        if (actualTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        // 2. Attribute bindings
        root.setAttribute('data-accent', accentColor);
        root.setAttribute('data-sidebar', sidebarStyle);
        root.setAttribute('data-rounded', roundedLevel);
        
        // 3. Compact Mode class
        if (compactMode) {
          root.classList.add('compact-mode');
        } else {
          root.classList.remove('compact-mode');
        }
      },
    }),
    {
      name: 'myspace-theme-preferences',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.applyThemeSettings();
        }
      },
    }
  )
);
