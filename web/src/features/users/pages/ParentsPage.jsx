"use client";

import UsersPage from "./UsersPage.jsx";

/**
 * Focused list of PARENT accounts. Reuses the full users list infrastructure
 * but locks the role filter to PARENT (always sent to the API, dropdown hidden).
 */
export default function ParentsPage() {
  return (
    <UsersPage
      lockedRole="PARENT"
      titleKey="parentsTitle"
      descriptionKey="parentsDescription"
    />
  );
}
