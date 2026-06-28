import { Suspense } from "react";
import SubscriptionDetailPage from "@/features/subscriptionDetail/pages/SubscriptionDetailPage.jsx";

// Next 16: route `params` is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <SubscriptionDetailPage subscriptionId={id} />
    </Suspense>
  );
}
