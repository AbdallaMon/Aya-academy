import { Suspense } from "react";
import UserDetailPage from "@/features/userDetail/pages/UserDetailPage.jsx";

// Next 16: route `params` is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <UserDetailPage userId={id} />
    </Suspense>
  );
}
