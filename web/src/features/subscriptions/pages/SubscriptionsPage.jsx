"use client";

import { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { MdAdd } from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { PageHeader } from "../../../shared/components/index.js";
import FilterBar from "../../../shared/components/tables/FilterBar.jsx";
import DataTablePagination from "../../../shared/components/tables/dataTable/DataTablePagination.jsx";
import { SUBSCRIPTIONS_URL } from "../config/constant.js";
import { useSubscriptionsText } from "../config/subscriptionsText.js";
import { buildSubscriptionsFilters } from "../config/subscriptionsFilters.js";
import SubscriptionCreateDialog from "../components/SubscriptionCreateDialog.jsx";
import SubscriptionSummaryCard from "../components/SubscriptionSummaryCard.jsx";
import SubscriptionCard from "../components/SubscriptionCard.jsx";

/**
 * Subscriptions list — CARDS ONLY. Standalone at /dashboard/subscriptions, and
 * ALSO embedded (with `studentId` + `embedded`) inside a user's detail page so the
 * user-scoped tab is the same card grid + the same per-card action menu for admin
 * and parent alike — only filtered to that student.
 *
 * The list endpoint returns TWO shapes (V2-5): globally (no studentId) it returns
 * one summary per student `{ studentId, current, next }` → a grid of combined
 * SubscriptionSummaryCards. Scoped to a student it returns RAW subscription rows →
 * a grid of single-subscription SubscriptionCards. Each card owns its ⋮ overflow
 * menu (SubscriptionActions) for every state-permitted action, so there is no
 * bespoke row-action wiring here — only the Create dialog.
 */
export default function SubscriptionsPage({
  studentId = null,
  studentName = null,
  embedded = false,
}) {
  const txt = useSubscriptionsText();
  const { lng, t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.SUBSCRIPTION.LIST);
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const canCreate = hasPermission(PERMISSIONS.SUBSCRIPTION.CREATE) || isAdmin;

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
    url: SUBSCRIPTIONS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
    // Embedded in a user's detail tab: lock the list to that student and keep the
    // filter out of the URL (the tab already owns ?tab=subscriptions).
    syncToUrl: !embedded,
    initialParams: studentId ? { studentId: Number(studentId) } : undefined,
  });

  const mut = useMultiRequest({
    url: SUBSCRIPTIONS_URL,
    onSuccess: () => triggerRefetch(),
  });

  const createDialog = useOpen();

  async function create(payload) {
    await mut.postRequest(null, payload);
    createDialog.close();
  }

  const description = isAdmin
    ? txt.pageDescriptionAdmin
    : user?.role === USER_ROLES.PARENT
      ? txt.pageDescriptionParent
      : txt.pageDescriptionStudent;

  const filterConfig = useMemo(
    () =>
      embedded
        ? []
        : buildSubscriptionsFilters({
            txt,
            includeParents: isAdmin,
          }),
    [embedded, txt, isAdmin],
  );

  // Detect the payload shape: summary rows are objects WITHOUT `id` that carry
  // `current`/`next`; raw subscription rows have an `id`. When there are no rows,
  // fall back to whether a studentId scope is active (prop OR ?studentId= filter).
  const rows = data || [];
  const studentScoped = Boolean(studentId) || Boolean(filters?.studentId);
  const showSummaryCards =
    rows.length > 0
      ? Boolean(
          rows[0] &&
            typeof rows[0] === "object" &&
            !("id" in rows[0]) &&
            ("current" in rows[0] || "next" in rows[0]),
        )
      : !studentScoped;
  const td = t("tableData", { returnObjects: true }) || {};

  if (!canList) return null;

  return (
    <Box>
      {embedded ? (
        canCreate && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={createDialog.open}
            >
              {txt.create}
            </Button>
          </Stack>
        )
      ) : (
        <PageHeader
          title={txt.pageTitle}
          description={description}
          createLabel={txt.create}
          onCreate={canCreate ? createDialog.open : undefined}
        />
      )}

      <Paper sx={{ width: "100%", mb: 2, position: "relative" }}>
        <FilterBar
          filterConfig={filterConfig}
          filters={filters || {}}
          setFilters={setFilters}
          translator={txt}
        />

        {isLoading && rows.length === 0 ? (
          <Stack alignItems="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : rows.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 8 }}
          >
            {txt.empty}
          </Typography>
        ) : (
          <Grid container spacing={2} sx={{ p: 2 }}>
            {showSummaryCards
              ? rows.map((s) => (
                  <Grid key={s.studentId} size={{ xs: 12, md: 6, lg: 4 }}>
                    <SubscriptionSummaryCard
                      studentId={s.studentId}
                      current={s.current}
                      next={s.next}
                      txt={txt}
                      lng={lng}
                      onChanged={triggerRefetch}
                    />
                  </Grid>
                ))
              : rows.map((s) => (
                  <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <SubscriptionCard
                      sub={s}
                      txt={txt}
                      lng={lng}
                      onChanged={triggerRefetch}
                    />
                  </Grid>
                ))}
          </Grid>
        )}

        <DataTablePagination
          total={total}
          page={page}
          rowsPerPage={pageSize}
          setPage={setPage}
          setRowsPerPage={setPageSize}
          td={td}
        />
      </Paper>

      {canCreate && (
        <SubscriptionCreateDialog
          open={createDialog.isOpen}
          onClose={createDialog.close}
          onCreate={create}
          txt={txt}
          loading={mut.isPostRequestLoading}
          lockedStudent={
            studentId ? { id: Number(studentId), name: studentName } : null
          }
        />
      )}
    </Box>
  );
}
