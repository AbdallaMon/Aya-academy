"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { MdAdd } from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  FormDialog,
  PageHeader,
  useConfirm,
} from "../../../shared/components/index.js";
import FilterBar from "../../../shared/components/tables/FilterBar.jsx";
import DataTablePagination from "../../../shared/components/tables/dataTable/DataTablePagination.jsx";
import { SUBSCRIPTIONS_URL } from "../config/constant.js";
import { useSubscriptionsText } from "../config/subscriptionsText.js";
import { buildSubscriptionsColumns } from "../config/subscriptionsColumns.js";
import { buildSubscriptionsFilters } from "../config/subscriptionsFilters.js";
import SubscriptionCreateDialog from "../components/SubscriptionCreateDialog.jsx";
import SubscriptionSummaryCard from "../components/SubscriptionSummaryCard.jsx";
import EditHoursDialog from "../components/EditHoursDialog.jsx";
import InvoiceDialog from "../../invoices/components/InvoiceDialog.jsx";
import RenewDialog from "../../subscriptionDetail/components/RenewDialog.jsx";
import { useInvoicesText } from "../../invoices/config/invoicesText.js";

/**
 * Subscriptions list. Standalone at /dashboard/subscriptions, and ALSO embedded
 * (with `studentId` + `embedded`) inside a user's detail page so the user-scoped
 * tab is literally the same table + the same actions (approve/renew/invoice/…)
 * for admin and parent alike — only filtered to that student.
 */
export default function SubscriptionsPage({
  studentId = null,
  studentName = null,
  embedded = false,
}) {
  const txt = useSubscriptionsText();
  const { lng, t } = useTranslation();
  const confirm = useConfirm();
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.SUBSCRIPTION.LIST);
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const canApprove = hasPermission(PERMISSIONS.SUBSCRIPTION.APPROVE) || isAdmin;
  const canCreate = hasPermission(PERMISSIONS.SUBSCRIPTION.CREATE) || isAdmin;
  const canCancel = hasPermission(PERMISSIONS.SUBSCRIPTION.CANCEL) || isAdmin;
  const canEdit = hasPermission(PERMISSIONS.SUBSCRIPTION.EDIT) || isAdmin;
  const canRenew =
    hasPermission(PERMISSIONS.SUBSCRIPTION.RENEW) ||
    hasPermission(PERMISSIONS.SUBSCRIPTION.REQUEST) ||
    isAdmin;
  const canViewInvoice = hasPermission(PERMISSIONS.INVOICE.VIEW) || isAdmin;
  const canGenerateInvoice = hasPermission(PERMISSIONS.INVOICE.GENERATE) || isAdmin;
  const canEditInvoice = hasPermission(PERMISSIONS.INVOICE.EDIT) || isAdmin;
  const hasRowActions = canApprove || canCancel || canViewInvoice || canEdit || canRenew;
  const invoiceTxt = useInvoicesText();

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
  const rejectDialog = useOpen();
  const invoiceDialog = useOpen();
  const editHoursDialog = useOpen();
  const renewDialog = useOpen();
  const [invoiceTarget, setInvoiceTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [hoursTarget, setHoursTarget] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);

  function openInvoice(row) {
    setInvoiceTarget(row);
    invoiceDialog.open();
  }

  async function approve(row) {
    const ok = await confirm({ title: txt.confirmApprove, intent: "info" });
    if (!ok) return;
    await mut.postRequest(`${row.id}/approve`, {});
  }
  function openReject(row) {
    setRejectTarget(row);
    setRejectReason("");
    rejectDialog.open();
  }
  async function confirmReject() {
    if (!rejectTarget) return;
    await mut.postRequest(`${rejectTarget.id}/reject`, {
      reason: rejectReason || undefined,
    });
    rejectDialog.close();
  }
  async function cancel(row) {
    const ok = await confirm({ title: txt.confirmCancel, intent: "danger" });
    if (!ok) return;
    await mut.postRequest(`${row.id}/cancel`, {});
  }
  async function create(payload) {
    await mut.postRequest(null, payload);
    createDialog.close();
  }
  function openEditHours(row) {
    setHoursTarget(row);
    editHoursDialog.open();
  }
  async function saveHours(payload) {
    if (!hoursTarget) return;
    await mut.putRequest(`${hoursTarget.id}`, payload);
    editHoursDialog.close();
  }

  function openRenew(row) {
    setRenewTarget(row);
    renewDialog.open();
  }

  const description = isAdmin
    ? txt.pageDescriptionAdmin
    : user?.role === USER_ROLES.PARENT
      ? txt.pageDescriptionParent
      : txt.pageDescriptionStudent;

  const columns = useMemo(
    () =>
      buildSubscriptionsColumns({
        txt,
        lng,
        invoiceTxt,
        router,
        can: {
          approve: canApprove,
          cancel: canCancel,
          edit: canEdit,
          renew: canRenew,
          viewInvoice: canViewInvoice,
        },
        hasRowActions,
        actions: { openInvoice, openEditHours, openRenew, approve, openReject, cancel },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng, canApprove, canCancel, canEdit, canRenew, hasRowActions, canViewInvoice, invoiceTxt],
  );

  const filterConfig = useMemo(
    () => buildSubscriptionsFilters({ txt }),
    [txt],
  );

  // The list endpoint returns TWO shapes (V2-5): when scoped to a student it
  // returns RAW subscription rows (→ table); globally it returns one summary per
  // student `{ studentId, current, next }` (→ combined-card grid). Detect from
  // the actual payload shape when we have rows, else from whether a studentId
  // scope is active (prop OR a ?studentId= URL filter).
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

      {showSummaryCards ? (
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
              {rows.map((s) => (
                <Grid key={s.studentId} size={{ xs: 12, md: 6, lg: 4 }}>
                  <SubscriptionSummaryCard
                    studentId={s.studentId}
                    current={s.current}
                    next={s.next}
                    txt={txt}
                    lng={lng}
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
      ) : (
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
      )}

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

      {canRenew && renewTarget && (
        <RenewDialog
          open={renewDialog.isOpen}
          onClose={() => {
            renewDialog.close();
            triggerRefetch();
          }}
          subscription={renewTarget}
          txt={txt}
        />
      )}

      <FormDialog
        open={rejectDialog.isOpen}
        onClose={rejectDialog.close}
        title={txt.rejectTitle}
        maxWidth="xs"
        loading={mut.isPostRequestLoading}
        submitText={txt.reject}
        cancelText={txt.cancel}
        submitColor="error"
        onSubmit={confirmReject}
      >
        <TextField
          label={txt.rejectReason}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 1 }}
        />
      </FormDialog>

      {canEdit && (
        <EditHoursDialog
          open={editHoursDialog.isOpen}
          onClose={editHoursDialog.close}
          txt={txt}
          initial={hoursTarget}
          loading={mut.isPutRequestLoading}
          onSubmit={saveHours}
        />
      )}

      {canViewInvoice && (
        <InvoiceDialog
          open={invoiceDialog.isOpen}
          onClose={invoiceDialog.close}
          subscriptionId={invoiceTarget?.id}
          canGenerate={canGenerateInvoice}
          canEdit={canEditInvoice}
          onChanged={triggerRefetch}
        />
      )}
    </Box>
  );
}
