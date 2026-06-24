import { Suspense } from "react";
import QuizzesPage from "@/features/quizzes/pages/QuizzesPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <QuizzesPage />
    </Suspense>
  );
}
