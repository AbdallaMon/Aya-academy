import { Suspense } from "react";
import SettingsPage from "@/features/settings/pages/SettingsPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  );
}
