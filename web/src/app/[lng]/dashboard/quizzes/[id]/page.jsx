import { Suspense } from 'react';
import QuizTakePage from '@/features/quizTake/pages/QuizTakePage.jsx';

// Take-quiz (student) / quiz-details (admin/parent). Next 16: route `params` is async.
export default async function Page({ params }) {
  const { id } = await params;
  return;

  return (
    <Suspense>
      <QuizTakePage quizId={id} />
    </Suspense>
  );
}
