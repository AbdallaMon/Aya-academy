"use client";

import Link from "next/link";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { MdArrowBack, MdWorkspacePremium } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { DataTable } from "../../../shared/components/index.js";
import { useGamesAdminText } from "../config/gamesAdminText.js";

/**
 * GameResultsPage — per-game attempts/results for ADMIN.
 *
 * Step 1: resolve slug → full game (id + titles).
 * Step 2: once the game is loaded, render <AttemptsTable> so its paginated
 * `games/${id}/attempts` request binds to the right url.
 */
export default function GameResultsPage({ slug }) {
  const txt = useGamesAdminText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.GAME.VIEW);
  // Admins who can browse certificates get a per-attempt shortcut into the
  // (student + GAME) filtered certificates list.
  const canViewCerts = hasPermission(PERMISSIONS.CERTIFICATE.LIST);

  const { data: game, isLoading } = useRequest({
    url: `games/by-slug/${slug}`,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  if (!canView) return null;

  const backBtn = (
    <Button
      size="small"
      startIcon={<MdArrowBack />}
      component={Link}
      href={localePath(lng, "/dashboard/games")}
    >
      {txt.backToGames}
    </Button>
  );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 3 }}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {txt.resultsTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {game ? (lng === "en" ? game.titleEn : game.titleAr) : ""}
          </Typography>
        </Box>
        {backBtn}
      </Stack>

      {!game ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          {isLoading ? txt.loading : txt.gameNotFound}
        </Typography>
      ) : (
        <AttemptsTable
          gameId={game.id}
          txt={txt}
          lng={lng}
          canViewCerts={canViewCerts}
        />
      )}
    </Box>
  );
}

function AttemptsTable({ gameId, txt, lng, canViewCerts }) {
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
    url: `games/${gameId}/attempts`,
    method: "get",
    isPaginated: true,
    autoFetch: true,
    syncToUrl: false,
  });

  const rows = data || [];
  const passedCount = rows.filter((r) => r.passed).length;

  const columns = [
    {
      field: "student",
      headerName: txt.student,
      width: 200,
      renderCell: ({ row }) => (
        <Stack>
          <Typography fontWeight={600}>
            {row.student?.name || `#${row.studentId}`}
          </Typography>
          {row.student?.nickname && (
            <Typography variant="caption" color="text.secondary">
              {row.student.nickname}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: "score",
      headerName: txt.score,
      width: 100,
      renderCell: ({ row }) =>
        row.totalQuestions
          ? `${Math.round((row.correctCount / row.totalQuestions) * 100)}%`
          : "—",
    },
    {
      field: "correct",
      headerName: txt.correct,
      width: 120,
      renderCell: ({ row }) => `${row.correctCount}/${row.totalQuestions}`,
    },
    {
      field: "passed",
      headerName: txt.passed,
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={row.passed ? "success" : "default"}
          label={row.passed ? `✓ ${txt.pass}` : txt.fail}
        />
      ),
    },
    {
      field: "date",
      headerName: txt.date,
      width: 130,
      renderCell: ({ row }) =>
        new Date(row.completedAt || row.createdAt).toLocaleDateString(),
    },
  ];

  // The attempts API doesn't expose a certificate id, so for each passed
  // attempt we deep-link into the certificates list pre-filtered by the
  // student + GAME type (CertificatesPage reads ?studentId & ?type).
  if (canViewCerts) {
    columns.push({
      field: "certificate",
      headerName: txt.certificate,
      width: 150,
      renderCell: ({ row }) =>
        row.passed ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<MdWorkspacePremium />}
            component={Link}
            href={localePath(
              lng,
              `/dashboard/certificates?studentId=${row.studentId}&type=GAME`,
            )}
          >
            {txt.certificate}
          </Button>
        ) : null,
    });
  }

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip color="primary" label={`${txt.totalAttempts}: ${total ?? 0}`} />
        <Chip color="success" label={`${txt.passedCount}: ${passedCount}`} />
      </Stack>

      <DataTable
        initialRows={rows}
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
