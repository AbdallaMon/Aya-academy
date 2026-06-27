"use client";

import {
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdAdd, MdEdit } from "react-icons/md";
import { useState } from "react";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useConfirm } from "../../../shared/components/index.js";
import EditHoursDialog from "../../subscriptions/components/EditHoursDialog.jsx";
import {
  SUBSCRIPTIONS_URL,
  SUBSCRIPTION_STATUS_COLOR,
  CANCELLABLE_STATUSES,
  formatDate,
} from "../config/constant.js";

/** Student subscriptions: list + add + cancel + edit hours. */
export default function SubscriptionsTab({
  overview,
  txt,
  canAdd,
  canCancel,
  canEdit,
  onAdd,
  onRefetch,
}) {
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const subs = overview?.subscriptions || [];
  const hasActions = canCancel || canEdit;

  const editHoursDialog = useOpen();
  const [hoursTarget, setHoursTarget] = useState(null);

  const cancelReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => onRefetch?.(),
  });

  const editReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "put",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => onRefetch?.(),
  });

  async function onCancel(row) {
    const ok = await confirm({ title: txt.cancelConfirm, intent: "danger" });
    if (!ok) return;
    cancelReq.fetchData(`${row.id}/cancel`);
  }

  function openEditHours(row) {
    setHoursTarget(row);
    editHoursDialog.open();
  }

  async function saveHours(payload) {
    if (!hoursTarget) return;
    await editReq.fetchData(`${hoursTarget.id}`, payload);
    editHoursDialog.close();
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={800}>
            {txt.subscriptionsTitle}
          </Typography>
          {canAdd && (
            <Button variant="contained" size="small" startIcon={<MdAdd />} onClick={onAdd}>
              {txt.addSubscription}
            </Button>
          )}
        </Stack>

        {subs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {txt.noSubscriptions}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{txt.plan}</TableCell>
                <TableCell>{txt.startDate}</TableCell>
                <TableCell>{txt.endDate}</TableCell>
                <TableCell align="center">{txt.totalHours}</TableCell>
                <TableCell align="center">{txt.remainingHours}</TableCell>
                <TableCell>{txt.status}</TableCell>
                {hasActions && <TableCell align="right" />}
              </TableRow>
            </TableHead>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    {s.plan ? (lng === "en" ? s.plan.titleEn : s.plan.titleAr) : "—"}
                  </TableCell>
                  <TableCell>{formatDate(s.startDate, lng)}</TableCell>
                  <TableCell>{formatDate(s.endDate, lng)}</TableCell>
                  <TableCell align="center">{s.totalHours ?? "—"}</TableCell>
                  <TableCell align="center">{s.remainingHours ?? "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={SUBSCRIPTION_STATUS_COLOR[s.status] || "default"}
                      label={txt[s.status] || s.status}
                    />
                  </TableCell>
                  {hasActions && (
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {canEdit && (
                          <Tooltip title={txt.editHours}>
                            <IconButton
                              size="small"
                              onClick={() => openEditHours(s)}
                              disabled={editReq.isLoading}
                            >
                              <MdEdit />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canCancel && CANCELLABLE_STATUSES.includes(s.status) && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => onCancel(s)}
                            disabled={cancelReq.isLoading}
                          >
                            {txt.cancelSub}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {canEdit && (
        <EditHoursDialog
          open={editHoursDialog.isOpen}
          onClose={editHoursDialog.close}
          txt={txt}
          initial={hoursTarget}
          loading={editReq.isLoading}
          onSubmit={saveHours}
        />
      )}
    </Card>
  );
}
