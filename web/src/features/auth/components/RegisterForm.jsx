"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { matchIsValidTel } from "mui-tel-input";
import { RHFTextField, RHFPhoneField } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import AuthShell from "./AuthShell.jsx";
import { useAuthText } from "../config/authText.js";

export default function RegisterForm() {
  const txt = useAuthText();
  const router = useRouter();
  const { lng } = useTranslation();
  const { control, handleSubmit } = useForm({
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  // Registration creates a PARENT account but does NOT set session cookies
  // (only login does). On success we route to /login so the user signs in.
  // `shouldAutoToast` already shows the localized REGISTERED_SUCCESS toast from
  // the API response — don't fire a second one here.
  const { fetchData, isLoading } = useRequest({
    url: "auth/register",
    method: "post",
    isPublic: true,
    shouldAutoToast: true,
    onSuccess: () => {
      router.replace(localePath(lng, "/login"));
    },
  });

  const onSubmit = (values) => {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      phone: (values.phone || "").trim(),
      locale: lng === "en" ? "en" : "ar",
    };
    return fetchData(null, payload);
  };

  return (
    <AuthShell
      title={txt.registerTitle}
      subtitle={txt.registerSubtitle}
      footer={
        <Stack spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {txt.haveAccount}{" "}
            <Box component={Link} href={localePath(lng, "/login")} sx={{ color: "primary.main", fontWeight: 600 }}>
              {txt.goLogin}
            </Box>
          </Typography>
          <Box component={Link} href={localePath(lng, "/")} sx={{ color: "text.secondary", fontSize: 14 }}>
            {txt.backHome}
          </Box>
        </Stack>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <RHFTextField
            name="name"
            control={control}
            label={txt.name}
            rules={{ required: txt.required }}
          />
          <RHFTextField
            name="email"
            control={control}
            label={txt.email}
            type="email"
            rules={{
              required: txt.required,
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: txt.invalidEmail },
            }}
          />
          <RHFTextField
            name="password"
            control={control}
            label={txt.password}
            type="password"
            rules={{
              required: txt.required,
              minLength: { value: 6, message: txt.passwordShort },
            }}
          />
          <RHFPhoneField
            name="phone"
            control={control}
            label={txt.phone}
            rules={{
              required: txt.required,
              validate: (value) => matchIsValidTel(value || "") || txt.invalidPhone,
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {txt.registerButton}
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
