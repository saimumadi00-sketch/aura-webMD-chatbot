import React from 'react';
import { Moon, Sun } from 'lucide-react';

// The parent owns the saved preference so every route uses the same mode.
export default function ThemeToggle({ theme, onToggleTheme }) {
  const dark = theme !== 'light';
  return <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
    {dark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    <span>{dark ? 'Light mode' : 'Dark mode'}</span>
  </button>;
}
