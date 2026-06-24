import { Suspense } from "react";
import QuizBuildPage from "@/features/quizBuild/pages/QuizBuildPage.jsx";

// Parent builds a quiz from an invite token. Next 16: route `params` is async.
export default async function Page({ params }) {
  const { token } = await params;
  return (
    <Suspense>
      <QuizBuildPage token={token} />
    </Suspense>
  );
}
