import { Suspense } from "react";
import InvoiceDetailPage from "@/features/invoices/pages/InvoiceDetailPage.jsx";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <InvoiceDetailPage invoiceId={id} />
    </Suspense>
  );
}
