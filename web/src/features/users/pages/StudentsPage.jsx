"use client";

import UsersPage from "./UsersPage.jsx";

/**
 * Focused list of STUDENT accounts. Reuses the full users list infrastructure
 * but locks the role filter to STUDENT (always sent to the API, dropdown hidden).
 */
export default function StudentsPage() {
  return (
    <UsersPage
      lockedRole="STUDENT"
      titleKey="studentsTitle"
      descriptionKey="studentsDescription"
    />
  );
}
