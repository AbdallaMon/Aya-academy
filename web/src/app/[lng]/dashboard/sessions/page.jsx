import { Suspense } from "react";
import SessionsPage from "@/features/sessions/pages/SessionsPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <SessionsPage />
    </Suspense>
  );
}
