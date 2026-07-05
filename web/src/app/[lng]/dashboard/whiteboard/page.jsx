import { Suspense } from "react";
import WhiteboardListPage from "@/features/whiteboard/pages/WhiteboardListPage.jsx";

export const metadata = { title: "السبورة التفاعلية | Aya Academy" };

export default function Page() {
  return (
    <Suspense>
      <WhiteboardListPage />
    </Suspense>
  );
}
