'use client';

// ThemeRegistry — wires the RTL-aware emotion cache + MUI theme for the App
// Router. Direction follows the active i18n language (Arabic => RTL). The
// Palette is REUSED from the existing buildTheme factory. Ayah intentionally uses
// one stable light/green visual theme; only locale direction can change.

import { useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

import { buildTheme } from '../providers/MUITheme';
import { useTranslation } from '../i18n/client.js';
import { getDirection } from '../i18n/settings.js';

export default function ThemeRegistry({ children }) {
  const { lng } = useTranslation();
  const direction = getDirection(lng);

  const theme = useMemo(
    () => buildTheme({ direction }),
    [direction]
  );

  // Emotion cache options handed to AppRouterCacheProvider. RTL gets the
  // stylis-rtl plugin so MUI's styles are flipped for Arabic.
  const cacheOptions = useMemo(
    () =>
      direction === 'rtl'
        ? { key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] }
        : { key: 'mui' },
    [direction]
  );

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', lng);
  }, [direction, lng]);

  return (
    <AppRouterCacheProvider key={lng} options={cacheOptions}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
