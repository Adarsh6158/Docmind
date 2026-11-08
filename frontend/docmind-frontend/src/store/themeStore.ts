import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('docmind-theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  const metaTheme = document.querySelectorAll('meta[name="theme-color"]');
  metaTheme.forEach((el) => {
    el.setAttribute('content', theme === 'dark' ? '#0c0c0e' : '#ffffff');
  });
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  applyThemeToDOM(initial);

  return {
    theme: initial,
    setTheme: (theme: Theme) => {
      localStorage.setItem('docmind-theme', theme);
      applyThemeToDOM(theme);
      set({ theme });
    },
    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});

