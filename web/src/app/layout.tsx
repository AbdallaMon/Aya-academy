import type { ReactNode } from 'react';

// Pass-through root layout. The real layout — <html lang dir>, fonts, global
// providers (ThemeToggler + AppProviders) and the locale chrome — lives in
// app/[lng]/layout.jsx, because <html dir> depends on the active locale.
// Keeping html/body/providers/navbar here too would render them twice.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
