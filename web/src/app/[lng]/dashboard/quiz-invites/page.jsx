import { Suspense } from "react";
import QuizInvitesPage from "@/features/quizInvites/pages/QuizInvitesPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <QuizInvitesPage />
    </Suspense>
  );
}
