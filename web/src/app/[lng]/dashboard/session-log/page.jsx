import { Suspense } from "react";
import SessionLogPage from "@/features/sessionLog/pages/SessionLogPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <SessionLogPage />
    </Suspense>
  );
}
