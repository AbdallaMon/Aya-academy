import { Suspense } from "react";
import StudentsPage from "@/features/users/pages/StudentsPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <StudentsPage />
    </Suspense>
  );
}
