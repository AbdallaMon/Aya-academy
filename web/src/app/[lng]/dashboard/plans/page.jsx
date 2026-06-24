import { Suspense } from "react";
import PlansPage from "@/features/plans/pages/PlansPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <PlansPage />
    </Suspense>
  );
}
