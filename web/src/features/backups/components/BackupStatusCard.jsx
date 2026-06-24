"use client";

import dayjs from "dayjs";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { FiRefreshCw, FiPlay } from "react-icons/fi";
import { useBackupsText } from "../hooks/useBackupsText.js";

/**
 * BackupStatusCard — system status card (GET /backups/status) + run-now button.
 *
 * props:
 *   status      { lastSuccessfulAt, lastSuccessfulFileName, scheduledTimeOfDay, accounts }
 *   loading     status fetch in progress
 *   onRefresh   re-fetch the status
 *   onRunNow    open the run-now dialog (when passed — gated by permission)
 *   running     a run is in progress
 */
export default function BackupStatusCard({
  status,
  loading,
  onRefresh,
  onRunNow,
  running,
}) {
  const { tr } = useBackupsText();

  const lastAt = status?.lastSuccessfulAt
    ? dayjs(status.lastSuccessfulAt).format("DD/MM/YYYY HH:mm")
    : tr.noBackupsYet;
  const lastFile = status?.lastSuccessfulFileName || "—";
  const scheduled = status?.scheduledTimeOfDay || tr.noScheduledTime;
  const accountsTotal = status?.accounts?.total ?? 0;
  const active = status?.accounts?.active;
  const activeLabel = active
    ? active.label || active.email || `#${active.id}`
    : tr.noActiveAccount;

  // Card fields as data (avoid defining a component inside render).
  const fields = [
    { key: "lastSuccessful", label: tr.lastSuccessful, value: lastAt, span: 3 },
    { key: "lastFile", label: tr.lastSuccessfulFile, value: lastFile, span: 3 },
    { key: "scheduled", label: tr.scheduledTime, value: scheduled, span: 2 },
    { key: "count", label: tr.accountsCount, value: accountsTotal, span: 2 },
    { key: "active", label: tr.activeAccount, value: activeLabel, span: 2 },
  ];

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" fontWeight={700}>
            {tr.statusTitle}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FiRefreshCw />}
              onClick={onRefresh}
              disabled={loading}
            >
              {tr.refresh}
            </Button>
            {onRunNow && (
              <Button
                size="small"
                variant="contained"
                startIcon={<FiPlay />}
                onClick={onRunNow}
                disabled={running}
              >
                {tr.runNowButton}
              </Button>
            )}
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          {fields.map((f) => (
            <Grid key={f.key} size={{ xs: 12, sm: 6, md: f.span }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {f.label}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {f.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
