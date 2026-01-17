'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { PageTheme } from '@/shared/types/general';

type ThemeCtx = {
  theme: PageTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx | undefined>(undefined);

function getCookieTheme(): PageTheme | undefined {
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
}: {
  children: React.ReactNode;
  defaultTheme?: PageTheme;
}) {
  const [theme, setTheme] = useState<PageTheme>(
    () => getCookieTheme() ?? defaultTheme
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: PageTheme = prev === 'light' ? 'dark' : 'light';
      document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      return next;
    });

    // If your app reads theme on the server (SSR), you likely need a refresh so server components re-render
    window.location.reload();
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
