"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { RHFTextField } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import AuthShell from "./AuthShell.jsx";
import { useAuthText } from "../config/authText.js";

export default function LoginForm() {
  const txt = useAuthText();
  const router = useRouter();
  const { lng } = useTranslation();
  const { setAuthUser } = useAuth();
  const { control, handleSubmit } = useForm({
    defaultValues: { identifier: "", password: "" },
  });

  const { fetchData, isLoading } = useRequest({
    url: "auth/login",
    method: "post",
    isPublic: true,
    shouldAutoToast: true,
    onSuccess: (res) => {
      const user = res?.data?.user;
      if (user) setAuthUser(user);
      router.replace(localePath(lng, "/dashboard"));
    },
  });

  const onSubmit = (values) => fetchData(null, values);

  return (
    <AuthShell
      title={txt.loginTitle}
      subtitle={txt.loginSubtitle}
      footer={
        <Stack spacing={1} alignItems="center">
          <Box component={Link} href={localePath(lng, "/forgot-password")} sx={{ color: "primary.main", fontWeight: 600, fontSize: 14 }}>
            {txt.forgotLink}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {txt.noAccount}{" "}
            <Box component={Link} href={localePath(lng, "/register")} sx={{ color: "primary.main", fontWeight: 600 }}>
              {txt.goRegister}
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
            name="identifier"
            control={control}
            label={txt.emailOrUsername}
            type="text"
            rules={{ required: txt.identityRequired }}
          />
          <RHFTextField
            name="password"
            control={control}
            label={txt.password}
            type="password"
            rules={{ required: txt.required }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {txt.loginButton}
          </Button>
        </Stack>
      </form>
    </AuthShell>
  );
}
