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
// `lng` and `mode` are passed from the server layout (cookie-derived) so the
// first paint matches the user's saved preference and avoids a flash.

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import I18nProvider from "./I18nProvider.jsx";
import ThemeRegistry from "../theme/ThemeRegistry.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import { AppToastContainer } from "./ToastProvider.jsx";
import ConfirmProvider from "./ConfirmProvider.jsx";

export default function AppProviders({ children, lng, mode }) {
  return (
    <I18nProvider lng={lng}>
      <ThemeRegistry mode={mode}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <ConfirmProvider>
              {children}
              <AppToastContainer />
            </ConfirmProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeRegistry>
    </I18nProvider>
  );
}
