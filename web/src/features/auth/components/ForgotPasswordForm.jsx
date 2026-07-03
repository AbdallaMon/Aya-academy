"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { RHFTextField } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import AuthShell from "./AuthShell.jsx";
import { useAuthText } from "../config/authText.js";

export default function ForgotPasswordForm() {
  const txt = useAuthText();
  const { lng } = useTranslation();
  const [sent, setSent] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { email: "" } });

  const { fetchData, isLoading } = useRequest({
    url: "auth/forgot-password",
    method: "post",
    isPublic: true,
    shouldAutoToast: false, // we confirm in place instead of a toast
    onSuccess: () => setSent(true),
  });

  // The backend always answers the same way (no e-mail enumeration), so a
  // network error is the only reason not to show the confirmation panel.
  const onSubmit = (values) => fetchData(null, { ...values, locale: lng });

  const backToLogin = (
    <Box
      component={Link}
      href={localePath(lng, "/login")}
      sx={{ color: "text.secondary", fontSize: 14 }}
    >
      {txt.backToLogin}
    </Box>
  );

  if (sent) {
    return (
      <AuthShell title={txt.emailSentTitle} footer={backToLogin}>
        <Stack spacing={2} sx={{ textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            {txt.emailSentBody}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.emailSentHint}
          </Typography>
        </Stack>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={txt.forgotTitle}
      subtitle={txt.forgotSubtitle}
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <RHFTextField
            name="email"
            control={control}
            label={txt.email}
            type="email"
            rules={{
              required: txt.required,
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: txt.invalidEmail,
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {txt.forgotButton}
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
