"use client";

// AppProviders — single entry point composing every client-side provider.
//
// Nesting (outer -> inner):
//   I18nProvider          → sets the active language (RTL/LTR) for everything below
//     ThemeRegistry       → RTL-aware emotion cache + MUI theme (reuses buildTheme)
//       AuthProvider      → hydrates current user when a session may exist
//         {children}
//         ToastViewport   → loaded after first paint; its CSS is not render-blocking
//
// `lng` is passed from the server layout. The visual theme is intentionally a
// single stable Ayah light/green theme; there is no mode cookie or toggle.

import dynamic from "next/dynamic";
import I18nProvider from "./I18nProvider.jsx";
import ThemeRegistry from "../theme/ThemeRegistry.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import ConfirmProvider from "./ConfirmProvider.jsx";

const ToastViewport = dynamic(() => import("./ToastViewport.jsx"), {
  ssr: false,
});

export default function AppProviders({ children, lng }) {
  return (
    <I18nProvider lng={lng}>
      <ThemeRegistry>
        <AuthProvider>
          <ConfirmProvider>
            {children}
            <ToastViewport />
          </ConfirmProvider>
        </AuthProvider>
      </ThemeRegistry>
    </I18nProvider>
  );
}
