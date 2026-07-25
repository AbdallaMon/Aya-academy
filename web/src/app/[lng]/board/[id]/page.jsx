import { Suspense } from "react";
import BoardLoader from "@/features/whiteboard/board/BoardLoader.jsx";
import { buildMetadata } from '@/shared/lib/seo';

export async function generateMetadata({ params }) {
  const { lng, id } = await params;
  return buildMetadata({ lng, path: `/board/${id}`, index: false });
}

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
