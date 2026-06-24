"use client";

import { useMemo } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { MdCardGiftcard } from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { DataTable } from "../../../shared/components/index.js";
import { QUIZZES_URL, formatDate } from "../config/constant.js";
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

  const columns = useMemo(() => {
    const cols = [
      {
        field: "title",
        headerName: txt.title,
        width: 280,
        renderCell: ({ row }) => (
          <Typography fontWeight={700}>{row.title || txt.noTitle}</Typography>
        ),
      },
      {
        field: "questions",
        headerName: txt.questions,
        width: 110,
        renderCell: ({ row }) => (
          <Chip size="small" label={row._count?.items ?? 0} />
        ),
      },
      {
        field: "passThreshold",
        headerName: txt.passThreshold,
        width: 120,
        renderCell: ({ row }) => row.passThreshold ?? "—",
      },
      {
        field: "gift",
        headerName: txt.gift,
        width: 180,
        renderCell: ({ row }) =>
          row.giftName ? (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MdCardGiftcard />
              <Typography variant="body2">{row.giftName}</Typography>
            </Stack>
          ) : (
            txt.noGift
          ),
      },
      {
        field: "createdAt",
        headerName: txt.createdAt,
        width: 150,
        renderCell: ({ row }) => formatDate(row.createdAt, lng),
      },
    ];

    // Participant count is meaningful for admin/parent (who own/oversee quizzes),
    // but redundant for a student looking at their own quizzes.
    if (!isStudent) {
      cols.splice(2, 0, {
        field: "participants",
        headerName: txt.participants,
        width: 120,
        renderCell: ({ row }) => (
          <Chip size="small" variant="outlined" label={row._count?.participants ?? 0} />
        ),
      });
    }
    return cols;
  }, [txt, lng, isStudent]);

  if (!canSee) return null;

  return (
    <Box>
      <Stack sx={{ mb: 3 }} gap={0.5}>
        <Typography variant="h4" fontWeight={800}>
          {txt.pageTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>

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
        noContainer
      />
    </Box>
  );
}
