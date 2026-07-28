"use client";

import { MotionConfig } from "framer-motion";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Heavy dashboard-only providers must not inflate the public homepage bundle.
// Date pickers are currently used only by dashboard quiz-invite forms.
export default function DashboardProviders({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {children}
      </LocalizationProvider>
    </MotionConfig>
  );
}
