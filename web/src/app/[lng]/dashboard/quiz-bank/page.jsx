import { Suspense } from "react";
import QuizBankPage from "@/features/quizBank/pages/QuizBankPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <QuizBankPage />
    </Suspense>
  );
}
