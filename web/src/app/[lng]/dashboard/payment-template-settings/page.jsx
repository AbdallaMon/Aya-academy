import { Suspense } from "react";
import PaymentTemplateSettingsPage from "@/features/paymentTemplate/pages/PaymentTemplateSettingsPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <PaymentTemplateSettingsPage />
    </Suspense>
  );
}
