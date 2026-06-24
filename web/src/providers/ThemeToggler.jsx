'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

const ThemeContext = createContext(undefined);

function getCookieTheme() {
  if (typeof document === 'undefined') return undefined;

  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith('theme='))
    ?.split('=')[1];

  if (raw === 'light' || raw === 'dark') return raw;
  return undefined;
}

export default function ThemeTogglerProvider({
  children,
  defaultTheme = 'light',
}) {
  const [theme, setTheme] = useState(
    () => getCookieTheme() ?? defaultTheme
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      // Persist for SSR first-paint; ThemeRegistry reads this context live so the
      // whole UI updates instantly — no reload needed.
      document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      return next;
    });
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeToggler() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error('useThemeToggler must be used within ThemeTogglerProvider');
  return ctx;
}
