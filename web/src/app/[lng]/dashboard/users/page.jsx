import { Suspense } from "react";
import UsersPage from "@/features/users/pages/UsersPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <UsersPage />
    </Suspense>
  );
}
