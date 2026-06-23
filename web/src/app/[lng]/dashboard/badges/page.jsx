import { Suspense } from "react";
import BadgesRouter from "@/features/badgesAdmin/pages/BadgesRouter.jsx";

export default function Page() {
  return (
    <Suspense>
      <BadgesRouter />
    </Suspense>
  );
}
