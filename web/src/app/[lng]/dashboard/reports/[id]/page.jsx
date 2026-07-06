import { notFound } from "next/navigation";

// Reports are temporarily disabled in the dashboard (kept in the backend + feature
// components). To restore, uncomment the block below and remove the notFound() stub.

// import { Suspense } from "react";
// import ReportDetailPage from "@/features/reports/pages/ReportDetailPage.jsx";
//
// // Next 16: route `params` is async.
// export default async function Page({ params }) {
//   const { id } = await params;
//   return (
//     <Suspense>
//       <ReportDetailPage reportId={id} />
//     </Suspense>
//   );
// }

export default function Page() {
  notFound();
}
