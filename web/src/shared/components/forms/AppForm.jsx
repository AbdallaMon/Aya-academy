"use client";

import { Box, Button, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import RHFTextField from "./rhf/RHFTextField.jsx";
import RHFTextArea from "./rhf/RHFTextArea.jsx";
import RHFSelect from "./rhf/RHFSelect.jsx";
import RHFSwitch from "./rhf/RHFSwitch.jsx";
import { useTranslation } from "../../../i18n/client.js";

/**
 * AppForm — generic, schema-driven RHF form.
 *
 * fields: Array<{
 *   name, label, rules?, gridSize?,
 *   type: "text" | "textarea" | "select" | "switch" | "number" | "email" | "password" | "custom",
 *   // select only: options, translatePath
 *   // custom only: component({ control, name, label, rules, ...rest })
 *   ...rest  // forwarded to the underlying input
 * }>
 *
 * When hosted inside a FormDialog, pass an `id` so the dialog footer can submit
 * the form via requestSubmit(); AppForm then hides its own action row.
 */
export default function AppForm({
  fields = [],
  defaultValues = {},
  onSubmit,
  submitLabel,
  loading = false,
  title,
  id,
  hideActions = false,
}) {
  const { t } = useTranslation();
  const labels = t("dialogs", { returnObjects: true }) || {};
  const resolvedHideActions = hideActions || Boolean(id);

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm({
    defaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, JSON.stringify(defaultValues)]);

  function renderField(field) {
    const { type, name, label, rules, ...rest } = field;
    switch (type) {
      case "textarea":
        return <RHFTextArea name={name} control={control} label={label} rules={rules} {...rest} />;
      case "select":
        return (
          <RHFSelect
            name={name}
            control={control}
            label={label}
            rules={rules}
            options={field.options}
            translatePath={field.translatePath}
            {...rest}
          />
        );
      case "switch":
        return <RHFSwitch name={name} control={control} label={label} rules={rules} {...rest} />;
      case "custom":
        return field.component({ control, name, label, rules, setValue, getValues, watch, ...rest });
      default:
        return (
          <RHFTextField
            name={name}
            control={control}
            label={label}
            rules={rules}
            type={type}
            {...rest}
          />
        );
    }
  }

  return (
    <Box component="form" id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
      {title && (
        <Typography variant="h6" mb={2}>
          {title}
        </Typography>
      )}

      <Grid container spacing={2}>
        {fields.map((field) => (
          <Grid key={field.name} size={field.gridSize ?? { xs: 12, sm: 6 }}>
            {renderField(field)}
          </Grid>
        ))}
      </Grid>

      {!resolvedHideActions && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }} spacing={1}>
          <Button type="button" variant="outlined" onClick={() => reset(defaultValues)} disabled={loading}>
            {labels.cancel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {submitLabel ?? labels.save}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
