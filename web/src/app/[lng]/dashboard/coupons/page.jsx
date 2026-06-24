import { Suspense } from "react";
import CouponsPage from "@/features/coupons/pages/CouponsPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <CouponsPage />
    </Suspense>
  );
}
