"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
} from "@mui/material";
import { PERMISSIONS, CURRENCY_OPTIONS, DEFAULT_APP_SETTINGS } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import {
  PageHeader,
  RHFTextField,
  RHFSelect,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useTranslation } from "../../../i18n/client.js";
import { SETTINGS_URL } from "../config/constant.js";
import { useSettingsText } from "../config/settingsText.js";

export default function SettingsPage() {
  const txt = useSettingsText();
  const { t } = useTranslation();
  const dialogLabels = t("dialogs", { returnObjects: true }) || {};
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.SETTINGS.VIEW);
  const canManage = hasPermission(PERMISSIONS.SETTINGS.MANAGE);

  const { data, fetchData } = useRequest({
    url: SETTINGS_URL,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  const defaultValues = useMemo(
    () => ({
      hourlyRate: data?.hourlyRate ?? DEFAULT_APP_SETTINGS.hourlyRate,
      currency: data?.currency ?? DEFAULT_APP_SETTINGS.currency,
      whiteboardRetentionDays:
        data?.whiteboardRetentionDays ?? DEFAULT_APP_SETTINGS.whiteboardRetentionDays,
    }),
    [data],
  );

  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues,
    mode: "onTouched",
  });

  // Seed the form from the fetched settings once they arrive (and on refetch).
  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, JSON.stringify(defaultValues)]);

  const currencyOptions = useMemo(
    () =>
      Object.fromEntries(
        CURRENCY_OPTIONS.map((code) => [code, txt[code] || code]),
      ),
    [txt],
  );

  const { fetchData: save, isLoading } = useRequest({
    url: SETTINGS_URL,
    method: "put",
    shouldAutoToast: true,
    onSuccess: () => fetchData(),
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          hourlyRate: txt.hourlyRate,
          currency: txt.currency,
          whiteboardRetentionDays: txt.whiteboardRetention,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  function submit(values) {
    save(null, {
      hourlyRate: Number(values.hourlyRate),
      currency: values.currency,
      whiteboardRetentionDays: Number(values.whiteboardRetentionDays),
    });
  }

  if (!canView) return null;

  return (
    <Box>
      <PageHeader title={txt.pageTitle} description={txt.pageDescription} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField
                      name="hourlyRate"
                      control={control}
                      label={txt.hourlyRate}
                      type="number"
                      rules={{ required: txt.required }}
                      helperText={txt.hourlyRateHint}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFSelect
                      name="currency"
                      control={control}
                      label={txt.currency}
                      options={currencyOptions}
                      rules={{ required: txt.required }}
                      helperText={txt.currencyHint}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField
                      name="whiteboardRetentionDays"
                      control={control}
                      label={txt.whiteboardRetention}
                      type="number"
                      rules={{ required: txt.required, min: 1, max: 180 }}
                      helperText={txt.whiteboardRetentionHint}
                    />
                  </Grid>
                </Grid>

                {canManage && (
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    sx={{ mt: 2 }}
                    spacing={1}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => reset(defaultValues)}
                      disabled={isLoading}
                    >
                      {dialogLabels.cancel}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={16} /> : null}
                    >
                      {txt.save}
                    </Button>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
