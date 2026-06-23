import { Suspense } from "react";
import ParentsPage from "@/features/users/pages/ParentsPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <ParentsPage />
    </Suspense>
  );
}
