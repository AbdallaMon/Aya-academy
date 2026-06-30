import { Suspense } from "react";
import CertificateDetailPage from "@/features/certificates/pages/CertificateDetailPage.jsx";

// Next 16: route `params` is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <CertificateDetailPage certificateId={id} />
    </Suspense>
  );
}
