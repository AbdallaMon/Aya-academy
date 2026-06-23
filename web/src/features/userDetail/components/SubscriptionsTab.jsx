"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { MdAdd } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useConfirm } from "../../../shared/components/index.js";
import {
  SUBSCRIPTIONS_URL,
  SUBSCRIPTION_STATUS_COLOR,
  CANCELLABLE_STATUSES,
  formatDate,
} from "../config/constant.js";

/** Student subscriptions: list + add + cancel (gated SUBSCRIPTION.CANCEL). */
export default function SubscriptionsTab({
  overview,
  txt,
  canAdd,
  canCancel,
  onAdd,
  onRefetch,
}) {
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const subs = overview?.subscriptions || [];

  const cancelReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
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
                <TableCell>{txt.status}</TableCell>
                {canCancel && <TableCell align="right" />}
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
                  <TableCell>
                    <Chip
                      size="small"
                      color={SUBSCRIPTION_STATUS_COLOR[s.status] || "default"}
                      label={txt[s.status] || s.status}
                    />
                  </TableCell>
                  {canCancel && (
                    <TableCell align="right">
                      {CANCELLABLE_STATUSES.includes(s.status) && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => onCancel(s)}
                          disabled={cancelReq.isLoading}
                        >
                          {txt.cancelSub}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
