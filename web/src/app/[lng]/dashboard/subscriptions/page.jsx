import { Suspense } from "react";
import SubscriptionsPage from "@/features/subscriptions/pages/SubscriptionsPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <SubscriptionsPage />
    </Suspense>
  );
}
