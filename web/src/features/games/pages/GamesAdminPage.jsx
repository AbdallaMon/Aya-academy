"use client";

import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  PageHeader,
  useConfirm,
} from "../../../shared/components/index.js";
import { useGamesAdminText } from "../config/gamesAdminText.js";
import { buildGamesColumns } from "../config/gamesColumns.js";
import { buildGamesFilters } from "../config/gamesFilters.js";
import GameAssignDialog from "../components/GameAssignDialog.jsx";
import GameBadgeDialog from "../components/GameBadgeDialog.jsx";

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
    () =>
      buildGamesColumns({
        txt,
        lng,
        can: {
          assign: canAssign,
          viewResults: canViewResults,
          manage: canManage,
        },
        actions: { onAssign, onLinkBadge, onSetFree },
        freeLoading: freeMut.isPostRequestLoading,
      }),
    [txt, lng, canAssign, canViewResults, canManage, freeMut.isPostRequestLoading],
  );

  const filterConfig = useMemo(() => buildGamesFilters({ txt }), [txt]);

  if (!canList) return null;

  return (
    <Box>
      <PageHeader title={txt.pageTitle} description={txt.pageDescription} />

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
