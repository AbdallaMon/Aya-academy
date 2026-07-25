// Pass-through root layout. The real layout — <html lang dir>, fonts, global
// providers (AppProviders) and the locale chrome — lives in
// app/[lng]/layout.jsx, because <html dir> depends on the active locale.
// Keeping html/body/providers/navbar here too would render them twice.
export default function RootLayout({ children }) {
  return children;
}
