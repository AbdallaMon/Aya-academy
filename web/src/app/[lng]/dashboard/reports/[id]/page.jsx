import { Suspense } from "react";
import ReportDetailPage from "@/features/reports/pages/ReportDetailPage.jsx";

// Next 16: route `params` is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <ReportDetailPage reportId={id} />
    </Suspense>
  );
}
