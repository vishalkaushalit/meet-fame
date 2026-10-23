import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getTheme, setTheme } from '@shared/theme.js';
export default function ThemeToggle() {
  const [theme, updateTheme] = useState(getTheme);
  useEffect(() => {
    const sync = () => {
      return updateTheme(getTheme());
    };
    window.addEventListener('meetfame-theme-change', sync);
    return () => {
      return window.removeEventListener('meetfame-theme-change', sync);
    };
  }, []);
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
  return (
    <button
      type="button"
      className="theme-toggle"
      title={label}
      aria-label={label}
      onClick={() => {
        return setTheme(theme === 'dark' ? 'light' : 'dark');
      }}
    >
      {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
