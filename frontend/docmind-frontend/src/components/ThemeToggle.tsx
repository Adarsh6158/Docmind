import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { cn } from '../lib/utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'size-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer select-none',
        'border border-zinc-200 dark:border-white/[0.08]',
        'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300',
        'active:scale-[0.96]',
        className
      )}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <Sun className="size-4 text-zinc-300" strokeWidth={1.75} />
      ) : (
        <Moon className="size-4 text-zinc-700" strokeWidth={1.75} />
      )}
    </button>
  );
};

export default ThemeToggle;

