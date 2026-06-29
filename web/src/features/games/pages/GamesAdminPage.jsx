"use client";

import { useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import {
  MdGroupAdd,
  MdBarChart,
  MdPlayArrow,
  MdStar,
  MdMilitaryTech,
} from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { DataTable, RowActionsMenu, useConfirm } from "../../../shared/components/index.js";
import { useGamesAdminText } from "../config/gamesAdminText.js";
import GameAssignDialog from "../components/GameAssignDialog.jsx";
import GameBadgeDialog from "../components/GameBadgeDialog.jsx";

const GAME_TYPES = ["INTERACTIVE", "QUIZ", "STORY"];

export default function GamesAdminPage() {
  const txt = useGamesAdminText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.GAME.LIST);
  const canAssign = hasPermission(PERMISSIONS.GAME.ASSIGN);
  const canViewResults = hasPermission(PERMISSIONS.GAME.VIEW);
  const canManage = hasPermission(PERMISSIONS.GAME.MANAGE);
  const confirm = useConfirm();

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
    triggerRefetch,
  } = useRequest({
    url: "games",
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  // Set-as-free mutation (POST games/:id/free). Refetch the list so the chips
  // reflect the new free game + its now-public/active state.
  const freeMut = useMultiRequest({
    url: "games",
    onSuccess: () => triggerRefetch(),
  });

  const assignDialog = useOpen();
  const badgeDialog = useOpen();
  const [selected, setSelected] = useState(null);

  function onAssign(row) {
    setSelected(row);
    assignDialog.open();
  }

  function onLinkBadge(row) {
    setSelected(row);
    badgeDialog.open();
  }

  async function onSetFree(row) {
    const confirmed = await confirm({ title: txt.setFreeConfirm });
    if (!confirmed) return;
    await freeMut.postRequest(`${row.id}/free`);
  }

  const columns = useMemo(
    () => [
      {
        field: "title",
        headerName: txt.title,
        width: 240,
        renderCell: ({ row }) => (
          <Stack>
            <Typography fontWeight={700}>
              {lng === "en" ? row.titleEn : row.titleAr}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lng === "en" ? row.titleAr : row.titleEn}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "type",
        headerName: txt.type,
        width: 130,
        renderCell: ({ row }) => (
          <Chip size="small" label={txt[row.type] || row.type} />
        ),
      },
      {
        field: "isPublic",
        headerName: txt.visibility,
        width: 110,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={row.isPublic ? "info" : "default"}
            label={row.isPublic ? txt.public : txt.private}
          />
        ),
      },
      {
        field: "isActive",
        headerName: txt.active,
        width: 110,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={row.isActive ? "success" : "default"}
            label={row.isActive ? txt.active : txt.inactive}
          />
        ),
      },
      {
        field: "isFree",
        headerName: txt.freeGame,
        width: 180,
        renderCell: ({ row }) =>
          row.isFree ? (
            <Chip
              size="small"
              color="warning"
              icon={<MdStar />}
              label={txt.freeGameChip}
            />
          ) : canManage ? (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<MdStar />}
              disabled={freeMut.isPostRequestLoading}
              onClick={() => onSetFree(row)}
            >
              {txt.setFree}
            </Button>
          ) : (
            <Typography variant="caption" color="text.secondary">
              —
            </Typography>
          ),
      },
      {
        field: "passThreshold",
        headerName: txt.passThreshold,
        width: 110,
        renderCell: ({ row }) =>
          row.passThreshold != null ? `${row.passThreshold} ✓` : "—",
      },
      {
        field: "badge",
        headerName: txt.badge,
        width: 170,
        renderCell: ({ row }) =>
          row.badge ? (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              icon={<MdMilitaryTech />}
              label={`${row.badge.emoji ? `${row.badge.emoji} ` : ""}${
                lng === "en" ? row.badge.nameEn : row.badge.nameAr
              }`}
            />
          ) : canManage ? (
            <Button
              size="small"
              variant="text"
              color="warning"
              startIcon={<MdMilitaryTech />}
              onClick={() => onLinkBadge(row)}
            >
              {txt.linkBadge}
            </Button>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {txt.noBadge}
            </Typography>
          ),
      },
      {
        field: "actions",
        type: "actions",
        headerName: txt.actions,
        width: 80,
        renderCell: ({ row }) => (
          <RowActionsMenu
            actions={[
              {
                label: txt.assign,
                icon: <MdGroupAdd />,
                onClick: () => onAssign(row),
                hidden: !canAssign,
              },
              {
                label: txt.linkBadge,
                icon: <MdMilitaryTech />,
                onClick: () => onLinkBadge(row),
                hidden: !canManage,
              },
              {
                label: txt.results,
                icon: <MdBarChart />,
                href: localePath(lng, `/dashboard/games/${row.slug}/results`),
                hidden: !canViewResults,
              },
              {
                label: txt.preview,
                icon: <MdPlayArrow />,
                href: localePath(lng, `/dashboard/games/${row.slug}`),
              },
            ]}
          />
        ),
      },
    ],
    [txt, lng, canAssign, canViewResults, canManage, freeMut.isPostRequestLoading],
  );

  const filterConfig = useMemo(
    () => [
      { type: "search", key: "search", label: txt.title },
      {
        type: "enum",
        key: "type",
        label: txt.type,
        options: GAME_TYPES.reduce(
          (acc, ty) => ({ ...acc, [ty]: txt[ty] }),
          {},
        ),
      },
      {
        type: "enum",
        key: "isPublic",
        label: txt.visibility,
        options: { true: txt.public, false: txt.private },
      },
    ],
    [txt],
  );

  if (!canList) return null;

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
            {txt.pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.pageDescription}
          </Typography>
        </Box>
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
        filterConfig={filterConfig}
        noContainer
      />

      {assignDialog.isOpen && selected && (
        <GameAssignDialog
          key={selected.id}
          open={assignDialog.isOpen}
          onClose={assignDialog.close}
          game={selected}
          txt={txt}
        />
      )}

      {badgeDialog.isOpen && selected && (
        <GameBadgeDialog
          key={selected.id}
          open={badgeDialog.isOpen}
          onClose={badgeDialog.close}
          game={selected}
          txt={txt}
          onChanged={triggerRefetch}
        />
      )}
    </Box>
  );
}
