"use client";

// AppProviders — single entry point composing every client-side provider.
//
// Nesting (outer -> inner):
//   I18nProvider          → sets the active language (RTL/LTR) for everything below
//     ThemeRegistry       → RTL-aware emotion cache + MUI theme (reuses buildTheme)
//       LocalizationProvider (dayjs) → MUI date pickers
//         AuthProvider    → hydrates current user from /auth/me
//           {children}
//           AppToastContainer → react-toastify viewport (direction follows lng)
//
// `lng` is passed from the server layout. The visual theme is intentionally a
// single stable Ayah light/green theme; there is no mode cookie or toggle.

import { MotionConfig } from "framer-motion";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import I18nProvider from "./I18nProvider.jsx";
import ThemeRegistry from "../theme/ThemeRegistry.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import { AppToastContainer } from "./ToastProvider.jsx";
import ConfirmProvider from "./ConfirmProvider.jsx";

export default function AppProviders({ children, lng }) {
  return (
    <I18nProvider lng={lng}>
      <ThemeRegistry>
        {/* Honor the OS "reduce motion" setting everywhere: framer-motion
            auto-neutralizes the hero's infinite loops + every whileInView/hover. */}
        <MotionConfig reducedMotion="user">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AuthProvider>
              <ConfirmProvider>
                {children}
                <AppToastContainer />
              </ConfirmProvider>
            </AuthProvider>
          </LocalizationProvider>
        </MotionConfig>
      </ThemeRegistry>
    </I18nProvider>
  );
}
