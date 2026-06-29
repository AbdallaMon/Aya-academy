"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { DataTable, PageHeader } from "../../../shared/components/index.js";
import { QUIZZES_URL, MY_STUDENTS_URL } from "../config/constant.js";
import { buildQuizzesColumns } from "../config/quizzesColumns.js";
import { buildQuizzesFilters } from "../config/quizzesFilters.js";
import { useQuizzesText } from "../config/quizzesText.js";

export default function QuizzesPage() {
  const txt = useQuizzesText();
  const { lng } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Admin gets QUIZ.LIST; students/parents reach the list via VIEW/ATTEMPT.
  const canSee =
    hasPermission(PERMISSIONS.QUIZ.LIST) ||
    hasPermission(PERMISSIONS.QUIZ.VIEW) ||
    hasPermission(PERMISSIONS.QUIZ.ATTEMPT);

  const role = user?.role;
  const isStudent = role === USER_ROLES.STUDENT;
  const isAdmin = role === USER_ROLES.ADMIN;
  const isParent = role === USER_ROLES.PARENT;

  const description = useMemo(() => {
    if (isAdmin) return txt.descAdmin;
    if (role === USER_ROLES.PARENT) return txt.descParent;
    if (isStudent) return txt.descStudent;
    return txt.descDefault;
  }, [txt, isAdmin, isStudent, role]);

  const {
    data,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    filters,
    setFilters,
  } = useRequest({
    url: QUIZZES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canSee,
  });

  // Parent-only "أطفالي" child filter source. Admin is skipped (a dropdown over
  // ALL students is impractical); students don't need it. If the endpoint returns
  // nothing, the filter simply isn't rendered.
  const { data: childrenData } = useRequest({
    url: MY_STUDENTS_URL,
    method: "get",
    autoFetch: isParent && canSee,
    syncToUrl: false,
  });
  const children = useMemo(
    () => (isParent && Array.isArray(childrenData) ? childrenData : []),
    [isParent, childrenData],
  );

  // Base path for the take-quiz / details route, locale-prefixed.
  const backLinkBase = localePath(lng, "/dashboard/quizzes");

  const columns = useMemo(
    () => buildQuizzesColumns({ txt, lng, isStudent, backLinkBase }),
    [txt, lng, isStudent, backLinkBase],
  );

  const filterConfig = useMemo(
    () => buildQuizzesFilters(txt, children),
    [txt, children],
  );

  if (!canSee) return null;

  return (
    <Box>
      <PageHeader title={txt.pageTitle} description={description} />

      <DataTable
        initialRows={data || []}
        columns={columns}
        total={total}
        page={page}
        rowsPerPage={pageSize}
        setPage={setPage}
        setRowsPerPage={setPageSize}
        loading={isLoading}
        filters={filters}
        setFilters={setFilters}
        filterConfig={filterConfig}
        noContainer
      />
    </Box>
  );
}
