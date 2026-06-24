import { Suspense } from "react";
import ChildrenPage from "@/features/children/pages/ChildrenPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <ChildrenPage />
    </Suspense>
  );
}
