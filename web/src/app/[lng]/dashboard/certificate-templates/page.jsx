import { Suspense } from "react";
import CertificateTemplatesPage from "@/features/certificateTemplates/pages/CertificateTemplatesPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <CertificateTemplatesPage />
    </Suspense>
  );
}
