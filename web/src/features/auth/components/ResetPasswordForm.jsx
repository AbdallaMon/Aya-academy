"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { RHFTextField } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import AuthShell from "./AuthShell.jsx";
import { useAuthText } from "../config/authText.js";

export default function ResetPasswordForm() {
  const txt = useAuthText();
  const router = useRouter();
  const { lng } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invalid, setInvalid] = useState(false);
  const { control, handleSubmit, getValues } = useForm({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { fetchData, isLoading } = useRequest({
    url: "auth/reset-password",
    method: "post",
    isPublic: true,
    shouldAutoToast: true,
    onSuccess: () => router.replace(localePath(lng, "/login")),
    onError: (err) => {
      // Expired / already-used / tampered link → offer a fresh request.
      if (err?.message === "RESET_TOKEN_INVALID") setInvalid(true);
    },
  });

  const onSubmit = (values) => fetchData(null, { token, password: values.password });

  const requestNewLink = (
    <Box
      component={Link}
      href={localePath(lng, "/forgot-password")}
      sx={{ color: "primary.main", fontWeight: 600, fontSize: 14 }}
    >
      {txt.requestNewLink}
    </Box>
  );

  // No token in the URL, or the server rejected it → dead-end panel.
  if (!token || invalid) {
    return (
      <AuthShell title={txt.invalidLinkTitle} footer={requestNewLink}>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center" }}>
          {txt.invalidLinkBody}
        </Typography>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={txt.resetTitle}
      subtitle={txt.resetSubtitle}
      footer={
        <Box
          component={Link}
          href={localePath(lng, "/login")}
          sx={{ color: "text.secondary", fontSize: 14 }}
        >
          {txt.backToLogin}
        </Box>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <RHFTextField
            name="password"
            control={control}
            label={txt.newPassword}
            type="password"
            rules={{
              required: txt.required,
              minLength: { value: 6, message: txt.passwordShort },
            }}
          />
          <RHFTextField
            name="confirmPassword"
            control={control}
            label={txt.confirmPassword}
            type="password"
            rules={{
              required: txt.required,
              validate: (value) =>
                value === getValues("password") || txt.passwordsDontMatch,
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {txt.resetButton}
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
