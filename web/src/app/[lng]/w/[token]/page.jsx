import { Suspense } from "react";
import BoardLoader from "@/features/whiteboard/board/BoardLoader.jsx";
import { buildMetadata } from '@/shared/lib/seo';

export async function generateMetadata({ params }) {
  const { lng, token } = await params;
  return buildMetadata({ lng, path: `/w/${token}`, index: false });
}

// Public token whiteboard — opens without login. Next 16: route `params` is async.
export default async function Page({ params }) {
  const { token } = await params;
  return (
    <Suspense>
      <BoardLoader mode="public" idOrToken={token} />
    </Suspense>
  );
}
