import { notFound } from "next/navigation";

// Reports are temporarily disabled in the dashboard (kept in the backend + feature
// components). To restore, uncomment the block below and remove the notFound() stub.

// import { Suspense } from "react";
// import ReportsPage from "@/features/reports/pages/ReportsPage.jsx";
//
// export default function Page() {
//   return (
//     <Suspense>
//       <ReportsPage />
//     </Suspense>
//   );
// }

export default function Page() {
  notFound();
}
