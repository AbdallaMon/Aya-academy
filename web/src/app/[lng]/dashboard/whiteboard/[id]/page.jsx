import { Suspense } from "react";
import WhiteboardSessionDetailPage from "@/features/whiteboard/pages/WhiteboardSessionDetailPage.jsx";

// Next 16: route `params` is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <WhiteboardSessionDetailPage sessionId={id} />
    </Suspense>
  );
}
