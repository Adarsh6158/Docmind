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
        'border border-[#e5e5e5] dark:border-white/[0.08] shadow-2xs',
        'bg-[#f5f5f5] hover:bg-[#efefef] text-[#171717] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-[#f4f4f5]',
        'active:scale-[0.96]',
        className
      )}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <Sun className="size-4 text-[#f4f4f5]" strokeWidth={1.75} />
      ) : (
        <Moon className="size-4 text-[#171717]" strokeWidth={1.75} />
      )}
    </button>
  );
};

export default ThemeToggle;
