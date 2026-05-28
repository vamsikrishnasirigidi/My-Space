import type { Theme } from '../store/themeStore';

const THEME_STORAGE_KEY = 'myspace-theme-preferences';

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/** Read persisted theme preference before React hydrates (avoids circular imports). */
export function getPersistedProfileTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return 'light';
    const parsed = JSON.parse(raw) as { state?: { theme?: Theme } };
    const theme = parsed.state?.theme;
    if (!theme) return 'light';
    return resolveTheme(theme);
  } catch {
    return 'light';
  }
}

export function applyThemeClass(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
