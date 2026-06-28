"use client";

import { useMemo, useState } from "react";
import { Box, Button, Chip, Link as MuiLink, Stack, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdAdd, MdCheck, MdClose, MdCancel, MdReceiptLong, MdEdit, MdAutorenew, MdOpenInNew } from "react-icons/md";
import { PERMISSIONS, USER_ROLES, subscriptionMessagesCodes } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import {
  DataTable,
  FormDialog,
  RowActionsMenu,
  useConfirm,
} from "../../../shared/components/index.js";
import {
  SUBSCRIPTIONS_URL,
  SUBSCRIPTION_STATUSES,
  STATUS_COLOR,
} from "../config/constant.js";
import { formatMoney } from "../../../shared/lib/money.js";
import { useSubscriptionsText } from "../config/subscriptionsText.js";
import SubscriptionCreateDialog from "../components/SubscriptionCreateDialog.jsx";
import EditHoursDialog from "../components/EditHoursDialog.jsx";
import InvoiceDialog from "../../invoices/components/InvoiceDialog.jsx";
import { useInvoicesText } from "../../invoices/config/invoicesText.js";
import { INVOICE_STATUS_COLOR } from "../../invoices/config/constant.js";

export default function SubscriptionsPage() {
  const txt = useSubscriptionsText();
  const { lng } = useTranslation();
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
  });

  const mut = useMultiRequest({
    url: SUBSCRIPTIONS_URL,
    onSuccess: () => triggerRefetch(),
  });

  const { fetchData: doRenew, isLoading: isRenewing } = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
    autoFetch: false,
    shouldAutoToast: true,
    syncToUrl: false,
  });

  const createDialog = useOpen();
  const rejectDialog = useOpen();
  const invoiceDialog = useOpen();
  const editHoursDialog = useOpen();
  const [invoiceTarget, setInvoiceTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [hoursTarget, setHoursTarget] = useState(null);

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

  async function renew(row) {
    async function doRenewAndNavigate(body) {
      const res = await doRenew(`${row.id}/renew`, body);
      if (res?.data?.id) {
        router.push(localePath(lng, `/dashboard/subscriptions/${res.data.id}`));
      }
    }
    try {
      await doRenewAndNavigate({});
    } catch (e) {
      if (
        e?.status === 409 &&
        e?.data?.message === subscriptionMessagesCodes.SUBSCRIPTION_STILL_ACTIVE
      ) {
        const ok = await confirm({
          title: txt.confirmRenewActive,
          intent: "warning",
        });
        if (!ok) return;
        try {
          await doRenewAndNavigate({ allowWhileActive: true });
        } catch {
          // error already toasted by shouldAutoToast
        }
      }
      // other errors already toasted
    }
  }

  const CANCELLABLE = ["PENDING", "UPCOMING", "ACTIVE"];

  const description = isAdmin
    ? txt.pageDescriptionAdmin
    : user?.role === USER_ROLES.PARENT
      ? txt.pageDescriptionParent
      : txt.pageDescriptionStudent;

  const columns = useMemo(
    () => [
      {
        field: "student",
        headerName: txt.student,
        width: 180,
        renderCell: ({ row }) =>
          row.student?.id ? (
            <MuiLink
              component={Link}
              href={localePath(lng, `/dashboard/users/${row.student.id}`)}
              underline="hover"
              fontWeight={700}
            >
              {row.student.name || `#${row.student.id}`}
            </MuiLink>
          ) : (
            row.student?.name || `#${row.studentId}`
          ),
      },
      {
        field: "studentEmail",
        headerName: txt.studentEmail,
        width: 220,
        sortable: false,
        renderCell: ({ row }) => row.student?.email || "—",
      },
      {
        field: "parents",
        headerName: txt.parents,
        width: 200,
        sortable: false,
        renderCell: ({ row }) => {
          const parents = row.student?.parents || [];
          if (parents.length === 0) return "—";
          return (
            <Stack spacing={0.25}>
              {parents.map((p) => (
                <MuiLink
                  key={p.id}
                  component={Link}
                  href={localePath(lng, `/dashboard/users/${p.id}`)}
                  underline="hover"
                  variant="body2"
                >
                  {p.name || `#${p.id}`}
                </MuiLink>
              ))}
            </Stack>
          );
        },
      },
      {
        field: "parentPhone",
        headerName: txt.parentPhone,
        width: 150,
        sortable: false,
        renderCell: ({ row }) => {
          const parents = row.student?.parents || [];
          if (parents.length === 0) return "—";
          return (
            <Stack spacing={0.25}>
              {parents.map((p) => (
                <Typography key={p.id} variant="body2">
                  {p.phone || "—"}
                </Typography>
              ))}
            </Stack>
          );
        },
      },
      {
        field: "parentEmail",
        headerName: txt.parentEmail,
        width: 220,
        sortable: false,
        renderCell: ({ row }) => {
          const parents = row.student?.parents || [];
          if (parents.length === 0) return "—";
          return (
            <Stack spacing={0.25}>
              {parents.map((p) => (
                <Typography key={p.id} variant="body2" noWrap>
                  {p.email || "—"}
                </Typography>
              ))}
            </Stack>
          );
        },
      },
      {
        field: "plan",
        headerName: txt.plan,
        width: 170,
        renderCell: ({ row }) =>
          row.plan ? (lng === "en" ? row.plan.titleEn : row.plan.titleAr) : "—",
      },
      {
        field: "totalHours",
        headerName: txt.totalHours,
        width: 110,
        sortable: false,
        renderCell: ({ row }) => row.totalHours ?? "—",
      },
      {
        field: "remainingHours",
        headerName: txt.remainingHours,
        width: 120,
        sortable: false,
        renderCell: ({ row }) => row.remainingHours ?? "—",
      },
      {
        field: "status",
        headerName: txt.status,
        width: 150,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={STATUS_COLOR[row.status] || "default"}
            label={txt[row.status] || row.status}
          />
        ),
      },
      {
        field: "invoicePaid",
        headerName: invoiceTxt.paymentStatus,
        width: 140,
        sortable: false,
        renderCell: ({ row }) =>
          row.invoice ? (
            <Chip
              size="small"
              color={INVOICE_STATUS_COLOR[row.invoice.status] || "default"}
              label={invoiceTxt[row.invoice.status] || row.invoice.status}
            />
          ) : (
            "—"
          ),
      },
      {
        field: "price",
        headerName: txt.price,
        width: 150,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack spacing={0.25} alignItems="flex-start">
            <Typography variant="body2" fontWeight={700}>
              {formatMoney(row.priceCharged, row.currency)}
            </Typography>
            {row.coupon && (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={txt.discount}
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            )}
          </Stack>
        ),
      },
      {
        field: "end",
        headerName: txt.end,
        width: 120,
        renderCell: ({ row }) =>
          row.endDate ? new Date(row.endDate).toLocaleDateString() : "—",
      },
      ...(hasRowActions
        ? [
            {
              field: "actions",
              type: "actions",
              headerName: txt.actions,
              width: 80,
              renderCell: ({ row }) => {
                const showApprove = canApprove && row.status === "PENDING";
                const showCancel =
                  canCancel && CANCELLABLE.includes(row.status);
                return (
                  <RowActionsMenu
                    actions={[
                      {
                        label: txt.view,
                        icon: <MdOpenInNew />,
                        onClick: () =>
                          router.push(
                            localePath(
                              lng,
                              `/dashboard/subscriptions/${row.id}`,
                            ),
                          ),
                      },
                      {
                        label: invoiceTxt.invoice,
                        icon: <MdReceiptLong />,
                        onClick: () => openInvoice(row),
                        hidden: !canViewInvoice,
                      },
                      {
                        label: txt.editHours,
                        icon: <MdEdit />,
                        onClick: () => openEditHours(row),
                        hidden: !canEdit,
                      },
                      {
                        label: txt.renew,
                        icon: <MdAutorenew />,
                        color: "primary",
                        onClick: () => renew(row),
                        hidden: !canRenew,
                        disabled: isRenewing,
                      },
                      {
                        label: txt.approve,
                        icon: <MdCheck />,
                        color: "success",
                        onClick: () => approve(row),
                        hidden: !showApprove,
                      },
                      {
                        label: txt.reject,
                        icon: <MdClose />,
                        color: "error",
                        onClick: () => openReject(row),
                        hidden: !showApprove,
                      },
                      {
                        label: txt.cancelSubscription,
                        icon: <MdCancel />,
                        color: "warning",
                        onClick: () => cancel(row),
                        hidden: !showCancel,
                      },
                    ]}
                  />
                );
              },
            },
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng, canApprove, canCancel, canEdit, canRenew, hasRowActions, canViewInvoice, invoiceTxt, isRenewing],
  );

  const filterConfig = useMemo(
    () => [
      {
        type: "enum",
        key: "status",
        label: txt.status,
        options: SUBSCRIPTION_STATUSES.reduce(
          (acc, s) => ({ ...acc, [s]: txt[s] }),
          {},
        ),
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
            {description}
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<MdAdd />}
            onClick={createDialog.open}
          >
            {txt.create}
          </Button>
        )}
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

      {canCreate && (
        <SubscriptionCreateDialog
          open={createDialog.isOpen}
          onClose={createDialog.close}
          onCreate={create}
          txt={txt}
          loading={mut.isPostRequestLoading}
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
