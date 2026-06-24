import { Suspense } from "react";
import ReportsPage from "@/features/reports/pages/ReportsPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <ReportsPage />
    </Suspense>
  );
}
