import { Suspense } from "react";
import BoardLoader from "@/features/whiteboard/board/BoardLoader.jsx";

// Private full-screen whiteboard (admin). Outside the dashboard shell so it fills
// the screen. Next 16: route `params` is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <BoardLoader mode="private" idOrToken={id} />
    </Suspense>
  );
}
