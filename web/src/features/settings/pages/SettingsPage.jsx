"use client";

import { useMemo } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { PERMISSIONS, CURRENCY_OPTIONS, DEFAULT_APP_SETTINGS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { AppForm } from "../../../shared/components/index.js";
import { SETTINGS_URL } from "../config/constant.js";
import { useSettingsText } from "../config/settingsText.js";

export default function SettingsPage() {
  const txt = useSettingsText();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.SETTINGS.VIEW);
  const canManage = hasPermission(PERMISSIONS.SETTINGS.MANAGE);

  const { data, fetchData } = useRequest({
    url: SETTINGS_URL,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  const mut = useMultiRequest({
    url: SETTINGS_URL,
    onSuccess: () => fetchData(),
  });

  const defaultValues = useMemo(
    () => ({
      hourlyRate: data?.hourlyRate ?? DEFAULT_APP_SETTINGS.hourlyRate,
      currency: data?.currency ?? DEFAULT_APP_SETTINGS.currency,
    }),
    [data],
  );

  const fields = useMemo(
    () => [
      {
        name: "hourlyRate",
        label: txt.hourlyRate,
        type: "number",
        gridSize: { xs: 12, sm: 6 },
        rules: { required: txt.required },
        helperText: txt.hourlyRateHint,
      },
      {
        name: "currency",
        label: txt.currency,
        type: "select",
        gridSize: { xs: 12, sm: 6 },
        rules: { required: txt.required },
        helperText: txt.currencyHint,
        options: Object.fromEntries(
          CURRENCY_OPTIONS.map((code) => [code, txt[code] || code]),
        ),
      },
    ],
    [txt],
  );

  async function submit(values) {
    await mut.putRequest(null, {
      hourlyRate: Number(values.hourlyRate),
      currency: values.currency,
    });
  }

  if (!canView) return null;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          {txt.pageTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {txt.pageDescription}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <AppForm
                fields={fields}
                defaultValues={defaultValues}
                onSubmit={submit}
                submitLabel={txt.save}
                loading={mut.isPutRequestLoading}
                hideActions={!canManage}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
